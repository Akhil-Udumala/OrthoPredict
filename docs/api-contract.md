# OrthoPredict API Contract

This document defines the shared prediction API contract for OrthoPredict v2.

## Endpoint

`POST /predict`

## Request Body

The request body is a flat JSON object with exactly these fields:

```json
{
  "age": 38,
  "fracture_type": "simple",
  "bone_affected": "tibia",
  "nutrition_score": 7,
  "rehab_adherence": 8,
  "bmi": 24.6,
  "diabetes": false,
  "osteoporosis": false,
  "smoker": false
}
```

## Response Body

The response no longer maps `category` to a fixed display range. It now returns a personalized numeric estimate and uses `week_range` only as a formatted string built from the personalized low/high bounds.

- `predicted_weeks`: personalized estimate derived from model probabilities
- `week_range_low`: lower numeric bound of the personalized interval
- `week_range_high`: upper numeric bound of the personalized interval
- `category`: derived from `predicted_weeks`
- `week_range`: display label built from `week_range_low` and `week_range_high`
- `confidence`: highest class probability
- `uncertainty_weeks`: maximum distance from `predicted_weeks` to either bound
- `probabilities`: `short`, `medium`, `long`
- `top_features`: top 3 influential factors for this prediction
- `driver_signals`: top 3 patient-specific signals with signed directionality
- `rehab_tips`: 3 rehab suggestions

Example:

```json
{
  "predicted_weeks": 9.5,
  "week_range_low": 7.1,
  "week_range_high": 12.1,
  "category": "medium",
  "week_range": "7.1-12.1 weeks",
  "confidence": 0.934,
  "uncertainty_weeks": 2.6,
  "probabilities": {
    "short": 0.0654,
    "medium": 0.934,
    "long": 0.0006
  },
  "top_features": [
    {
      "feature": "fracture_type",
      "importance": 0.53
    },
    {
      "feature": "age",
      "importance": 0.27
    },
    {
      "feature": "rehab_adherence",
      "importance": 0.20
    }
  ],
  "driver_signals": [
    {
      "feature": "fracture_type",
      "effect_weeks": 2.5,
      "direction": "higher"
    },
    {
      "feature": "age",
      "effect_weeks": 1.3,
      "direction": "higher"
    },
    {
      "feature": "rehab_adherence",
      "effect_weeks": 0.9,
      "direction": "lower"
    }
  ],
  "rehab_tips": [
    "Attend scheduled follow-up appointments so healing can be monitored on time.",
    "Get enough sleep, hydration, and balanced meals throughout the recovery period.",
    "Avoid putting more weight on the injured bone than your clinician allows."
  ]
}
```

## Breaking Change Note

This is a response-contract change from the fixed-range contract:

- `week_range` is no longer a hardcoded category label
- added `predicted_weeks`
- added `week_range_low`
- added `week_range_high`
- added `uncertainty_weeks`
- added `driver_signals`

The source of truth for the exact request and response schema is `docs/schema.json`.
