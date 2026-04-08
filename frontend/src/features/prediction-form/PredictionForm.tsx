import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Stethoscope } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  boneAffectedOptions,
  DEFAULT_FORM_VALUES,
  fractureTypeOptions,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  buildPatientInputFromIntake,
  calculateBmi,
  calculateNutritionScore,
  calculateRehabAdherence,
  patientIntakeSchema,
  type PatientIntakeFormValues,
} from "@/types/form";
import type { PatientInput } from "@/types/api";

interface PredictionFormProps {
  onSubmit: (payload: PatientInput, intakeValues: PatientIntakeFormValues) => Promise<void>;
  isSubmitting: boolean;
  apiError: string | null;
  formRef: React.RefObject<HTMLDivElement>;
  initialValues?: PatientIntakeFormValues | null;
}

const motionTransition = { duration: 0.45, ease: "easeOut" as const };
const DEFAULT_INTAKE_VALUES = buildIntakeValuesFromPatientInput(DEFAULT_FORM_VALUES);

export function PredictionForm({
  onSubmit,
  isSubmitting,
  apiError,
  formRef,
  initialValues,
}: PredictionFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    trigger,
    reset,
    watch,
  } = useForm<PatientIntakeFormValues>({
    resolver: zodResolver(patientIntakeSchema),
    defaultValues: initialValues ?? DEFAULT_INTAKE_VALUES,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const watchedValues = watch();
  const derivedBmi = calculateBmi(
    watchedValues.height_cm || DEFAULT_INTAKE_VALUES.height_cm,
    watchedValues.weight_kg || DEFAULT_INTAKE_VALUES.weight_kg,
  );
  const derivedNutritionScore = calculateNutritionScore({
    balanced_meals_per_day:
      watchedValues.balanced_meals_per_day ?? DEFAULT_INTAKE_VALUES.balanced_meals_per_day,
    protein_servings_per_day:
      watchedValues.protein_servings_per_day ?? DEFAULT_INTAKE_VALUES.protein_servings_per_day,
    hydration_cups_per_day:
      watchedValues.hydration_cups_per_day ?? DEFAULT_INTAKE_VALUES.hydration_cups_per_day,
  });
  const derivedRehabAdherence = calculateRehabAdherence({
    rehab_sessions_per_week:
      watchedValues.rehab_sessions_per_week ?? DEFAULT_INTAKE_VALUES.rehab_sessions_per_week,
    home_exercise_days_per_week:
      watchedValues.home_exercise_days_per_week ??
      DEFAULT_INTAKE_VALUES.home_exercise_days_per_week,
    follows_weight_bearing_guidance:
      watchedValues.follows_weight_bearing_guidance ??
      DEFAULT_INTAKE_VALUES.follows_weight_bearing_guidance,
  });

  useEffect(() => {
    reset(initialValues ?? DEFAULT_INTAKE_VALUES);
  }, [initialValues, reset]);

  return (
    <motion.section
      ref={formRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTransition}
      className="no-print rounded-[2rem] border border-border/70 bg-card/75 p-5 shadow-soft backdrop-blur sm:p-7"
      aria-labelledby="prediction-form-title"
    >
      <div className="flex flex-col gap-4 border-b border-border/70 pb-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Stethoscope className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Patient Intake
          </p>
          <h2 id="prediction-form-title" className="text-2xl font-bold text-foreground">
            Enter the patient profile
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Enter familiar measurements and care habits. The app calculates BMI,
            nutrition score, and rehab adherence before sending the model request.
          </p>
        </div>
      </div>

      <form
        className="mt-6 grid gap-5 md:grid-cols-2"
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(buildPatientInputFromIntake(values), values);
        })}
      >
        <FieldGroup
          label="Patient Name"
          htmlFor="patient_name"
          helper="Used only for this doctor's prediction history and print summary."
          error={errors.patient_name?.message}
        >
          <Input
            id="patient_name"
            type="text"
            autoComplete="off"
            placeholder="Patient full name"
            {...register("patient_name")}
          />
        </FieldGroup>

        <FieldGroup
          label="Age"
          htmlFor="age"
          helper="Whole number from 1 to 110."
          error={errors.age?.message}
        >
          <Input
            id="age"
            type="number"
            min={1}
            max={110}
            step={1}
            inputMode="numeric"
            {...register("age", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
          />
        </FieldGroup>

        <Controller
          control={control}
          name="fracture_type"
          render={({ field }) => (
            <FieldGroup
              label="Fracture Type"
              helper="Select one of the allowed contract values."
              error={errors.fracture_type?.message}
            >
              <Select
                value={field.value}
                onValueChange={async (value) => {
                  field.onChange(value);
                  await trigger("fracture_type");
                }}
              >
                <SelectTrigger aria-label="Fracture type">
                  <SelectValue placeholder="Choose fracture type" />
                </SelectTrigger>
                <SelectContent>
                  {fractureTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
          )}
        />

        <Controller
          control={control}
          name="bone_affected"
          render={({ field }) => (
            <FieldGroup
              label="Bone Affected"
              helper="Select the main bone involved."
              error={errors.bone_affected?.message}
            >
              <Select
                value={field.value}
                onValueChange={async (value) => {
                  field.onChange(value);
                  await trigger("bone_affected");
                }}
              >
                <SelectTrigger aria-label="Bone affected">
                  <SelectValue placeholder="Choose bone affected" />
                </SelectTrigger>
                <SelectContent>
                  {boneAffectedOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
          )}
        />

        <FieldGroup
          label="Height"
          htmlFor="height_cm"
          helper="Centimeters, from 100 to 230."
          error={errors.height_cm?.message}
        >
          <Input
            id="height_cm"
            type="number"
            min={100}
            max={230}
            step={0.1}
            inputMode="decimal"
            {...register("height_cm", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
          />
        </FieldGroup>

        <FieldGroup
          label="Weight"
          htmlFor="weight_kg"
          helper="Kilograms, from 20 to 250."
          error={errors.weight_kg?.message}
        >
          <Input
            id="weight_kg"
            type="number"
            min={20}
            max={250}
            step={0.1}
            inputMode="decimal"
            {...register("weight_kg", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
          />
        </FieldGroup>

        <div className="md:col-span-2">
          <DerivedSummary
            bmi={derivedBmi}
            nutritionScore={derivedNutritionScore}
            rehabAdherence={derivedRehabAdherence}
          />
        </div>

        <FieldGroup
          label="Balanced meals per day"
          htmlFor="balanced_meals_per_day"
          helper="Meals with a mix of protein, grains, fruit, or vegetables. 0 to 4."
          error={errors.balanced_meals_per_day?.message}
        >
          <Input
            id="balanced_meals_per_day"
            type="number"
            min={0}
            max={4}
            step={1}
            inputMode="numeric"
            {...register("balanced_meals_per_day", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
          />
        </FieldGroup>

        <FieldGroup
          label="Protein servings per day"
          htmlFor="protein_servings_per_day"
          helper="Examples include eggs, dairy, beans, fish, chicken, tofu, or meat. 0 to 5."
          error={errors.protein_servings_per_day?.message}
        >
          <Input
            id="protein_servings_per_day"
            type="number"
            min={0}
            max={5}
            step={1}
            inputMode="numeric"
            {...register("protein_servings_per_day", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
          />
        </FieldGroup>

        <FieldGroup
          label="Water cups per day"
          htmlFor="hydration_cups_per_day"
          helper="Approximate daily cups of water or similar fluids. 0 to 12."
          error={errors.hydration_cups_per_day?.message}
        >
          <Input
            id="hydration_cups_per_day"
            type="number"
            min={0}
            max={12}
            step={1}
            inputMode="numeric"
            {...register("hydration_cups_per_day", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
          />
        </FieldGroup>

        <FieldGroup
          label="Rehab sessions per week"
          htmlFor="rehab_sessions_per_week"
          helper="In-person or guided rehab sessions completed each week. 0 to 7."
          error={errors.rehab_sessions_per_week?.message}
        >
          <Input
            id="rehab_sessions_per_week"
            type="number"
            min={0}
            max={7}
            step={1}
            inputMode="numeric"
            {...register("rehab_sessions_per_week", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
          />
        </FieldGroup>

        <FieldGroup
          label="Home exercise days per week"
          htmlFor="home_exercise_days_per_week"
          helper="Days the prescribed home routine is completed. 0 to 7."
          error={errors.home_exercise_days_per_week?.message}
        >
          <Input
            id="home_exercise_days_per_week"
            type="number"
            min={0}
            max={7}
            step={1}
            inputMode="numeric"
            {...register("home_exercise_days_per_week", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
          />
        </FieldGroup>

        <Controller
          control={control}
          name="follows_weight_bearing_guidance"
          render={({ field }) => (
            <BooleanField
              label="Following weight-bearing guidance"
              helper="Toggle yes if the patient follows the clinician’s movement restrictions."
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked)}
            />
          )}
        />

        <Controller
          control={control}
          name="diabetes"
          render={({ field }) => (
            <BooleanField
              label="Diabetes"
              helper="Toggle whether diabetes is present."
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked)}
            />
          )}
        />

        <Controller
          control={control}
          name="osteoporosis"
          render={({ field }) => (
            <BooleanField
              label="Osteoporosis"
              helper="Toggle whether osteoporosis is present."
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked)}
            />
          )}
        />

        <Controller
          control={control}
          name="smoker"
          render={({ field }) => (
            <BooleanField
              label="Smoker"
              helper="Toggle whether the patient currently smokes."
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked)}
            />
          )}
        />

        <div className="md:col-span-2">
          {apiError ? (
            <div
              role="alert"
              className="mb-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {apiError}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              The model request still uses the original BMI, nutrition, and rehab fields.
            </p>
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? "Requesting prediction..." : "Predict healing time"}
            </Button>
          </div>
        </div>
      </form>
    </motion.section>
  );
}

function buildIntakeValuesFromPatientInput(input: PatientInput): PatientIntakeFormValues {
  const heightCm = 170;
  const weightKg = Number((input.bmi * (heightCm / 100) ** 2).toFixed(1));

  return {
    patient_name: "",
    age: input.age,
    fracture_type: input.fracture_type,
    bone_affected: input.bone_affected,
    height_cm: heightCm,
    weight_kg: weightKg,
    balanced_meals_per_day: Math.min(4, Math.max(0, Math.round((input.nutrition_score / 10) * 3))),
    protein_servings_per_day: Math.min(5, Math.max(0, Math.round((input.nutrition_score / 10) * 4))),
    hydration_cups_per_day: Math.min(12, Math.max(0, Math.round((input.nutrition_score / 10) * 8))),
    rehab_sessions_per_week: Math.min(7, Math.max(0, Math.round((input.rehab_adherence / 10) * 7))),
    home_exercise_days_per_week: Math.min(
      7,
      Math.max(0, Math.round((input.rehab_adherence / 10) * 7)),
    ),
    follows_weight_bearing_guidance: input.rehab_adherence >= 7,
    diabetes: input.diabetes,
    osteoporosis: input.osteoporosis,
    smoker: input.smoker,
  };
}

interface FieldGroupProps {
  label: string;
  htmlFor?: string;
  helper: string;
  error?: string;
  children: React.ReactNode;
}

function FieldGroup({ label, htmlFor, helper, error, children }: FieldGroupProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor={htmlFor}>{label}</Label>
        <p className="text-xs leading-5 text-muted-foreground">{helper}</p>
      </div>
      {children}
      <p className={cn("min-h-5 text-xs", error ? "text-destructive" : "text-transparent")}>
        {error ?? "Valid"}
      </p>
    </div>
  );
}

interface DerivedSummaryProps {
  bmi: number;
  nutritionScore: number;
  rehabAdherence: number;
}

function DerivedSummary({ bmi, nutritionScore, rehabAdherence }: DerivedSummaryProps) {
  return (
    <div className="grid gap-3 rounded-[1.5rem] border border-primary/15 bg-primary/5 p-4 sm:grid-cols-3">
      <DerivedMetric label="Calculated BMI" value={Number.isFinite(bmi) ? bmi.toFixed(1) : "--"} />
      <DerivedMetric label="Nutrition score" value={`${nutritionScore}/10`} />
      <DerivedMetric label="Rehab adherence" value={`${rehabAdherence}/10`} />
    </div>
  );
}

interface DerivedMetricProps {
  label: string;
  value: string;
}

function DerivedMetric({ label, value }: DerivedMetricProps) {
  return (
    <div className="rounded-2xl bg-card/75 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-primary">{value}</p>
    </div>
  );
}

interface BooleanFieldProps {
  label: string;
  helper: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function BooleanField({ label, helper, checked, onCheckedChange }: BooleanFieldProps) {
  return (
    <div className="space-y-3 rounded-[1.5rem] border border-border/70 bg-card/75 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label>{label}</Label>
          <p className="text-xs leading-5 text-muted-foreground">{helper}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{checked ? "Yes" : "No"}</span>
          <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
        </div>
      </div>
    </div>
  );
}
