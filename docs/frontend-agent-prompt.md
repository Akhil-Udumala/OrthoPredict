# Frontend Agent Prompt: OrthoPredict v1

You are the Frontend Agent for **OrthoPredict v1**, a browser-based web app that predicts bone fracture healing time from a small patient profile form.

Your job is to build the complete frontend application only.

Do not change the API contract, field names, validation ranges, or response structure. The frontend must consume the existing shared contract exactly as written in:

- `/Users/akhiludumala/Documents/bone-fracture/docs/schema.json`
- `/Users/akhiludumala/Documents/bone-fracture/docs/api-contract.md`

## Product Goal

Build a single-page web application that allows a doctor or patient to:

1. acknowledge an advisory-only disclaimer
2. enter fracture-related patient data
3. submit the form to `POST /predict`
4. view the prediction result in a clear, non-technical format
5. optionally adjust nutrition score and rehab adherence in a what-if simulator
6. print or export the result using the browser print flow

This is a decision-support tool, not a diagnostic tool.

## Required Tech Stack

Use exactly this frontend stack unless there is a strong technical blocker:

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- react-hook-form
- zod
- axios
- framer-motion
- chart.js
- react-chartjs-2

Do not introduce state-management libraries such as Redux or Zustand.
Do not add routing unless strictly necessary. This should remain a single-page app.

## High-Level Frontend Architecture

Build the frontend as a small feature-oriented React app with these layers:

### App shell
- App root
- page layout
- sticky header
- disclaimer gating
- main content area

### Features
- `prediction-form`
- `prediction-result`
- `what-if-simulator`
- `prediction-history` (optional if time permits, session only)
- `print-export`

### Shared infrastructure
- typed API client
- shared TypeScript interfaces derived from the API contract
- zod form schema matching the API contract
- utility formatters
- app constants for enums and labels

## UX Requirements

### Overall behavior
- Single-page layout only
- No route transitions
- Fast to understand for beginner users
- Plain language for patients, but still credible for doctors
- Responsive from mobile width `375px` upward
- Accessible keyboard navigation and screen-reader labeling

### Main UI states

#### 1. Disclaimer modal
- Show on first visit of a browser session
- Block interaction until acknowledged
- Store acknowledgement in `sessionStorage`
- Include advisory-only wording
- Include one clear action button such as `I understand`

#### 2. Patient input form
- Show all 9 required input fields from the contract
- Use exactly the same field names in code as the API contract:
  - `age`
  - `fracture_type`
  - `bone_affected`
  - `nutrition_score`
  - `rehab_adherence`
  - `bmi`
  - `diabetes`
  - `osteoporosis`
  - `smoker`
- Validate on blur and on submit
- Show inline validation errors beside or below the field
- Disable submit while the request is pending
- Show a visible loading state while waiting for the backend

#### 3. Result panel
- Render below the form after a successful prediction
- Keep the form visible above for editing
- Show:
  - category badge
  - week range
  - confidence display
  - category probability chart
  - top 3 influential features in plain language
  - 3 rehab tips
  - `Edit Inputs` or equivalent interaction
  - `Print / Export` action

#### 4. What-if simulator
- Place this inside or below the result area
- Make it collapsible
- Allow changing only:
  - `nutrition_score`
  - `rehab_adherence`
- On slider release or interaction completion, send a fresh `POST /predict`
- Compare the updated result with the original prediction in plain language

## Visual Design Direction

Design for a modern healthcare analytics feel:

- clean and calm, not playful
- clinical but friendly
- minimal but not empty
- strong information hierarchy

Use a light theme as the default.

Recommended visual direction:
- off-white or soft neutral page background
- one medical accent color such as teal, blue, or green
- one warning/accent color for disclaimers and long-term outcomes
- restrained shadows
- strong spacing rhythm
- rounded cards and controls

Typography:
- use a readable modern sans-serif stack
- keep headings strong and compact
- keep body text simple and legible

Animation:
- use Framer Motion sparingly
- animate the result panel reveal
- animate chart and card entrances subtly
- avoid decorative motion overload

## Exact Form Requirements

### Field controls
- `age`: numeric input
- `fracture_type`: select
- `bone_affected`: select
- `nutrition_score`: slider or stepped range control
- `rehab_adherence`: slider or stepped range control
- `bmi`: numeric input with decimal support
- `diabetes`: toggle, switch, or radio boolean control
- `osteoporosis`: toggle, switch, or radio boolean control
- `smoker`: toggle, switch, or radio boolean control

### Allowed values
These must match the contract exactly:

- `fracture_type`: `simple`, `compound`, `stress`, `comminuted`, `hairline`
- `bone_affected`: `femur`, `tibia`, `radius`, `ulna`, `humerus`, `clavicle`, `rib`, `foot`, `wrist`, `other`
- `age`: integer `1` to `110`
- `nutrition_score`: integer `1` to `10`
- `rehab_adherence`: integer `1` to `10`
- `bmi`: number `10.0` to `60.0`
- booleans: `true` or `false`

### Validation rules
- frontend validation must match the contract exactly
- reject missing required fields
- reject out-of-range values
- do not coerce invalid strings into valid values silently
- show clear human-readable validation messages

## API Integration Requirements

### Endpoint
- `POST /predict`

### Request
- Send JSON exactly matching the request example in `api-contract.md`

### Response
- Parse JSON exactly matching the response example in `api-contract.md`

### Important rules
- use `snake_case` keys in API payloads
- do not rename backend fields in the transport layer
- if you want friendlier labels in the UI, map them only at the presentation layer
- handle loading, success, and failure states explicitly
- show a friendly error message if the API call fails

### Suggested API client structure
- `src/lib/api/client.ts`
- `src/lib/api/predict.ts`
- `src/types/api.ts`

## Chart Requirements

Use **Chart.js** with `react-chartjs-2`.

Build one probability chart for:
- `short`
- `medium`
- `long`

Preferred chart type:
- vertical bar chart or horizontal bar chart

Requirements:
- clearly label each category
- show probability values in a readable way
- make the chart responsive
- ensure color is not the only indicator
- keep the visual style consistent with the app theme

Do not use Recharts.

## Explanation Display Requirements

The backend returns:
- `top_features`: exactly 3 entries
- each entry has:
  - `feature`
  - `importance`

Convert raw field names into plain UI labels:
- `age` -> `Age`
- `fracture_type` -> `Fracture Type`
- `bone_affected` -> `Bone Affected`
- `nutrition_score` -> `Nutrition Score`
- `rehab_adherence` -> `Rehab Adherence`
- `bmi` -> `BMI`
- `diabetes` -> `Diabetes`
- `osteoporosis` -> `Osteoporosis`
- `smoker` -> `Smoker`

Display these as plain-language “key factors” rather than low-level ML jargon.

## Print / Export Requirements

Use the browser print flow, not PDF generation libraries.

Requirements:
- add a `Print / Export` button
- provide print-specific styles
- print output should include:
  - patient input summary
  - category
  - week range
  - confidence
  - top features
  - rehab tips
- hide non-essential interactive UI while printing

## Session State Requirements

Use `sessionStorage` only for:
- disclaimer acknowledgement
- optional recent prediction history

Do not store any data on a server.
Do not introduce a database.

## Suggested Folder Structure

Use this structure or something very close to it:

```text
frontend/
  src/
    app/
      App.tsx
      providers.tsx
    components/
      ui/
      layout/
    features/
      disclaimer/
      prediction-form/
      prediction-result/
      what-if-simulator/
      print-export/
    lib/
      api/
      storage/
      utils/
      constants/
    styles/
      globals.css
      print.css
    types/
      api.ts
      form.ts
    main.tsx
  public/
  index.html
```

## Component Responsibilities

### Header
- product name
- short supporting line
- optional about or advisory trigger

### DisclaimerModal
- blocks app usage until confirmed
- stores session flag

### PredictionForm
- renders all fields
- owns local validation and submission
- emits a typed request payload

### ResultCard
- shows category, week range, confidence, and summary

### ProbabilityChart
- renders category probabilities with Chart.js

### TopFactorsList
- renders the 3 returned influential features with readable labels

### RehabTipsPanel
- shows the 3 returned rehab tips clearly

### WhatIfSimulator
- allows resubmission with modified nutrition and rehab adherence
- preserves the original result for comparison

### PrintSummary
- controls print-specific presentation and print trigger

## State Design

Keep state simple.

Suggested state ownership:
- App-level:
  - disclaimer accepted flag
  - latest prediction result
  - original prediction result for comparison
  - request status
- Form-level:
  - current input values
  - validation state
- Optional session history:
  - last 5 predictions only

Do not over-engineer the state model.

## Type Requirements

Create strict TypeScript types for:
- `PatientInput`
- `PredictionResponse`
- `HealingCategory`
- `ProbabilityMap`
- `TopFeature`

These types must match the API contract exactly.

## Error Handling Requirements

Handle these cases:
- network failure
- backend unavailable
- invalid response shape
- validation errors before submit

For each case:
- keep the message simple
- do not expose stack traces
- preserve the user’s entered form values

## Accessibility Requirements

The frontend must support:
- keyboard-only navigation
- visible focus states
- semantic form labels
- semantic buttons
- accessible dialog behavior for the disclaimer modal
- sufficient color contrast
- no color-only meaning in charts or status badges

## Acceptance Criteria

The frontend is complete when all of the following are true:

1. A new user sees the disclaimer modal before interacting with the form.
2. The form enforces all required fields and ranges from the contract.
3. Submitting valid data sends a correctly shaped `POST /predict` request.
4. The response renders category, week range, confidence, chart, top features, and rehab tips.
5. The what-if simulator can resubmit only nutrition and rehab adherence changes.
6. The page works on mobile and desktop layouts.
7. The page is printable with a clean print layout.
8. No extra fields or renamed API keys are introduced.

## Deliverables

The frontend agent should deliver:

- a complete React + TypeScript frontend app
- typed API integration for `POST /predict`
- responsive UI for the full v1 flow
- Chart.js probability visualization
- disclaimer modal
- what-if simulator
- print/export support
- basic frontend tests for critical flows

## Implementation Constraints

- Do not modify backend contracts.
- Do not add new product features outside the blueprint.
- Do not add authentication.
- Do not add persistence beyond session storage.
- Do not add a database.
- Do not add routing unless strictly needed.
- Do not use Recharts.

## Final Instruction

Build the frontend in a way that a beginner developer can read and maintain comfortably:

- keep components focused
- keep naming explicit
- avoid clever abstractions
- prefer simple, typed, readable code
