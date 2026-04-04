import type { DriverDirection, FeatureName, HealingCategory, PatientInput } from "@/types/api";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://127.0.0.1:8000";

export const DISCLAIMER_STORAGE_KEY = "orthopredict.disclaimer_seen";

export const DEFAULT_FORM_VALUES: PatientInput = {
  age: 38,
  fracture_type: "simple",
  bone_affected: "tibia",
  nutrition_score: 7,
  rehab_adherence: 8,
  bmi: 24.6,
  diabetes: false,
  osteoporosis: false,
  smoker: false,
};

export const fractureTypeOptions = [
  { value: "hairline", label: "Hairline" },
  { value: "stress", label: "Stress" },
  { value: "simple", label: "Simple" },
  { value: "compound", label: "Compound" },
  { value: "comminuted", label: "Comminuted" },
] as const;

export const boneAffectedOptions = [
  { value: "femur", label: "Femur" },
  { value: "tibia", label: "Tibia" },
  { value: "radius", label: "Radius" },
  { value: "ulna", label: "Ulna" },
  { value: "humerus", label: "Humerus" },
  { value: "clavicle", label: "Clavicle" },
  { value: "rib", label: "Rib" },
  { value: "foot", label: "Foot" },
  { value: "wrist", label: "Wrist" },
  { value: "other", label: "Other" },
] as const;

export const featureLabels: Record<FeatureName, string> = {
  age: "Age",
  fracture_type: "Fracture Type",
  bone_affected: "Bone Affected",
  nutrition_score: "Nutrition Score",
  rehab_adherence: "Rehab Adherence",
  bmi: "BMI",
  diabetes: "Diabetes",
  osteoporosis: "Osteoporosis",
  smoker: "Smoker",
};

export const driverDirectionLabels: Record<DriverDirection, string> = {
  higher: "Adds time",
  lower: "Reduces time",
};

export const categoryCopy: Record<
  HealingCategory,
  { label: string; accent: string; description: string }
> = {
  short: {
    label: "Short healing outlook",
    accent: "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/25",
    description: "The current inputs suggest a faster recovery window than average.",
  },
  medium: {
    label: "Medium healing outlook",
    accent: "bg-sky-500/15 text-sky-700 ring-1 ring-sky-500/25",
    description: "The current inputs suggest a moderate recovery window with balanced risk.",
  },
  long: {
    label: "Long healing outlook",
    accent: "bg-amber-500/15 text-amber-800 ring-1 ring-amber-500/25",
    description: "The current inputs suggest a slower recovery window and higher caution.",
  },
};
