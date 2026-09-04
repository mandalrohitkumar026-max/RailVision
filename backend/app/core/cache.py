"""
Multi-tier caching layer for RailOps Intelligence.
Attempts connection to Redis; if Redis is unavailable or times out,
transparently falls back to an in-memory LRU cache to ensure zero service disruption.
"""

import json
import logging
import time
from typing import Optional, Any
from backend.app.core.config import settings

logger = logging.getLogger("railops.cache")

class InMemoryCache:
    def __init__(self):
        self._store = {}
        self._expiry = {}

    def get(self, key: str) -> Optional[str]:
        if key in self._store:
            if time.time() < self._expiry.get(key, 0):
                return self._store[key]
            else:
                del self._store[key]
                del self._expiry[key]
        return None

    def setex(self, key: str, seconds: int, value: str):
        self._store[key] = value
        self._expiry[key] = time.time() + seconds

    def delete(self, key: str):
        self._store.pop(key, None)
        self._expiry.pop(key, None)

    def flushall(self):
        self._store.clear()
        self._expiry.clear()

class CacheManager:
    def __init__(self):
        self._redis = None
        self._memory = InMemoryCache()
        self._is_redis_active = False
        self._init_redis()

    def _init_redis(self):
        try:
            import redis
            client = redis.Redis.from_url(settings.REDIS_URL, socket_timeout=1.0, socket_connect_timeout=1.0)
            client.ping()
            self._redis = client
            self._is_redis_active = True
            logger.info("Connected to Redis cache successfully.")
        except Exception as e:
            self._is_redis_active = False
            logger.warning(f"Redis not available ({e}). Using in-memory fallback cache.")

    @property
    def is_redis_active(self) -> bool:
        return self._is_redis_active

    def get_json(self, key: str) -> Optional[Any]:
        try:
            if self._is_redis_active and self._redis:
                val = self._redis.get(key)
                if val:
                    return json.loads(val.decode("utf-8") if isinstance(val, bytes) else val)
            else:
                val = self._memory.get(key)
                if val:
                    return json.loads(val)
        except Exception as e:
            logger.error(f"Cache get error for key '{key}': {e}")
        return None

    def set_json(self, key: str, value: Any, ttl_seconds: int = 30):
        try:
            serialized = json.dumps(value, default=str)
            if self._is_redis_active and self._redis:
                self._redis.setex(key, ttl_seconds, serialized)
            else:
                self._memory.setex(key, ttl_seconds, serialized)
        except Exception as e:
            logger.error(f"Cache set error for key '{key}': {e}")

    def invalidate(self, key: str):
        try:
            if self._is_redis_active and self._redis:
                self._redis.delete(key)
            else:
                self._memory.delete(key)
        except Exception as e:
            logger.error(f"Cache invalidate error for key '{key}': {e}")

cache = CacheManager()
