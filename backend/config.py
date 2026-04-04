from __future__ import annotations

import os
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT_DIR / "docs"
DATA_DIR = ROOT_DIR / "data"
ML_ARTIFACTS_DIR = ROOT_DIR / "ml" / "artifacts"
SCHEMA_PATH = DOCS_DIR / "schema.json"
DATASET_PATH = DATA_DIR / "synthetic_bone_fracture_healing.csv"
MODEL_PATH = ML_ARTIFACTS_DIR / "model.joblib"
FEATURES_PATH = ML_ARTIFACTS_DIR / "features.json"
METRICS_PATH = ML_ARTIFACTS_DIR / "metrics.json"

DEFAULT_ALLOWED_ORIGINS = (
    "http://localhost:3000,"
    "http://127.0.0.1:3000,"
    "http://localhost:5173,"
    "http://127.0.0.1:5173"
)


def get_allowed_origins() -> list[str]:
    origins = os.getenv("ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS)
    return [origin.strip() for origin in origins.split(",") if origin.strip()]
