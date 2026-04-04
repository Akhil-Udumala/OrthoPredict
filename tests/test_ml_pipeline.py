from __future__ import annotations

from pathlib import Path

import pytest

from ml.inference import predict_from_payload
from ml.train_model import MODEL_PATH, main as train_main


@pytest.fixture(scope="session", autouse=True)
def ensure_artifacts() -> None:
    if not Path(MODEL_PATH).exists():
        train_main()


def test_same_category_can_have_different_week_estimates() -> None:
    patient_a = {
        "age": 34,
        "fracture_type": "simple",
        "bone_affected": "tibia",
        "nutrition_score": 8,
        "rehab_adherence": 8,
        "bmi": 23.4,
        "diabetes": False,
        "osteoporosis": False,
        "smoker": False,
    }
    patient_b = {
        "age": 47,
        "fracture_type": "simple",
        "bone_affected": "tibia",
        "nutrition_score": 6,
        "rehab_adherence": 6,
        "bmi": 27.2,
        "diabetes": False,
        "osteoporosis": False,
        "smoker": False,
    }

    result_a = predict_from_payload(patient_a)
    result_b = predict_from_payload(patient_b)

    assert result_a["category"] == "medium"
    assert result_b["category"] == "medium"
    assert abs(result_a["predicted_weeks"] - result_b["predicted_weeks"]) >= 1.5


def test_what_if_changes_move_weeks_in_expected_direction() -> None:
    baseline = {
        "age": 42,
        "fracture_type": "simple",
        "bone_affected": "radius",
        "nutrition_score": 4,
        "rehab_adherence": 4,
        "bmi": 24.9,
        "diabetes": False,
        "osteoporosis": False,
        "smoker": False,
    }
    improved = {
        **baseline,
        "nutrition_score": 9,
        "rehab_adherence": 9,
    }
    worsened = {
        **baseline,
        "nutrition_score": 2,
        "rehab_adherence": 2,
    }

    baseline_result = predict_from_payload(baseline)
    improved_result = predict_from_payload(improved)
    worsened_result = predict_from_payload(worsened)

    assert improved_result["predicted_weeks"] <= baseline_result["predicted_weeks"] - 2.0
    assert worsened_result["predicted_weeks"] >= baseline_result["predicted_weeks"] + 1.0


def test_severe_cases_predict_longer_than_mild_cases() -> None:
    mild_case = {
        "age": 22,
        "fracture_type": "hairline",
        "bone_affected": "wrist",
        "nutrition_score": 9,
        "rehab_adherence": 9,
        "bmi": 22.0,
        "diabetes": False,
        "osteoporosis": False,
        "smoker": False,
    }
    severe_case = {
        "age": 72,
        "fracture_type": "comminuted",
        "bone_affected": "femur",
        "nutrition_score": 3,
        "rehab_adherence": 2,
        "bmi": 31.5,
        "diabetes": True,
        "osteoporosis": True,
        "smoker": True,
    }

    mild_result = predict_from_payload(mild_case)
    severe_result = predict_from_payload(severe_case)

    assert mild_result["category"] == "short"
    assert severe_result["category"] == "long"
    assert severe_result["predicted_weeks"] >= mild_result["predicted_weeks"] + 10.0


def test_response_contract_contains_individualized_fields() -> None:
    result = predict_from_payload(
        {
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
    )

    assert "predicted_weeks" in result
    assert "week_range_low" in result
    assert "week_range_high" in result
    assert "driver_signals" in result
    assert result["week_range_low"] <= result["predicted_weeks"] <= result["week_range_high"]
    assert len(result["driver_signals"]) == 3
