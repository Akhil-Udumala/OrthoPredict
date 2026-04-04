# Bone Fracture Healing Time ML Pipeline

This repository contains a schema-aware machine learning pipeline for predicting individualized fracture healing weeks from raw JSON input that matches `docs/schema.json`.

## What the pipeline does

- Generates a synthetic medical dataset with 3,000 records.
- Preserves the exact request feature names from the shared API schema.
- Applies the required preprocessing:
  - `MinMaxScaler` for `age` and `bmi`
  - `OrdinalEncoder` for `fracture_type`
  - `OneHotEncoder` for `bone_affected`
- Trains and compares:
  - Linear Regression baseline
  - RandomForestRegressor main candidate
- Evaluates both models using:
  - train/test split
  - 5-fold cross-validation
- Predicts continuous `healing_weeks`, then derives `short`, `medium`, and `long` from the predicted week value.
- Calibrates individualized uncertainty intervals and returns patient-specific driver signals.
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

- `predicted_weeks`
- `week_range_low`
- `week_range_high`
- `category`
- `week_range`
- `confidence`
- `uncertainty_weeks`
- `probabilities`
- `top_features`
- `driver_signals`
- `rehab_tips`

## Beginner-friendly explanation

- Synthetic dataset: We do not have real patient records here, so the script creates realistic examples using medical assumptions. More severe fracture types, poor nutrition, poor rehab adherence, high-risk bones, smoking, diabetes, and osteoporosis all increase healing time in weeks.
- Preprocessing: Machine learning models need numeric inputs. Scaling keeps `age` and `bmi` on a consistent range, ordinal encoding converts fracture type into ordered numeric values, and one-hot encoding turns the affected bone into safe binary columns.
- Model comparison: Linear Regression acts as the monotonic baseline, while RandomForestRegressor is the nonlinear alternative. The selected artifact is chosen using both prediction error and monotonic what-if checks.
- Evaluation: The train/test split checks unseen predictions once, and 5-fold cross-validation checks whether week estimates stay stable across multiple splits. The script also checks whether worsening nutrition or rehab accidentally lowers the prediction.
- Saved artifacts: `ml/artifacts/model.joblib` stores a regression bundle with the selected point model, an ensemble for uncertainty, thresholds for derived categories, and calibration metadata.

## Frontend app

The repository now includes a complete frontend in [`frontend/`](/Users/akhiludumala/Documents/bone-fracture/frontend) for **OrthoPredict v1**.

### What the frontend does

- Shows a one-time disclaimer modal for each browser session.
- Lets the user enter the exact 9 backend input fields.
- Validates every field before sending the request.
- Sends a `POST /predict` request using the shared snake_case API contract.
- Displays:
  - `category`
  - `week_range`
  - `confidence`
  - probability chart
  - `top_features`
  - `rehab_tips`
- Includes a what-if simulator for:
  - `nutrition_score`
  - `rehab_adherence`
- Supports browser print/export.

### Frontend stack

- React + TypeScript + Vite
- Tailwind CSS
- shadcn/ui primitives
- react-hook-form + zod
- axios
- framer-motion
- chart.js + react-chartjs-2

### How to run the backend locally

From the repository root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

The backend will be available at `http://127.0.0.1:8000`.

### How to run the frontend locally

Open a second terminal and run:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The frontend will usually open at `http://127.0.0.1:5173`.

### How the frontend connects to the backend

The frontend reads the backend URL from:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

This value lives in [`frontend/.env.example`](/Users/akhiludumala/Documents/bone-fracture/frontend/.env.example).

When the user submits the form:

1. The frontend checks the values locally with the same ranges as the backend contract.
2. If the data is valid, it sends the JSON body to `POST /predict`.
3. The backend returns the prediction result.
4. The frontend renders the result card, chart, top features, rehab tips, and print summary.

### Beginner-friendly frontend explanation

- The form is built with `react-hook-form`, which helps manage form values and validation messages.
- `zod` acts like a rulebook for the frontend. It checks that age, BMI, scores, and booleans match the backend rules before the API call happens.
- `axios` handles the HTTP request to the backend.
- The result card is kept on the same page so the user can edit the form and resubmit without losing context.
- The what-if simulator does not invent new data fields. It only changes `nutrition_score` and `rehab_adherence`, then sends another real `POST /predict` request.
- The print/export button uses the browser’s built-in print dialog, which keeps the implementation simple and reliable.
