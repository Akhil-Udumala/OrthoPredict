# Bone Fracture Healing Time ML Pipeline

This repository contains a schema-aware machine learning pipeline for predicting fracture healing time categories from raw JSON input that matches `docs/schema.json`.

## What the pipeline does

- Generates a synthetic medical dataset with 2,500 records.
- Preserves the exact request feature names from the shared API schema.
- Applies the required preprocessing:
  - `MinMaxScaler` for `age` and `bmi`
  - `OrdinalEncoder` for `fracture_type`
  - `OneHotEncoder` for `bone_affected`
- Trains and compares:
  - Logistic Regression
  - RandomForestClassifier
- Evaluates both models using:
  - train/test split
  - 5-fold cross-validation
- Saves:
  - `ml/artifacts/model.joblib`
  - `ml/artifacts/features.json`
  - `ml/artifacts/metrics.json`

## Files

- `ml/train_model.py`: generates data, trains models, evaluates them, and saves artifacts.
- `ml/inference.py`: loads saved artifacts and predicts directly from a raw JSON-like Python dictionary.
- `docs/schema.json`: shared request and response contract.

## Training

Run:

```bash
python3 ml/train_model.py
```

This creates:

- `data/synthetic_bone_fracture_healing.csv`
- `ml/artifacts/model.joblib`
- `ml/artifacts/features.json`
- `ml/artifacts/metrics.json`

## Backend usage

The FastAPI layer can keep the request body exactly as defined in `docs/schema.json`, then pass the parsed JSON into the helper below.

```python
from ml.inference import predict_from_payload

payload = {
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

result = predict_from_payload(payload)
print(result)
```

The response follows the shape described in `docs/schema.json`:

- `category`
- `week_range`
- `confidence`
- `probabilities`
- `top_features`
- `rehab_tips`

## Beginner-friendly explanation

- Synthetic dataset: We do not have real patient records here, so the script creates realistic examples using medical assumptions. More severe fracture types, poor nutrition, low rehab adherence, high-risk bones, smoking, diabetes, and osteoporosis all increase healing time.
- Preprocessing: Machine learning models need numeric inputs. Scaling keeps `age` and `bmi` on a consistent range, ordinal encoding converts fracture type into ordered numeric values, and one-hot encoding turns the affected bone into safe binary columns.
- Model comparison: Logistic Regression acts as a clean baseline, while RandomForestClassifier is the main nonlinear model that can capture more complex relationships.
- Evaluation: The train/test split checks performance on unseen data once, and 5-fold cross-validation checks whether the model stays stable across multiple train/validation splits.
- Saved artifacts: `ml/artifacts/model.joblib` stores the full preprocessing and model pipeline together, so the backend does not need to rebuild transformations manually.
