import { z } from "zod";
import {
  boneAffectedValues,
  driverDirectionValues,
  fractureTypeValues,
  healingCategoryValues,
  topFeatureValues,
  type PatientInput,
} from "@/types/api";

export const patientInputSchema = z.object({
  age: z
    .number({
      required_error: "Age is required.",
      invalid_type_error: "Age must be a number.",
    })
    .finite("Age must be a number.")
    .int("Age must be a whole number.")
    .min(1, "Age must be at least 1.")
    .max(110, "Age must be 110 or less."),
  fracture_type: z.enum(fractureTypeValues, {
    required_error: "Fracture type is required.",
  }),
  bone_affected: z.enum(boneAffectedValues, {
    required_error: "Bone affected is required.",
  }),
  nutrition_score: z
    .number({
      required_error: "Nutrition score is required.",
      invalid_type_error: "Nutrition score must be a number.",
    })
    .finite("Nutrition score must be a number.")
    .int("Nutrition score must be a whole number.")
    .min(1, "Nutrition score must be between 1 and 10.")
    .max(10, "Nutrition score must be between 1 and 10."),
  rehab_adherence: z
    .number({
      required_error: "Rehab adherence is required.",
      invalid_type_error: "Rehab adherence must be a number.",
    })
    .finite("Rehab adherence must be a number.")
    .int("Rehab adherence must be a whole number.")
    .min(1, "Rehab adherence must be between 1 and 10.")
    .max(10, "Rehab adherence must be between 1 and 10."),
  bmi: z
    .number({
      required_error: "BMI is required.",
      invalid_type_error: "BMI must be a number.",
    })
    .finite("BMI must be a number.")
    .min(10, "BMI must be at least 10.0.")
    .max(60, "BMI must be 60.0 or less."),
  diabetes: z.boolean({
    required_error: "Please confirm diabetes status.",
    invalid_type_error: "Diabetes must be true or false.",
  }),
  osteoporosis: z.boolean({
    required_error: "Please confirm osteoporosis status.",
    invalid_type_error: "Osteoporosis must be true or false.",
  }),
  smoker: z.boolean({
    required_error: "Please confirm smoking status.",
    invalid_type_error: "Smoker must be true or false.",
  }),
});

export const patientIntakeSchema = patientInputSchema
  .omit({
    bmi: true,
    nutrition_score: true,
    rehab_adherence: true,
  })
  .extend({
    patient_name: z
      .string({
        required_error: "Patient name is required.",
        invalid_type_error: "Patient name must be text.",
      })
      .trim()
      .min(1, "Patient name is required.")
      .max(80, "Patient name must be 80 characters or less."),
    height_cm: z
      .number({
        required_error: "Height is required.",
        invalid_type_error: "Height must be a number.",
      })
      .finite("Height must be a number.")
      .min(100, "Height must be at least 100 cm.")
      .max(230, "Height must be 230 cm or less."),
    weight_kg: z
      .number({
        required_error: "Weight is required.",
        invalid_type_error: "Weight must be a number.",
      })
      .finite("Weight must be a number.")
      .min(20, "Weight must be at least 20 kg.")
      .max(250, "Weight must be 250 kg or less."),
    balanced_meals_per_day: z
      .number({
        required_error: "Balanced meals per day is required.",
        invalid_type_error: "Balanced meals per day must be a number.",
      })
      .finite("Balanced meals per day must be a number.")
      .int("Balanced meals per day must be a whole number.")
      .min(0, "Balanced meals per day must be between 0 and 4.")
      .max(4, "Balanced meals per day must be between 0 and 4."),
    protein_servings_per_day: z
      .number({
        required_error: "Protein servings per day is required.",
        invalid_type_error: "Protein servings per day must be a number.",
      })
      .finite("Protein servings per day must be a number.")
      .int("Protein servings per day must be a whole number.")
      .min(0, "Protein servings per day must be between 0 and 5.")
      .max(5, "Protein servings per day must be between 0 and 5."),
    hydration_cups_per_day: z
      .number({
        required_error: "Water intake is required.",
        invalid_type_error: "Water intake must be a number.",
      })
      .finite("Water intake must be a number.")
      .int("Water intake must be a whole number.")
      .min(0, "Water intake must be between 0 and 12 cups.")
      .max(12, "Water intake must be between 0 and 12 cups."),
    rehab_sessions_per_week: z
      .number({
        required_error: "Rehab sessions per week is required.",
        invalid_type_error: "Rehab sessions per week must be a number.",
      })
      .finite("Rehab sessions per week must be a number.")
      .int("Rehab sessions per week must be a whole number.")
      .min(0, "Rehab sessions per week must be between 0 and 7.")
      .max(7, "Rehab sessions per week must be between 0 and 7."),
    home_exercise_days_per_week: z
      .number({
        required_error: "Home exercise days per week is required.",
        invalid_type_error: "Home exercise days per week must be a number.",
      })
      .finite("Home exercise days per week must be a number.")
      .int("Home exercise days per week must be a whole number.")
      .min(0, "Home exercise days per week must be between 0 and 7.")
      .max(7, "Home exercise days per week must be between 0 and 7."),
    follows_weight_bearing_guidance: z.boolean({
      required_error: "Please confirm weight-bearing guidance status.",
      invalid_type_error: "Weight-bearing guidance must be true or false.",
    }),
  })
  .superRefine((values, context) => {
    const bmi = calculateBmi(values.height_cm, values.weight_kg);

    if (bmi < 10 || bmi > 60) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Height and weight must calculate to a BMI from 10.0 to 60.0.",
        path: ["weight_kg"],
      });
    }
  });

export function calculateBmi(heightCm: number, weightKg: number) {
  const heightMeters = heightCm / 100;
  return Number((weightKg / (heightMeters * heightMeters)).toFixed(1));
}

export function calculateNutritionScore(values: {
  balanced_meals_per_day: number;
  protein_servings_per_day: number;
  hydration_cups_per_day: number;
}) {
  return clampScore(
    Math.round(
      (Math.min(values.balanced_meals_per_day, 3) / 3) * 4 +
        (Math.min(values.protein_servings_per_day, 4) / 4) * 3 +
        (Math.min(values.hydration_cups_per_day, 8) / 8) * 3,
    ),
  );
}

export function calculateRehabAdherence(values: {
  rehab_sessions_per_week: number;
  home_exercise_days_per_week: number;
  follows_weight_bearing_guidance: boolean;
}) {
  return clampScore(
    Math.round(
      (values.rehab_sessions_per_week / 7) * 4 +
        (values.home_exercise_days_per_week / 7) * 4 +
        (values.follows_weight_bearing_guidance ? 2 : 0),
    ),
  );
}

export function buildPatientInputFromIntake(values: PatientIntakeFormValues): PatientInput {
  return {
    age: values.age,
    fracture_type: values.fracture_type,
    bone_affected: values.bone_affected,
    bmi: calculateBmi(values.height_cm, values.weight_kg),
    nutrition_score: calculateNutritionScore(values),
    rehab_adherence: calculateRehabAdherence(values),
    diabetes: values.diabetes,
    osteoporosis: values.osteoporosis,
    smoker: values.smoker,
  };
}

function clampScore(value: number) {
  return Math.min(10, Math.max(1, value));
}

export const predictionResponseSchema = z.object({
  predicted_weeks: z.number().positive(),
  week_range_low: z.number().min(0),
  week_range_high: z.number().min(0),
  category: z.enum(healingCategoryValues),
  week_range: z.string().min(1),
  confidence: z.number().min(0).max(1),
  uncertainty_weeks: z.number().min(0),
  probabilities: z.object({
    short: z.number().min(0).max(1),
    medium: z.number().min(0).max(1),
    long: z.number().min(0).max(1),
  }),
  top_features: z
    .array(
      z.object({
        feature: z.enum(topFeatureValues),
        importance: z.number().min(0).max(1),
      }),
    )
    .length(3),
  driver_signals: z
    .array(
      z.object({
        feature: z.enum(topFeatureValues),
        effect_weeks: z.number().min(0),
        direction: z.enum(driverDirectionValues),
      }),
    )
    .length(3),
  rehab_tips: z.array(z.string()).length(3),
});

export type PatientInputFormValues = z.infer<typeof patientInputSchema>;
export type PatientIntakeFormValues = z.infer<typeof patientIntakeSchema>;
export type PredictionResponseSchema = z.infer<typeof predictionResponseSchema>;
