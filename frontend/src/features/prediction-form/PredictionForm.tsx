import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Stethoscope } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  boneAffectedOptions,
  DEFAULT_FORM_VALUES,
  fractureTypeOptions,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { patientInputSchema, type PatientInputFormValues } from "@/types/form";
import type { PatientInput } from "@/types/api";

interface PredictionFormProps {
  onSubmit: (payload: PatientInput) => Promise<void>;
  isSubmitting: boolean;
  apiError: string | null;
  formRef: React.RefObject<HTMLDivElement>;
}

const motionTransition = { duration: 0.45, ease: "easeOut" as const };

export function PredictionForm({
  onSubmit,
  isSubmitting,
  apiError,
  formRef,
}: PredictionFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    trigger,
  } = useForm<PatientInputFormValues>({
    resolver: zodResolver(patientInputSchema),
    defaultValues: DEFAULT_FORM_VALUES,
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  return (
    <motion.section
      ref={formRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTransition}
      className="no-print rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-soft backdrop-blur sm:p-7"
      aria-labelledby="prediction-form-title"
    >
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-6">
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
            Every field below maps directly to the backend contract. The form validates the
            same ranges before any request is sent.
          </p>
        </div>
      </div>

      <form
        className="mt-6 grid gap-5 md:grid-cols-2"
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
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
          label="BMI"
          htmlFor="bmi"
          helper="Decimal value from 10.0 to 60.0."
          error={errors.bmi?.message}
        >
          <Input
            id="bmi"
            type="number"
            min={10}
            max={60}
            step={0.1}
            inputMode="decimal"
            {...register("bmi", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
          />
        </FieldGroup>

        <Controller
          control={control}
          name="nutrition_score"
          render={({ field }) => (
            <SliderField
              label="Nutrition Score"
              helper="Integer score from 1 to 10."
              error={errors.nutrition_score?.message}
              value={field.value}
              onChange={(value) => field.onChange(value)}
              onCommit={() => trigger("nutrition_score")}
            />
          )}
        />

        <Controller
          control={control}
          name="rehab_adherence"
          render={({ field }) => (
            <SliderField
              label="Rehab Adherence"
              helper="Integer score from 1 to 10."
              error={errors.rehab_adherence?.message}
              value={field.value}
              onChange={(value) => field.onChange(value)}
              onCommit={() => trigger("rehab_adherence")}
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
              The request body will be sent in snake_case exactly as required by the backend.
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

interface SliderFieldProps {
  label: string;
  helper: string;
  error?: string;
  value: number;
  onChange: (value: number) => void;
  onCommit: () => void;
}

function SliderField({
  label,
  helper,
  error,
  value,
  onChange,
  onCommit,
}: SliderFieldProps) {
  return (
    <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-secondary/45 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label>{label}</Label>
          <p className="text-xs leading-5 text-muted-foreground">{helper}</p>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-primary">
          {value}/10
        </div>
      </div>
      <Slider
        min={1}
        max={10}
        step={1}
        value={[value]}
        onValueChange={(current) => onChange(current[0] ?? value)}
        onValueCommit={() => onCommit()}
        aria-label={label}
      />
      <p className={cn("min-h-5 text-xs", error ? "text-destructive" : "text-transparent")}>
        {error ?? "Valid"}
      </p>
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
    <div className="space-y-3 rounded-[1.5rem] border border-border/70 bg-white/75 p-4">
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

