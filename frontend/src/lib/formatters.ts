import { categoryCopy, driverDirectionLabels, featureLabels } from "@/lib/constants";
import type {
  DriverSignal,
  FeatureName,
  HealingCategory,
  PatientInput,
} from "@/types/api";

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function formatDecimal(value: number) {
  return value.toFixed(1);
}

export function formatWeeks(value: number) {
  return `${formatDecimal(value)} weeks`;
}

export function getCategoryLabel(category: HealingCategory) {
  return categoryCopy[category].label;
}

export function getFeatureLabel(feature: FeatureName) {
  return featureLabels[feature];
}

export function describeBoolean(value: boolean) {
  return value ? "Yes" : "No";
}

export function buildPatientSummary(input: PatientInput) {
  return [
    { label: "Age", value: `${input.age}` },
    { label: "Fracture Type", value: featureTitle(input.fracture_type) },
    { label: "Bone Affected", value: featureTitle(input.bone_affected) },
    { label: "Nutrition Score", value: `${input.nutrition_score}/10` },
    { label: "Rehab Adherence", value: `${input.rehab_adherence}/10` },
    { label: "BMI", value: formatDecimal(input.bmi) },
    { label: "Diabetes", value: describeBoolean(input.diabetes) },
    { label: "Osteoporosis", value: describeBoolean(input.osteoporosis) },
    { label: "Smoker", value: describeBoolean(input.smoker) },
  ];
}

export function featureTitle(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function describeDriverSignal(signal: DriverSignal) {
  return `${driverDirectionLabels[signal.direction]} by ${formatDecimal(signal.effect_weeks)} weeks`;
}
