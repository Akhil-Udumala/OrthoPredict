from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LinearRegression
from sklearn.metrics import accuracy_score, f1_score, mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder, OrdinalEncoder


ML_DIR = Path(__file__).resolve().parent
ROOT = ML_DIR.parent
SCHEMA_PATH = ROOT / "docs" / "schema.json"
DATA_PATH = ROOT / "data" / "synthetic_bone_fracture_healing.csv"
ARTIFACTS_DIR = ML_DIR / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model.joblib"
FEATURES_PATH = ARTIFACTS_DIR / "features.json"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"

SHORT_MAX_WEEKS = 6.0
MEDIUM_MAX_WEEKS = 16.0
INTERVAL_Z_80 = 1.2816
ENSEMBLE_MEMBERS = 7


def load_schema() -> dict[str, Any]:
    return json.loads(SCHEMA_PATH.read_text())


def ordered_features(schema: dict[str, Any]) -> list[str]:
    return schema["required"]


def make_one_hot_encoder(categories: list[str]) -> OneHotEncoder:
    kwargs: dict[str, Any] = {
        "categories": [categories],
        "handle_unknown": "ignore",
    }
    if "sparse_output" in OneHotEncoder.__init__.__code__.co_varnames:
        kwargs["sparse_output"] = False
    else:
        kwargs["sparse"] = False
    return OneHotEncoder(**kwargs)


def weeks_to_category(values: pd.Series | np.ndarray | list[float]) -> np.ndarray:
    weeks = np.asarray(values, dtype=float)
    return np.where(weeks <= SHORT_MAX_WEEKS, "short", np.where(weeks <= MEDIUM_MAX_WEEKS, "medium", "long"))


def category_to_range_label(category: str) -> str:
    return {
        "short": "0-6 weeks",
        "medium": "6-16 weeks",
        "long": "16+ weeks",
    }[category]


def build_preprocessor(schema: dict[str, Any]) -> ColumnTransformer:
    fracture_categories = schema["properties"]["fracture_type"]["enum"]
    bone_categories = schema["properties"]["bone_affected"]["enum"]

    return ColumnTransformer(
        transformers=[
            (
                "scaled_numeric",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="median")),
                        ("scaler", MinMaxScaler()),
                    ]
                ),
                ["age", "bmi"],
            ),
            (
                "ordinal_fracture",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        (
                            "encoder",
                            OrdinalEncoder(
                                categories=[fracture_categories],
                                handle_unknown="use_encoded_value",
                                unknown_value=-1,
                            ),
                        ),
                    ]
                ),
                ["fracture_type"],
            ),
            (
                "onehot_bone",
                Pipeline(
                    steps=[
                        ("imputer", SimpleImputer(strategy="most_frequent")),
                        ("encoder", make_one_hot_encoder(bone_categories)),
                    ]
                ),
                ["bone_affected"],
            ),
            (
                "score_features",
                Pipeline(steps=[("imputer", SimpleImputer(strategy="median"))]),
                ["nutrition_score", "rehab_adherence"],
            ),
            (
                "binary_flags",
                "passthrough",
                ["diabetes", "osteoporosis", "smoker"],
            ),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )


def build_model(model_name: str, schema: dict[str, Any], random_state: int = 42) -> Pipeline:
    preprocessor = build_preprocessor(schema)

    if model_name == "linear_regression":
        estimator = LinearRegression()
    elif model_name == "random_forest_regressor":
        estimator = RandomForestRegressor(
            n_estimators=500,
            max_depth=14,
            min_samples_leaf=3,
            random_state=random_state,
            n_jobs=1,
        )
    else:
        raise ValueError(f"Unknown model name: {model_name}")

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("regressor", estimator),
        ]
    )


def simulate_dataset(schema: dict[str, Any], rows: int = 3000, random_state: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(random_state)
    fracture_categories = schema["properties"]["fracture_type"]["enum"]
    bone_categories = schema["properties"]["bone_affected"]["enum"]

    age = np.clip(np.round(rng.normal(43, 17, rows)).astype(int), 1, 92)
    fracture_type = rng.choice(fracture_categories, size=rows, p=[0.19, 0.17, 0.27, 0.22, 0.15])
    bone_affected = rng.choice(
        bone_categories,
        size=rows,
        p=[0.11, 0.15, 0.14, 0.08, 0.10, 0.08, 0.06, 0.12, 0.10, 0.06],
    )
    nutrition_score = np.clip(np.round(rng.normal(6.1, 2.1, rows)).astype(int), 1, 10)
    rehab_adherence = np.clip(np.round(rng.normal(6.5, 2.3, rows)).astype(int), 1, 10)
    bmi = np.clip(rng.normal(25.6, 4.9, rows), 16.0, 42.0).round(1)

    diabetes_probability = np.clip(0.05 + ((age - 35).clip(min=0) * 0.0022) + ((bmi - 28).clip(min=0) * 0.013), 0.05, 0.38)
    osteoporosis_probability = np.clip(0.02 + ((age - 50).clip(min=0) * 0.0065), 0.02, 0.35)
    smoker_probability = np.clip(0.10 + ((age - 18).clip(min=0) * 0.0011), 0.10, 0.28)

    diabetes = rng.random(rows) < diabetes_probability
    osteoporosis = rng.random(rows) < osteoporosis_probability
    smoker = rng.random(rows) < smoker_probability

    fracture_impact = {
        "hairline": 0.2,
        "stress": 0.8,
        "simple": 2.8,
        "compound": 8.7,
        "comminuted": 13.2,
    }
    bone_impact = {
        "femur": 2.0,
        "tibia": 1.7,
        "radius": 0.5,
        "ulna": 0.6,
        "humerus": 1.0,
        "clavicle": 0.4,
        "rib": 0.3,
        "foot": 0.9,
        "wrist": 0.4,
        "other": 0.9,
    }

    poor_nutrition = 10 - nutrition_score
    poor_rehab = 10 - rehab_adherence
    severe_fracture = np.isin(fracture_type, ["compound", "comminuted"]).astype(float)

    healing_weeks = (
        0.2
        + np.vectorize(fracture_impact.get)(fracture_type)
        + np.vectorize(bone_impact.get)(bone_affected)
        + 0.022 * np.clip(age - 18, 0, None)
        + 0.07 * np.abs(bmi - 23.0)
        + 0.40 * poor_nutrition
        + 0.60 * poor_rehab
        + 0.022 * poor_nutrition * poor_rehab
        + 0.12 * severe_fracture * poor_rehab
        + 1.2 * diabetes.astype(float)
        + 1.7 * osteoporosis.astype(float)
        + 0.9 * smoker.astype(float)
        + rng.normal(0, 0.8, rows)
    )
    healing_weeks = np.clip(healing_weeks, 2.0, None).round(1)
    healing_category = weeks_to_category(healing_weeks)

    dataset = pd.DataFrame(
        {
            "age": age,
            "fracture_type": fracture_type,
            "bone_affected": bone_affected,
            "nutrition_score": nutrition_score,
            "rehab_adherence": rehab_adherence,
            "bmi": bmi,
            "diabetes": diabetes,
            "osteoporosis": osteoporosis,
            "smoker": smoker,
            "healing_weeks": healing_weeks,
            "healing_category": healing_category,
        }
    )

    for column in ["age", "nutrition_score", "rehab_adherence", "healing_weeks"]:
        dataset[column] = dataset[column].astype("Float64")

    missing_rates = {
        "age": 0.015,
        "fracture_type": 0.01,
        "bone_affected": 0.01,
        "nutrition_score": 0.02,
        "rehab_adherence": 0.02,
        "bmi": 0.02,
    }
    for column, rate in missing_rates.items():
        mask = rng.random(rows) < rate
        dataset.loc[mask, column] = np.nan

    category_distribution = pd.Series(dataset["healing_category"]).value_counts(normalize=True).to_dict()
    if min(category_distribution.values()) < 0.1:
        raise ValueError(f"Synthetic data is too imbalanced: {category_distribution}")

    return dataset


def regression_metric_block(y_true: pd.Series | np.ndarray, y_pred: np.ndarray) -> dict[str, Any]:
    clipped_predictions = np.clip(np.asarray(y_pred, dtype=float), 2.0, None)
    true_weeks = np.asarray(y_true, dtype=float)
    true_category = weeks_to_category(true_weeks)
    predicted_category = weeks_to_category(clipped_predictions)

    return {
        "mae": round(float(mean_absolute_error(true_weeks, clipped_predictions)), 4),
        "rmse": round(float(np.sqrt(mean_squared_error(true_weeks, clipped_predictions))), 4),
        "r2": round(float(r2_score(true_weeks, clipped_predictions)), 4),
        "category_accuracy": round(float(accuracy_score(true_category, predicted_category)), 4),
        "category_f1_macro": round(float(f1_score(true_category, predicted_category, average="macro")), 4),
    }


def summarize_fold_metrics(fold_metrics: list[dict[str, float]]) -> dict[str, Any]:
    summary: dict[str, Any] = {}
    for metric_name in fold_metrics[0]:
        values = [metrics[metric_name] for metrics in fold_metrics]
        summary[metric_name] = {
            "mean": round(float(np.mean(values)), 4),
            "std": round(float(np.std(values)), 4),
            "fold_scores": [round(float(value), 4) for value in values],
        }
    return summary


def cross_validate_regressor(model_name: str, schema: dict[str, Any], x: pd.DataFrame, y: pd.Series) -> tuple[dict[str, Any], np.ndarray]:
    strat_labels = weeks_to_category(y)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    fold_metrics: list[dict[str, float]] = []
    oof_predictions = np.zeros(len(y), dtype=float)

    for train_idx, test_idx in cv.split(x, strat_labels):
        model = build_model(model_name, schema=schema, random_state=42)
        x_train = x.iloc[train_idx]
        x_valid = x.iloc[test_idx]
        y_train = y.iloc[train_idx]
        y_valid = y.iloc[test_idx]

        model.fit(x_train, y_train)
        predictions = model.predict(x_valid)
        oof_predictions[test_idx] = predictions
        fold_metrics.append(regression_metric_block(y_valid, predictions))

    return summarize_fold_metrics(fold_metrics), oof_predictions


def evaluate_monotonicity(model: Pipeline, sample: pd.DataFrame) -> dict[str, Any]:
    clean_sample = sample.dropna(subset=["nutrition_score", "rehab_adherence"]).copy()
    if clean_sample.empty:
        return {
            "nutrition_worsen_violations": 0,
            "rehab_worsen_violations": 0,
            "total_checks": 0,
            "violation_rate": 0.0,
        }

    clean_sample = clean_sample.sample(min(len(clean_sample), 150), random_state=42)
    tolerance = 0.1
    nutrition_violations = 0
    rehab_violations = 0
    total_checks = 0

    for _, row in clean_sample.iterrows():
        base_frame = pd.DataFrame([row])
        base_prediction = float(model.predict(base_frame)[0])

        nutrition_value = int(row["nutrition_score"])
        if nutrition_value > 1:
            worse_row = row.copy()
            worse_row["nutrition_score"] = max(1, nutrition_value - 3)
            worse_prediction = float(model.predict(pd.DataFrame([worse_row]))[0])
            total_checks += 1
            if worse_prediction + tolerance < base_prediction:
                nutrition_violations += 1

        rehab_value = int(row["rehab_adherence"])
        if rehab_value > 1:
            worse_row = row.copy()
            worse_row["rehab_adherence"] = max(1, rehab_value - 3)
            worse_prediction = float(model.predict(pd.DataFrame([worse_row]))[0])
            total_checks += 1
            if worse_prediction + tolerance < base_prediction:
                rehab_violations += 1

    total_violations = nutrition_violations + rehab_violations
    return {
        "nutrition_worsen_violations": nutrition_violations,
        "rehab_worsen_violations": rehab_violations,
        "total_checks": total_checks,
        "violation_rate": round(float(total_violations / total_checks), 4) if total_checks else 0.0,
    }


def normalize_importances(importances: dict[str, float]) -> list[dict[str, Any]]:
    clipped = {feature: max(score, 0.0) for feature, score in importances.items()}
    total = sum(clipped.values())
    if total == 0:
        return [{"feature": feature, "importance": 0.0} for feature in importances]

    normalized = [
        {"feature": feature, "importance": round(float(score / total), 4)}
        for feature, score in clipped.items()
    ]
    return sorted(normalized, key=lambda item: item["importance"], reverse=True)


def build_reference_profile(dataset: pd.DataFrame, schema: dict[str, Any], features: list[str]) -> dict[str, Any]:
    reference: dict[str, Any] = {}
    for feature in features:
        feature_type = schema["properties"][feature]["type"]
        series = dataset[feature].dropna()
        if feature_type == "boolean":
            reference[feature] = bool(series.mode().iloc[0])
        elif feature_type == "integer":
            reference[feature] = int(round(float(series.median())))
        elif feature_type == "number":
            reference[feature] = round(float(series.median()), 1)
        else:
            reference[feature] = str(series.mode().iloc[0])
    return reference


def fit_bootstrap_ensemble(model_name: str, schema: dict[str, Any], x: pd.DataFrame, y: pd.Series) -> list[Pipeline]:
    rng = np.random.default_rng(42)
    models: list[Pipeline] = []
    for member_index in range(ENSEMBLE_MEMBERS):
        sampled_indices = rng.integers(0, len(x), len(x))
        sampled_x = x.iloc[sampled_indices].reset_index(drop=True)
        sampled_y = y.iloc[sampled_indices].reset_index(drop=True)
        model = build_model(model_name, schema=schema, random_state=42 + member_index)
        model.fit(sampled_x, sampled_y)
        models.append(model)
    return models


def select_best_model(metrics: dict[str, dict[str, Any]]) -> str:
    return min(
        (name for name in metrics if name not in {"dataset", "selected_model"}),
        key=lambda name: (
            metrics[name]["monotonicity"]["violation_rate"],
            metrics[name]["test_split"]["mae"],
            metrics[name]["cross_validation"]["mae"]["mean"],
        ),
    )


def main() -> None:
    schema = load_schema()
    features = ordered_features(schema)
    dataset = simulate_dataset(schema=schema, rows=3000, random_state=42)

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)

    dataset.to_csv(DATA_PATH, index=False)
    FEATURES_PATH.write_text(json.dumps(features, indent=2))

    x = dataset[features]
    y_weeks = dataset["healing_weeks"].astype(float)
    strat_labels = weeks_to_category(y_weeks)

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y_weeks,
        test_size=0.2,
        stratify=strat_labels,
        random_state=42,
    )

    candidate_names = ["linear_regression", "random_forest_regressor"]
    metrics: dict[str, dict[str, Any]] = {}
    fitted_models: dict[str, Pipeline] = {}
    oof_predictions_by_model: dict[str, np.ndarray] = {}

    for model_name in candidate_names:
        model = build_model(model_name, schema=schema, random_state=42)
        model.fit(x_train, y_train)
        fitted_models[model_name] = model

        test_predictions = model.predict(x_test)
        cv_metrics, oof_predictions = cross_validate_regressor(model_name, schema, x, y_weeks)
        monotonicity = evaluate_monotonicity(model, x_test)

        metrics[model_name] = {
            "test_split": regression_metric_block(y_test, test_predictions),
            "cross_validation": cv_metrics,
            "monotonicity": monotonicity,
        }
        oof_predictions_by_model[model_name] = oof_predictions

    best_model_name = select_best_model(metrics)
    point_model = build_model(best_model_name, schema=schema, random_state=42)
    point_model.fit(x, y_weeks)

    ensemble_models = fit_bootstrap_ensemble(best_model_name, schema, x, y_weeks)
    oof_predictions = oof_predictions_by_model[best_model_name]
    absolute_errors = np.abs(y_weeks.to_numpy() - np.clip(oof_predictions, 2.0, None))
    interval_half_width = float(np.quantile(absolute_errors, 0.8))
    calibration_sigma = interval_half_width / INTERVAL_Z_80

    importance_result = permutation_importance(
        point_model,
        x_test,
        y_test,
        n_repeats=15,
        random_state=42,
        n_jobs=1,
        scoring="neg_mean_absolute_error",
    )
    raw_importance = {
        feature: float(score)
        for feature, score in zip(features, importance_result.importances_mean, strict=True)
    }
    global_importance = normalize_importances(raw_importance)

    reference_profile = build_reference_profile(dataset, schema, features)
    category_distribution = pd.Series(weeks_to_category(y_weeks)).value_counts(normalize=True).sort_index()

    model_bundle = {
        "model_name": best_model_name,
        "point_model": point_model,
        "ensemble_models": ensemble_models,
        "feature_order": features,
        "reference_profile": reference_profile,
        "category_thresholds": {
            "short_max_weeks": SHORT_MAX_WEEKS,
            "medium_max_weeks": MEDIUM_MAX_WEEKS,
        },
        "calibration": {
            "target_interval_coverage": 0.8,
            "sigma_floor": round(calibration_sigma, 4),
            "interval_half_width_floor": round(interval_half_width, 4),
            "residual_quantiles": {
                "median_absolute_error": round(float(np.quantile(absolute_errors, 0.5)), 4),
                "p80_absolute_error": round(interval_half_width, 4),
                "p90_absolute_error": round(float(np.quantile(absolute_errors, 0.9)), 4),
            },
        },
    }
    joblib.dump(model_bundle, MODEL_PATH)

    metrics["dataset"] = {
        "rows": int(dataset.shape[0]),
        "weeks_summary": {
            "min": round(float(y_weeks.min()), 2),
            "median": round(float(y_weeks.median()), 2),
            "mean": round(float(y_weeks.mean()), 2),
            "max": round(float(y_weeks.max()), 2),
        },
        "category_distribution": {label: round(float(value), 4) for label, value in category_distribution.items()},
    }
    metrics["selected_model"] = {
        "name": best_model_name,
        "artifact": MODEL_PATH.name,
        "feature_order_artifact": FEATURES_PATH.name,
        "category_thresholds": model_bundle["category_thresholds"],
        "week_ranges": {
            "short": "0-6 weeks",
            "medium": "6-16 weeks",
            "long": "16+ weeks",
        },
        "calibration": model_bundle["calibration"],
        "reference_profile": reference_profile,
        "global_feature_importance": global_importance,
        "artifact_contract": {
            "model.joblib": "Serialized regression bundle with point model, ensemble models, thresholds, and calibration.",
            "features.json": "Ordered request feature list that matches docs/schema.json exactly.",
            "metrics.json": "Regression, derived-category, monotonicity, calibration, and artifact contract metadata.",
        },
        "prediction_contract": {
            "request_fields": features,
            "response_fields": [
                "predicted_weeks",
                "week_range_low",
                "week_range_high",
                "category",
                "week_range",
                "confidence",
                "uncertainty_weeks",
                "probabilities",
                "top_features",
                "driver_signals",
                "rehab_tips",
            ],
        },
    }

    METRICS_PATH.write_text(json.dumps(metrics, indent=2))

    print(f"Saved dataset to {DATA_PATH}")
    print(f"Saved model bundle to {MODEL_PATH}")
    print(f"Saved features to {FEATURES_PATH}")
    print(f"Saved metrics to {METRICS_PATH}")
    print(f"Selected model: {best_model_name}")
    print(json.dumps(metrics[best_model_name]["test_split"], indent=2))


if __name__ == "__main__":
    main()
