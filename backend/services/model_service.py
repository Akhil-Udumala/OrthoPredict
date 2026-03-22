from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import joblib
import pandas as pd

from backend.config import FEATURES_PATH, METRICS_PATH, MODEL_PATH, SCHEMA_PATH
from backend.schemas import ModelInfoResponse, PredictionRequest, PredictionResponse
from backend.services.recommendations import build_rehab_tips


EXPECTED_CATEGORY_ORDER = ("short", "medium", "long")
DEFAULT_WEEK_RANGES = {
    "short": "0-6 weeks",
    "medium": "6-16 weeks",
    "long": "16+ weeks",
}
PLACEHOLDER_TOP_FEATURES = [
    {"feature": "fracture_type", "importance": 0.75},
    {"feature": "age", "importance": 0.07},
    {"feature": "bone_affected", "importance": 0.06},
]


@dataclass(slots=True)
class ModelService:
    model: Any
    feature_order: list[str]
    metrics: dict[str, Any]
    model_type: str
    model_version: str
    date_trained: str

    @classmethod
    def load(cls) -> "ModelService":
        for path in (MODEL_PATH, FEATURES_PATH, METRICS_PATH, SCHEMA_PATH):
            if not path.exists():
                raise RuntimeError(f"Required artifact is missing: {path}")

        model = joblib.load(MODEL_PATH)
        feature_order = json.loads(FEATURES_PATH.read_text())
        metrics = json.loads(METRICS_PATH.read_text())
        schema = json.loads(SCHEMA_PATH.read_text())

        if not isinstance(feature_order, list) or not all(isinstance(item, str) for item in feature_order):
            raise RuntimeError("features.json must contain a JSON array of feature names.")

        schema_field_order = list(schema["properties"].keys())
        if feature_order != schema_field_order:
            raise RuntimeError("features.json does not match docs/schema.json field order.")

        if feature_order != list(PredictionRequest.model_fields.keys()):
            raise RuntimeError("PredictionRequest fields do not match features.json.")

        selected_model = metrics.get("selected_model", {})
        model_type = str(selected_model.get("name", type(model).__name__))
        model_version = str(selected_model.get("version", "v1"))
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
        frame = self._ordered_frame(payload)

        predicted_category = str(self.model.predict(frame)[0])
        raw_probabilities = self.model.predict_proba(frame)[0]
        probability_lookup = {
            str(label): float(probability)
            for label, probability in zip(self.model.classes_, raw_probabilities, strict=True)
        }
        probabilities = self._normalized_probabilities(probability_lookup)
        week_range = self._week_range_for(predicted_category)

        return PredictionResponse(
            category=predicted_category,
            week_range=week_range,
            confidence=max(probabilities.values()),
            probabilities=probabilities,
            top_features=self._top_features(),
            rehab_tips=build_rehab_tips(payload),
        )

    def model_info(self) -> ModelInfoResponse:
        return ModelInfoResponse(
            type=self.model_type,
            version=self.model_version,
            date_trained=self.date_trained,
        )

    def _ordered_frame(self, payload: dict[str, Any]) -> pd.DataFrame:
        ordered_row = [payload[feature] for feature in self.feature_order]
        return pd.DataFrame([ordered_row], columns=self.feature_order)

    def _normalized_probabilities(self, probability_lookup: dict[str, float]) -> dict[str, float]:
        probabilities = {
            category: float(probability_lookup.get(category, 0.0))
            for category in EXPECTED_CATEGORY_ORDER
        }
        total = sum(probabilities.values())
        if total <= 0:
            raise RuntimeError("Model returned invalid probabilities.")

        normalized = {
            category: value / total
            for category, value in probabilities.items()
        }
        rounded = {
            category: round(value, 4)
            for category, value in normalized.items()
        }

        difference = round(1.0 - sum(rounded.values()), 4)
        if difference:
            highest_category = max(rounded, key=rounded.get)
            rounded[highest_category] = round(rounded[highest_category] + difference, 4)

        return rounded

    def _top_features(self) -> list[dict[str, Any]]:
        selected_model = self.metrics.get("selected_model", {})
        feature_rows = selected_model.get("permutation_importance", [])
        if not isinstance(feature_rows, list) or len(feature_rows) < 3:
            return PLACEHOLDER_TOP_FEATURES

        top_features: list[dict[str, Any]] = []
        for row in feature_rows[:3]:
            top_features.append(
                {
                    "feature": str(row["feature"]),
                    "importance": round(float(row["importance"]), 4),
                }
            )
        return top_features

    def _week_range_for(self, category: str) -> str:
        selected_model = self.metrics.get("selected_model", {})
        week_ranges = selected_model.get("week_ranges", DEFAULT_WEEK_RANGES)
        return str(week_ranges.get(category, DEFAULT_WEEK_RANGES[category]))
