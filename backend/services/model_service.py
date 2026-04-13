from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import joblib

from backend.config import FEATURES_PATH, METRICS_PATH, MODEL_PATH, SCHEMA_PATH
from backend.schemas import ModelInfoResponse, PredictionRequest, PredictionResponse
from backend.services.recommendations import build_rehab_tips
from ml.inference import (
    category_probabilities,
    ordered_frame,
    patient_specific_drivers,
    predict_weeks_distribution,
    top_features_from_drivers,
    weeks_to_category,
)


@dataclass(slots=True)
class ModelService:
    model: dict[str, Any]
    feature_order: list[str]
    metrics: dict[str, Any]
    model_type: str
    model_version: str
    date_trained: str

    @staticmethod
    def _ensure_artifacts_exist() -> None:
        required = (MODEL_PATH, FEATURES_PATH, METRICS_PATH)
        missing = [path for path in required if not path.exists()]
        if not missing:
            return

        try:
            from ml.train_model import main as train_main

            # Bootstrap artifacts on first run for local/dev environments.
            train_main()
        except Exception as exc:  # pragma: no cover - startup guard
            missing_paths = ", ".join(str(path) for path in missing)
            raise RuntimeError(
                f"Failed to generate missing artifacts ({missing_paths}). "
                "Run `python3 ml/train_model.py` and retry."
            ) from exc

    @classmethod
    def load(cls) -> "ModelService":
        for path in (SCHEMA_PATH,):
            if not path.exists():
                raise RuntimeError(f"Required artifact is missing: {path}")

        cls._ensure_artifacts_exist()

        for path in (MODEL_PATH, FEATURES_PATH, METRICS_PATH):
            if not path.exists():
                raise RuntimeError(f"Required artifact is missing: {path}")

        model = joblib.load(MODEL_PATH)
        feature_order = json.loads(FEATURES_PATH.read_text())
        metrics = json.loads(METRICS_PATH.read_text())
        schema = json.loads(SCHEMA_PATH.read_text())

        if not isinstance(model, dict) or "point_model" not in model or "ensemble_models" not in model:
            raise RuntimeError("model.joblib must contain the serialized regression bundle.")

        if not isinstance(feature_order, list) or not all(isinstance(item, str) for item in feature_order):
            raise RuntimeError("features.json must contain a JSON array of feature names.")

        if feature_order != schema["required"]:
            raise RuntimeError("features.json does not match docs/schema.json field order.")

        if feature_order != list(PredictionRequest.model_fields.keys()):
            raise RuntimeError("PredictionRequest fields do not match features.json.")

        selected_model = metrics.get("selected_model", {})
        model_type = str(selected_model.get("name", model.get("model_name", "regression_bundle")))
        model_version = str(selected_model.get("version", "v2"))
        date_trained = str(
            selected_model.get("date_trained")
            or datetime.fromtimestamp(MODEL_PATH.stat().st_mtime, tz=UTC).isoformat()
        )

        return cls(
            model=model,
            feature_order=feature_order,
            metrics=metrics,
            model_type=model_type,
            model_version=model_version,
            date_trained=date_trained,
        )

    def predict(self, request: PredictionRequest) -> PredictionResponse:
        payload = request.model_dump()
        frame = ordered_frame(payload, self.feature_order)
        week_distribution = predict_weeks_distribution(frame, self.model)
        probabilities = category_probabilities(
            predicted_weeks=week_distribution["predicted_weeks"],
            sigma=max(float(week_distribution["interval_half_width"]) / 1.2816, self.model["calibration"]["sigma_floor"]),
            thresholds=self.model["category_thresholds"],
        )
        category = weeks_to_category(week_distribution["predicted_weeks"], self.model["category_thresholds"])
        driver_signals = patient_specific_drivers(frame, self.model, self.feature_order)

        return PredictionResponse(
            predicted_weeks=week_distribution["predicted_weeks"],
            week_range_low=week_distribution["week_range_low"],
            week_range_high=week_distribution["week_range_high"],
            week_range=f"{week_distribution['week_range_low']:.1f}-{week_distribution['week_range_high']:.1f} weeks",
            category=category,
            confidence=max(probabilities.values()),
            uncertainty_weeks=week_distribution["interval_half_width"],
            probabilities=probabilities,
            top_features=top_features_from_drivers(driver_signals),
            driver_signals=[
                {
                    "feature": item["feature"],
                    "effect_weeks": item["effect_weeks"],
                    "direction": item["direction"],
                }
                for item in driver_signals
            ],
            rehab_tips=build_rehab_tips(payload),
        )

    def model_info(self) -> ModelInfoResponse:
        return ModelInfoResponse(
            type=self.model_type,
            version=self.model_version,
            date_trained=self.date_trained,
        )
