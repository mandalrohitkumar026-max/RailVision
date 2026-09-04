# RailOps Intelligence: Railway Operations Command Center & ML Platform

[![CI/CD Pipeline](https://github.com/railops/railops-intelligence/actions/workflows/ci.yml/badge.svg)](.github/workflows/ci.yml)
[![FastAPI](https://img.shields.io/badge/API-FastAPI%200.115-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TS-61dafb.svg)](https://react.dev)
[![XGBoost](https://img.shields.io/badge/ML-XGBoost%20%2B%20MLflow-FF6600.svg)](https://xgboost.readthedocs.io)
[![Observability](https://img.shields.io/badge/Observability-Prometheus%20%2B%20Grafana-E6522C.svg)](https://prometheus.io)

An industry-grade railway operations intelligence platform modeled after modern airline operations control centers (AOCC) and freight dispatch towers. RailOps Intelligence connects raw railway telemetry, feature engineering, machine learning pipelines, model version registries, low-latency REST APIs, caching layers, and a dense, data-first operations dashboard.

---

## 1. Primary Operational Capabilities

- **Delay Prediction & Attribution**: Predicts train arrival delays in minutes using gradient-boosted tree regressors (`XGBoost`) with transparent model feature attribution (previous station delay propagation, weather severity, corridor congestion index, and dwell variances).
- **Severe Delay & Cancellation Risk**: Calibrated classifiers predicting `P(delay >= 30 min)` and `P(cancellation)` with operational risk classifications (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- **Passenger Demand Forecasting**: Multi-horizon forecasting (3, 7, 14 days) across seating classes (1A, 2A, 3A, SL) with 95% confidence bounds and weekly/holiday seasonality adjustments.
- **Capacity Planning & Coach Recommendations**: Automated recommendation engine comparing projected occupancy against capacity thresholds (`>105%`), with operator review workflows (`PENDING_APPROVAL` &rarr; `APPROVED` &rarr; `DISPATCHED`).
- **Anomaly Detection Center**: Statistical and isolation forest detection for station dwell time spikes (e.g., Kota Junction +139%), route congestion bunching, and sudden waitlist booking surges.
- **Station & Corridor Intelligence**: Real-time arrival/departure boards, platform occupancy forecasts, corridor bottleneck identification, and historical reliability ratings.
- **ML Model Center & MLflow Integration**: Model registry tracking `v1.8` production models, MAE, RMSE, R², Precision, Recall, F1, ROC-AUC, and candidate architecture benchmarks.
- **Enterprise Observability**: End-to-end telemetry instrumentation with Prometheus `/metrics` scraping and Grafana dashboards.

---

## 2. Project Architecture

```
RailVision/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints.py       # REST API endpoints
│   │   ├── core/
│   │   │   ├── config.py             # Settings & environment variables
│   │   │   └── cache.py              # Redis + In-Memory multi-tier cache
│   │   ├── database/
│   │   │   ├── session.py            # SQLAlchemy engine (SQLite / PostgreSQL)
│   │   │   ├── models.py             # Normalized relational ORM tables
│   │   │   └── seed.py               # Database seeder with trunk timetables
│   │   ├── ml/
│   │   │   └── inference_engine.py   # Low-latency model inference loader
│   │   ├── monitoring/
│   │   │   └── metrics.py            # Prometheus metrics collector & middleware
│   │   ├── schemas/                  # Pydantic v2 schemas
│   │   ├── services/                 # Business logic for operations, trains, demand, etc.
│   │   └── main.py                   # FastAPI application entry point
│   ├── tests/
│   │   ├── test_api.py               # API & workflow integration tests
│   │   └── test_ml_pipeline.py       # Feature engineering & ML tests
│   └── requirements.txt              # Python production dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/               # TopOperationalRibbon, Sidebar, StatusBadge, Modals
│   │   ├── pages/                    # Overview, Trains, Demand, Capacity, Anomalies, etc.
│   │   ├── services/api.ts           # REST API client
│   │   ├── types/index.ts            # TypeScript definitions
│   │   ├── App.tsx                   # Master operational layout
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── ml/
│   ├── data/synthetic_generator.py   # Indian Railways synthetic dataset generator
│   ├── features/feature_pipeline.py  # Leak-free feature engineering pipeline
│   ├── models/                       # Trained .joblib artifacts & registry metadata
│   └── training/train_models.py      # ML model training & MLflow logging script
│
├── infra/
│   ├── docker/                       # Backend/Frontend Dockerfiles & Nginx config
│   ├── prometheus/prometheus.yml     # Prometheus scraping configuration
│   └── grafana/provisioning/         # Grafana datasources & dashboard provisioning
│
├── .github/workflows/ci.yml          # GitHub Actions automated test & build workflow
├── docker-compose.yml                # 7-service full stack Docker composition
└── README.md
```

---

## 3. Quickstart & Local Setup

### Prerequisites
- Python 3.10+ (Python 3.11–3.14 compatible)
- Node.js 18+ and npm
- Optional: Docker & Docker Compose

### Option A: Local Development (Instant Zero-Config Mode)
The platform features an automated dual-mode architecture: if PostgreSQL or Redis are not running locally, it seamlessly falls back to high-performance SQLite (`railops.db`) and an in-memory cache with zero configuration required.

1. **Install Backend Dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

2. **Train Models & Seed Database**:
   ```bash
   # Train XGBoost regressor, severe delay classifier, demand forecaster
   python -m ml.training.train_models

   # Initialize SQLite database and seed 16 trains, 36 stations, 6 trunk corridors
   python -m backend.app.database.seed
   ```

3. **Start FastAPI Backend Server**:
   ```bash
   uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - Swagger Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
   - Prometheus Metrics: [http://localhost:8000/metrics](http://localhost:8000/metrics)

4. **Start React Operations Dashboard**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   - Open Command Center: [http://localhost:3000](http://localhost:3000)

---

## 4. Full Docker Stack Launch

To launch all 7 enterprise services in isolated containers:
```bash
docker-compose up -d --build
```

### Services & Ports
| Service | Container Name | Port | Description |
|---|---|---|---|
| **Frontend** | `railops_frontend` | `http://localhost:3000` | Nginx React Operations Dashboard |
| **Backend** | `railops_backend` | `http://localhost:8000` | FastAPI REST API Server |
| **PostgreSQL** | `railops_postgres` | `5432` | PostgreSQL 16 Relational Database |
| **Redis** | `railops_redis` | `6379` | Redis 7 Operational Cache |
| **MLflow** | `railops_mlflow` | `http://localhost:5000` | MLflow Model Registry & Tracking |
| **Prometheus** | `railops_prometheus` | `http://localhost:9090` | Observability & Metrics Scraper |
| **Grafana** | `railops_grafana` | `http://localhost:3001` | Operations Monitoring Dashboards |

To stop the containers:
```bash
docker-compose down
```

---

## 5. Automated Verification & Testing

The repository contains a full automated pytest suite verifying API endpoints, feature pipelines, anomaly detection, and ML outputs:

```bash
# Run backend pytest suite
pytest backend/tests -v

# Run frontend production build & typecheck
cd frontend
npm run build
```

---

## 6. Environment Variables (`.env`)

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./railops.db` | PostgreSQL or SQLite connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis caching instance |
| `CACHE_EXPIRATION_SECONDS` | `30` | Operational cache TTL |
| `MLFLOW_TRACKING_URI` | `http://localhost:5000` | MLflow tracking server endpoint |
| `SEVERE_DELAY_THRESHOLD_MIN` | `30` | Threshold defining severe delay status |
| `HIGH_OCCUPANCY_THRESHOLD_PCT` | `105.0` | Threshold triggering coach recommendation |

---

## 7. Machine Learning Models & Registry

The system employs 4 specialized production models:

| Model Task | Algorithm | Production Version | Primary Metric |
|---|---|---|---|
| **Arrival Delay Prediction** | XGBoost Regressor | `v1.8` | MAE: **3.56 min** &middot; R²: **0.985** |
| **Severe Delay Classification** | Gradient Boosting | `v1.8` | ROC-AUC: **0.994** &middot; F1: **0.947** |
| **Cancellation Risk** | Calibrated Trees | `v1.8` | ROC-AUC: **0.950** &middot; Precision: **0.920** |
| **Passenger Demand** | Gradient Boosting Regressor | `v1.8` | MAE: **75 pax** &middot; R²: **0.872** |

### Retraining Pipeline
To retrain and register new model artifacts:
```bash
python -m ml.training.train_models
```

---

## 8. Synthetic Data & Production Real-Data Integration

### Synthetic Components (Labeled in Demo)
- **Train Schedules & GPS Coordinates**: Modeled faithfully on major Indian Railways trunk corridors (e.g., 12951 Mumbai Rajdhani, 12273 Howrah Duronto, 22436 Vande Bharat).
- **Historical Delays & Incident Telemetry**: Synthesized over a 45-day baseline with realistic log-normal distributions, junction switch lags, and speed restrictions.
- **Weather Telemetry**: Synthesized rainfall (mm) and fog visibility distance (meters) generating weather adversity indexes.

### Replacing Synthetic Data with Real Railway APIs
To connect production railway data:
1. **Live GPS / Telemetry**: Replace `ml/data/synthetic_generator.py` with an ingestion adapter for the National Train Enquiry System (NTES) or freight FOIS/COIS messaging broker (Kafka/MQTT).
2. **Timetable / Schedule GTFS**: Ingest official railway timetable GTFS feeds directly into the `train_schedules` and `route_stations` tables.
3. **Weather Feed**: Plug in open APIs (e.g., Open-Meteo or IMD) via a scheduled cron task updating station weather conditions in the database.
4. **Ticketing / PNR Bookings**: Connect PRS (Passenger Reservation System) waitlist snapshots to feed the online demand forecast endpoint (`/api/v1/predictions/demand`).
