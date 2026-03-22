from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import pandas as pd


ML_DIR = Path(__file__).resolve().parent
ROOT = ML_DIR.parent
SCHEMA_PATH = ROOT / "docs" / "schema.json"
ARTIFACTS_DIR = ML_DIR / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model.joblib"
FEATURES_PATH = ARTIFACTS_DIR / "features.json"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"


def load_schema() -> dict[str, Any]:
    return json.loads(SCHEMA_PATH.read_text())


def load_features() -> list[str]:
    return json.loads(FEATURES_PATH.read_text())


def load_metrics() -> dict[str, Any]:
    return json.loads(METRICS_PATH.read_text())


def validate_payload(payload: dict[str, Any], schema: dict[str, Any]) -> None:
    if not isinstance(payload, dict):
        raise ValueError("Prediction input must be a JSON object.")

    required = schema["required"]
    properties = schema["properties"]

    missing = [feature for feature in required if feature not in payload]
    extras = [feature for feature in payload if feature not in required]
    if missing:
        raise ValueError(f"Missing required fields: {missing}")
    if extras:
        raise ValueError(f"Unexpected fields: {extras}")

    for feature in required:
        value = payload[feature]
        spec = properties[feature]
        expected_type = spec["type"]

        if expected_type == "integer":
            if isinstance(value, bool) or not isinstance(value, int):
                raise ValueError(f"{feature} must be an integer.")
        elif expected_type == "number":
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise ValueError(f"{feature} must be a number.")
        elif expected_type == "boolean":
            if not isinstance(value, bool):
                raise ValueError(f"{feature} must be a boolean.")
        elif expected_type == "string":
            if not isinstance(value, str):
                raise ValueError(f"{feature} must be a string.")

        if "minimum" in spec and value < spec["minimum"]:
            raise ValueError(f"{feature} must be >= {spec['minimum']}.")
        if "maximum" in spec and value > spec["maximum"]:
            raise ValueError(f"{feature} must be <= {spec['maximum']}.")
        if "enum" in spec and value not in spec["enum"]:
            raise ValueError(f"{feature} must be one of {spec['enum']}.")


def ordered_frame(payload: dict[str, Any], features: list[str]) -> pd.DataFrame:
    return pd.DataFrame([[payload[feature] for feature in features]], columns=features)


def rehab_tips(payload: dict[str, Any]) -> list[str]:
    tips: list[str] = []
    if payload["nutrition_score"] <= 5:
        tips.append("Improve protein, calcium, and vitamin D intake to support bone repair.")
    if payload["rehab_adherence"] <= 5:
        tips.append("Follow the prescribed rehabilitation plan consistently to improve recovery speed.")
    if payload["smoker"]:
        tips.append("Smoking cessation can improve blood flow and support fracture healing.")
    if payload["diabetes"]:
        tips.append("Keep blood glucose tightly controlled during recovery to reduce healing delays.")
    if payload["osteoporosis"]:
        tips.append("Review bone health treatment and fall prevention with your clinician.")

    fallback_tips = [
        "Attend follow-up visits so healing progress can be assessed on time.",
        "Maintain steady sleep, hydration, and balanced meals throughout recovery.",
        "Avoid loading the injured bone beyond the limits set by your clinician.",
    ]
    for tip in fallback_tips:
        if len(tips) >= 3:
            break
        if tip not in tips:
            tips.append(tip)

    return tips[:3]


def predict_from_payload(payload: dict[str, Any]) -> dict[str, Any]:
    schema = load_schema()
    features = load_features()
    metrics = load_metrics()
    validate_payload(payload, schema)

    model = joblib.load(MODEL_PATH)
    frame = ordered_frame(payload, features)

    predicted_category = str(model.predict(frame)[0])
    probabilities = model.predict_proba(frame)[0]
    probability_lookup = {
        label: round(float(probability), 4)
        for label, probability in zip(model.classes_, probabilities, strict=True)
    }
    class_probabilities = {
        "short": probability_lookup.get("short", 0.0),
        "medium": probability_lookup.get("medium", 0.0),
        "long": probability_lookup.get("long", 0.0),
    }
    top_features = metrics["selected_model"]["permutation_importance"][:3]
    week_range = metrics["selected_model"]["week_ranges"][predicted_category]

    return {
        "category": predicted_category,
        "week_range": week_range,
        "confidence": round(float(max(probabilities)), 4),
        "probabilities": class_probabilities,
        "top_features": top_features,
        "rehab_tips": rehab_tips(payload),
    }


if __name__ == "__main__":
    example_payload = {
        "age": 38,
        "fracture_type": "simple",
        "bone_affected": "tibia",
        "nutrition_score": 7,
        "rehab_adherence": 8,
        "bmi": 24.6,
        "diabetes": False,
        "osteoporosis": False,
        "smoker": False,
    }
    print(json.dumps(predict_from_payload(example_payload), indent=2))
