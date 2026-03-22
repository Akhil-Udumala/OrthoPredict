# OrthoPredict API Contract

This document defines the strict shared contract for the OrthoPredict v1 prediction API.

---

## Endpoint

`POST /predict`

---

## Request Body

The request body must be a flat JSON object with exactly these fields:

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