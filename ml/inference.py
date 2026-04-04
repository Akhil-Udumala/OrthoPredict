from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

import joblib
import numpy as np
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


def load_model_bundle() -> dict[str, Any]:
    return joblib.load(MODEL_PATH)


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


def normal_cdf(value: float, mean: float, std: float) -> float:
    z_score = (value - mean) / (std * math.sqrt(2))
    return 0.5 * (1 + math.erf(z_score))


def weeks_to_category(weeks: float, thresholds: dict[str, float]) -> str:
    if weeks <= thresholds["short_max_weeks"]:
        return "short"
    if weeks <= thresholds["medium_max_weeks"]:
        return "medium"
    return "long"


def category_to_range_label(category: str) -> str:
    return {
        "short": "0-6 weeks",
        "medium": "6-16 weeks",
        "long": "16+ weeks",
    }[category]


def predict_weeks_distribution(frame: pd.DataFrame, bundle: dict[str, Any]) -> dict[str, float]:
    ensemble_predictions = np.array([float(model.predict(frame)[0]) for model in bundle["ensemble_models"]], dtype=float)
    predicted_weeks = float(np.mean(ensemble_predictions))
    ensemble_std = float(np.std(ensemble_predictions, ddof=1)) if len(ensemble_predictions) > 1 else 0.0
    sigma = max(bundle["calibration"]["sigma_floor"], ensemble_std)
    interval_half_width = 1.2816 * sigma

    return {
        "predicted_weeks": round(predicted_weeks, 1),
        "sigma": sigma,
        "interval_half_width": round(interval_half_width, 1),
        "week_range_low": round(max(2.0, predicted_weeks - interval_half_width), 1),
        "week_range_high": round(predicted_weeks + interval_half_width, 1),
    }


def category_probabilities(predicted_weeks: float, sigma: float, thresholds: dict[str, float]) -> dict[str, float]:
    short_probability = normal_cdf(thresholds["short_max_weeks"], predicted_weeks, sigma)
    medium_probability = normal_cdf(thresholds["medium_max_weeks"], predicted_weeks, sigma) - short_probability
    long_probability = 1.0 - normal_cdf(thresholds["medium_max_weeks"], predicted_weeks, sigma)

    raw = {
        "short": max(short_probability, 0.0),
        "medium": max(medium_probability, 0.0),
        "long": max(long_probability, 0.0),
    }
    total = sum(raw.values()) or 1.0
    return {label: round(float(value / total), 4) for label, value in raw.items()}


def build_reference_frame(reference_profile: dict[str, Any], features: list[str]) -> pd.DataFrame:
    return pd.DataFrame([[reference_profile[feature] for feature in features]], columns=features)


def patient_specific_drivers(frame: pd.DataFrame, bundle: dict[str, Any], features: list[str]) -> list[dict[str, Any]]:
    current_prediction = float(bundle["point_model"].predict(frame)[0])
    reference_profile = bundle["reference_profile"]
    drivers: list[dict[str, Any]] = []

    for feature in features:
        counterfactual = frame.copy()
        counterfactual.at[0, feature] = reference_profile[feature]
        counterfactual_prediction = float(bundle["point_model"].predict(counterfactual)[0])
        effect_weeks = current_prediction - counterfactual_prediction
        drivers.append(
            {
                "feature": feature,
                "effect_weeks": round(abs(effect_weeks), 2),
                "direction": "higher" if effect_weeks >= 0 else "lower",
                "signed_effect_weeks": round(effect_weeks, 2),
            }
        )

    drivers.sort(key=lambda item: abs(item["signed_effect_weeks"]), reverse=True)
    return drivers[:3]


def top_features_from_drivers(drivers: list[dict[str, Any]]) -> list[dict[str, Any]]:
    total_effect = sum(item["effect_weeks"] for item in drivers) or 1.0
    return [
        {
            "feature": item["feature"],
            "importance": round(float(item["effect_weeks"] / total_effect), 4),
        }
        for item in drivers
    ]


def rehab_tips(payload: dict[str, Any]) -> list[str]:
    tips: list[str] = []
    if payload["nutrition_score"] <= 6:
        tips.append("Improve protein, calcium, and vitamin D intake to support bone repair.")
    if payload["rehab_adherence"] <= 6:
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
    validate_payload(payload, schema)

    bundle = load_model_bundle()
    frame = ordered_frame(payload, features)
    week_distribution = predict_weeks_distribution(frame, bundle)
    category = weeks_to_category(week_distribution["predicted_weeks"], bundle["category_thresholds"])
    probabilities = category_probabilities(
        predicted_weeks=week_distribution["predicted_weeks"],
        sigma=max(float(week_distribution["interval_half_width"]) / 1.2816, bundle["calibration"]["sigma_floor"]),
        thresholds=bundle["category_thresholds"],
    )
    drivers = patient_specific_drivers(frame, bundle, features)

    return {
        "predicted_weeks": week_distribution["predicted_weeks"],
        "week_range_low": week_distribution["week_range_low"],
        "week_range_high": week_distribution["week_range_high"],
        "category": category,
        "week_range": f"{week_distribution['week_range_low']:.1f}-{week_distribution['week_range_high']:.1f} weeks",
        "confidence": round(float(max(probabilities.values())), 4),
        "uncertainty_weeks": week_distribution["interval_half_width"],
        "probabilities": probabilities,
        "top_features": top_features_from_drivers(drivers),
        "driver_signals": [
            {
                "feature": item["feature"],
                "effect_weeks": item["effect_weeks"],
                "direction": item["direction"],
            }
            for item in drivers
        ],
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
