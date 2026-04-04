import { z } from "zod";
import {
  boneAffectedValues,
  driverDirectionValues,
  fractureTypeValues,
  healingCategoryValues,
  topFeatureValues,
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
export type PredictionResponseSchema = z.infer<typeof predictionResponseSchema>;
