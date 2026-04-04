export const fractureTypeValues = [
  "hairline",
  "stress",
  "simple",
  "compound",
  "comminuted",
] as const;

export const boneAffectedValues = [
  "femur",
  "tibia",
  "radius",
  "ulna",
  "humerus",
  "clavicle",
  "rib",
  "foot",
  "wrist",
  "other",
] as const;

export const healingCategoryValues = ["short", "medium", "long"] as const;
export const driverDirectionValues = ["higher", "lower"] as const;

export const topFeatureValues = [
  "age",
  "fracture_type",
  "bone_affected",
  "nutrition_score",
  "rehab_adherence",
  "bmi",
  "diabetes",
  "osteoporosis",
  "smoker",
] as const;

export type FractureType = (typeof fractureTypeValues)[number];
export type BoneAffected = (typeof boneAffectedValues)[number];
export type HealingCategory = (typeof healingCategoryValues)[number];
export type FeatureName = (typeof topFeatureValues)[number];
export type DriverDirection = (typeof driverDirectionValues)[number];

export interface PatientInput {
  age: number;
  fracture_type: FractureType;
  bone_affected: BoneAffected;
  nutrition_score: number;
  rehab_adherence: number;
  bmi: number;
  diabetes: boolean;
  osteoporosis: boolean;
  smoker: boolean;
}

export interface ProbabilityMap {
  short: number;
  medium: number;
  long: number;
}

export interface TopFeature {
  feature: FeatureName;
  importance: number;
}

export interface DriverSignal {
  feature: FeatureName;
  effect_weeks: number;
  direction: DriverDirection;
}

export interface PredictionResponse {
  predicted_weeks: number;
  week_range_low: number;
  week_range_high: number;
  category: HealingCategory;
  week_range: string;
  confidence: number;
  uncertainty_weeks: number;
  probabilities: ProbabilityMap;
  top_features: TopFeature[];
  driver_signals: DriverSignal[];
  rehab_tips: string[];
}
