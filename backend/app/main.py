"""
RailOps Intelligence Platform - Main FastAPI Application.
Industry-level railway operations intelligence, ML predictions, and real-time monitoring.
"""

import logging
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.database.session import Base, engine, SessionLocal
from backend.app.database.models import Train
from backend.app.database.seed import seed_database
from backend.app.api.v1.endpoints import router as api_v1_router
from backend.app.monitoring.metrics import MetricsMiddleware, metrics_collector

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("railops.main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Railway Intelligence & Operations Platform Command Center.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Observability Middleware
app.add_middleware(MetricsMiddleware)

# API Routers
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def startup_event():
    logger.info("Initializing RailOps Intelligence Backend...")
    # Verify tables and auto-seed if clean database
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Train).count() == 0:
            logger.info("Database empty. Auto-seeding initial synthetic railway dataset...")
            seed_database()
        else:
            logger.info("Database records verified.")
    finally:
        db.close()
    logger.info(f"RailOps Intelligence v{settings.VERSION} ready.")

@app.get("/metrics", summary="Prometheus Scraping Metrics Endpoint")
def get_metrics():
    """Returns Prometheus formatted metrics for operational monitoring."""
    metrics_text = metrics_collector.generate_prometheus_text()
    return Response(content=metrics_text, media_type="text/plain; version=0.0.4")

@app.get("/", summary="Root System Status")
def root_info():
    return {
        "platform": "RailOps Intelligence",
        "version": settings.VERSION,
        "environment": "Production Ready",
        "command_center": "ACTIVE",
        "api_docs": "/docs",
        "metrics": "/metrics"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
