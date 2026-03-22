from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, precision_score, recall_score
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder, OrdinalEncoder
from sklearn.ensemble import RandomForestClassifier


ML_DIR = Path(__file__).resolve().parent
ROOT = ML_DIR.parent
SCHEMA_PATH = ROOT / "docs" / "schema.json"
DATA_PATH = ROOT / "data" / "synthetic_bone_fracture_healing.csv"
ARTIFACTS_DIR = ML_DIR / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "model.joblib"
FEATURES_PATH = ARTIFACTS_DIR / "features.json"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"


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


def simulate_dataset(schema: dict[str, Any], rows: int = 2500, random_state: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(random_state)
    fracture_categories = schema["properties"]["fracture_type"]["enum"]
    bone_categories = schema["properties"]["bone_affected"]["enum"]

    age = np.clip(np.round(rng.normal(42, 18, rows)).astype(int), 1, 92)
    fracture_type = rng.choice(fracture_categories, size=rows, p=[0.21, 0.17, 0.24, 0.21, 0.17])
    bone_affected = rng.choice(
        bone_categories,
        size=rows,
        p=[0.11, 0.15, 0.14, 0.08, 0.10, 0.08, 0.06, 0.12, 0.10, 0.06],
    )
    nutrition_score = np.clip(np.round(rng.normal(6.2, 2.0, rows)).astype(int), 1, 10)
    rehab_adherence = np.clip(np.round(rng.normal(6.7, 2.2, rows)).astype(int), 1, 10)
    bmi = np.clip(rng.normal(25.8, 4.8, rows), 16.0, 42.0).round(1)

    diabetes_probability = np.clip(0.05 + ((age - 35).clip(min=0) * 0.002) + ((bmi - 28).clip(min=0) * 0.015), 0.05, 0.38)
    osteoporosis_probability = np.clip(0.02 + ((age - 50).clip(min=0) * 0.006), 0.02, 0.35)
    smoker_probability = np.clip(0.10 + ((age - 18).clip(min=0) * 0.0012), 0.10, 0.28)

    diabetes = rng.random(rows) < diabetes_probability
    osteoporosis = rng.random(rows) < osteoporosis_probability
    smoker = rng.random(rows) < smoker_probability

    fracture_impact = {
        "hairline": 0.2,
        "stress": 0.8,
        "simple": 1.8,
        "compound": 7.8,
        "comminuted": 12.4,
    }
    bone_impact = {
        "femur": 2.7,
        "tibia": 2.3,
        "radius": 0.8,
        "ulna": 0.9,
        "humerus": 1.5,
        "clavicle": 0.8,
        "rib": 0.7,
        "foot": 1.2,
        "wrist": 0.9,
        "other": 1.3,
    }

    healing_weeks = (
        0.6
        + np.vectorize(fracture_impact.get)(fracture_type)
        + np.vectorize(bone_impact.get)(bone_affected)
        + np.clip((age - 25) / 20, 0, None)
        + 0.14 * np.abs(bmi - 22.5)
        + 0.25 * (10 - nutrition_score)
        + 0.28 * (10 - rehab_adherence)
        + 1.3 * diabetes.astype(float)
        + 2.4 * osteoporosis.astype(float)
        + 0.9 * smoker.astype(float)
        + rng.normal(0, 1.0, rows)
    )
    healing_weeks = np.clip(healing_weeks, 2.0, None).round(1)

    healing_category = np.select(
        [healing_weeks <= 6.0, healing_weeks <= 16.0],
        ["short", "medium"],
        default="long",
    )

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

    # Use nullable dtypes so training data can contain missing values.
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

    class_distribution = dataset["healing_category"].value_counts(normalize=True).to_dict()
    if min(class_distribution.values()) < 0.15:
        raise ValueError(f"Class balance fell below threshold: {class_distribution}")

    return dataset


def build_models(preprocessor: ColumnTransformer) -> dict[str, Pipeline]:
    return {
        "logistic_regression": Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                (
                    "classifier",
                    LogisticRegression(
                        max_iter=2000,
                        solver="lbfgs",
                    ),
                ),
            ]
        ),
        "random_forest": Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                (
                    "classifier",
                    RandomForestClassifier(
                        n_estimators=400,
                        min_samples_leaf=2,
                        class_weight="balanced_subsample",
                        random_state=42,
                        n_jobs=1,
                    ),
                ),
            ]
        ),
    }


def evaluate_pipeline(model: Pipeline, x_train: pd.DataFrame, x_test: pd.DataFrame, y_train: pd.Series, y_test: pd.Series) -> dict[str, Any]:
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)

    return {
        "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
        "f1_macro": round(float(f1_score(y_test, predictions, average="macro")), 4),
        "precision_macro": round(float(precision_score(y_test, predictions, average="macro", zero_division=0)), 4),
        "recall_macro": round(float(recall_score(y_test, predictions, average="macro", zero_division=0)), 4),
        "confusion_matrix": confusion_matrix(y_test, predictions, labels=["short", "medium", "long"]).tolist(),
        "classification_report": classification_report(
            y_test,
            predictions,
            labels=["short", "medium", "long"],
            output_dict=True,
            zero_division=0,
        ),
    }


def run_cross_validation(model: Pipeline, x: pd.DataFrame, y: pd.Series) -> dict[str, Any]:
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scoring = {
        "accuracy": "accuracy",
        "f1_macro": "f1_macro",
        "precision_macro": "precision_macro",
        "recall_macro": "recall_macro",
    }
    scores = cross_validate(model, x, y, cv=cv, scoring=scoring, n_jobs=1)

    result: dict[str, Any] = {}
    for metric_name in scoring:
        values = scores[f"test_{metric_name}"]
        result[metric_name] = {
            "mean": round(float(np.mean(values)), 4),
            "std": round(float(np.std(values)), 4),
            "fold_scores": [round(float(value), 4) for value in values],
        }
    return result


def normalize_importances(importances: dict[str, float]) -> dict[str, float]:
    clipped = {name: max(score, 0.0) for name, score in importances.items()}
    total = sum(clipped.values())
    if total == 0:
        return {name: 0.0 for name in importances}
    return {name: round(score / total, 4) for name, score in clipped.items()}


def select_best_model(metrics: dict[str, dict[str, Any]]) -> str:
    return max(
        metrics,
        key=lambda model_name: (
            metrics[model_name]["test_split"]["f1_macro"],
            metrics[model_name]["test_split"]["accuracy"],
        ),
    )


def main() -> None:
    schema = load_schema()
    features = ordered_features(schema)
    dataset = simulate_dataset(schema=schema, rows=2500, random_state=42)

    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(DATA_PATH, index=False)
    FEATURES_PATH.write_text(json.dumps(features, indent=2))

    x = dataset[features]
    y = dataset["healing_category"]

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        stratify=y,
        random_state=42,
    )

    metrics: dict[str, dict[str, Any]] = {}
    fitted_models: dict[str, Pipeline] = {}

    for model_name, pipeline in build_models(build_preprocessor(schema)).items():
        test_metrics = evaluate_pipeline(pipeline, x_train, x_test, y_train, y_test)
        cv_metrics = run_cross_validation(pipeline, x, y)
        fitted_models[model_name] = pipeline
        metrics[model_name] = {
            "test_split": test_metrics,
            "cross_validation": cv_metrics,
        }

    best_model_name = select_best_model(metrics)
    best_model = fitted_models[best_model_name]

    importance_result = permutation_importance(
        best_model,
        x_test,
        y_test,
        n_repeats=15,
        random_state=42,
        n_jobs=1,
        scoring="f1_macro",
    )
    raw_importance = {
        feature: float(score)
        for feature, score in zip(features, importance_result.importances_mean, strict=True)
    }
    normalized_importance = normalize_importances(raw_importance)
    sorted_importance = sorted(normalized_importance.items(), key=lambda item: item[1], reverse=True)

    metrics["dataset"] = {
        "rows": int(dataset.shape[0]),
        "class_distribution": {label: round(float(value), 4) for label, value in y.value_counts(normalize=True).sort_index().items()},
    }
    metrics["selected_model"] = {
        "name": best_model_name,
        "artifact": MODEL_PATH.name,
        "feature_order_artifact": FEATURES_PATH.name,
        "permutation_importance": [
            {"feature": feature, "importance": round(float(importance), 4)}
            for feature, importance in sorted_importance
        ],
        "week_ranges": {
            "short": "0-6 weeks",
            "medium": "6-16 weeks",
            "long": "16+ weeks",
        },
    }

    joblib.dump(best_model, MODEL_PATH)
    METRICS_PATH.write_text(json.dumps(metrics, indent=2))

    print(f"Saved dataset to {DATA_PATH}")
    print(f"Saved model to {MODEL_PATH}")
    print(f"Saved features to {FEATURES_PATH}")
    print(f"Saved metrics to {METRICS_PATH}")
    print(f"Best model: {best_model_name}")
    print(json.dumps(metrics[best_model_name]["test_split"], indent=2))


if __name__ == "__main__":
    main()
