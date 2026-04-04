from __future__ import annotations

import json
from pathlib import Path

from fastapi.testclient import TestClient

from backend.main import app
from backend.schemas import PredictionResponse


def make_payload(**overrides: object) -> dict[str, object]:
    payload: dict[str, object] = {
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
    payload.update(overrides)
    return payload


def test_same_category_can_return_different_predicted_weeks() -> None:
    stronger_recovery = make_payload(nutrition_score=8, rehab_adherence=9)
    weaker_recovery = make_payload(nutrition_score=5, rehab_adherence=6)

    with TestClient(app) as client:
        stronger_response = client.post("/predict", json=stronger_recovery)
        weaker_response = client.post("/predict", json=weaker_recovery)

    assert stronger_response.status_code == 200
    assert weaker_response.status_code == 200

    stronger_body = stronger_response.json()
    weaker_body = weaker_response.json()

    assert stronger_body["category"] == "medium"
    assert weaker_body["category"] == "medium"
    assert stronger_body["predicted_weeks"] != weaker_body["predicted_weeks"]
    assert stronger_body["week_range"] != weaker_body["week_range"]
    assert stronger_body["week_range_low"] != weaker_body["week_range_low"]


def test_different_payloads_produce_different_serialized_responses() -> None:
    baseline = make_payload(nutrition_score=7, rehab_adherence=8)
    what_if = make_payload(nutrition_score=7, rehab_adherence=4)

    with TestClient(app) as client:
        baseline_response = client.post("/predict", json=baseline)
        what_if_response = client.post("/predict", json=what_if)

    assert baseline_response.status_code == 200
    assert what_if_response.status_code == 200

    baseline_body = baseline_response.json()
    what_if_body = what_if_response.json()

    assert baseline_body != what_if_body
    assert baseline_body["predicted_weeks"] != what_if_body["predicted_weeks"]
    assert baseline_body["driver_signals"] != what_if_body["driver_signals"]
    assert baseline_body["top_features"] != what_if_body["top_features"]


def test_response_matches_updated_schema() -> None:
    schema = json.loads(Path("docs/schema.json").read_text())
    response_schema = schema["$defs"]["prediction_response"]
    top_feature_schema = response_schema["properties"]["top_features"]["items"]
    driver_signal_schema = response_schema["properties"]["driver_signals"]["items"]

    with TestClient(app) as client:
        response = client.post("/predict", json=make_payload())

    assert response.status_code == 200
    body = response.json()

    PredictionResponse.model_validate(body)
    assert set(body.keys()) == set(response_schema["required"])
    assert set(body["top_features"][0].keys()) == set(top_feature_schema["required"])
    assert set(body["driver_signals"][0].keys()) == set(driver_signal_schema["required"])
    assert "personalized_week_interval" not in body
    assert "key_factors" not in body
