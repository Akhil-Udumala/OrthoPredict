import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatPercent, formatWeeks } from "@/lib/formatters";
import type { PatientInput, PredictionResponse } from "@/types/api";
import {
  calculateNutritionScore,
  calculateRehabAdherence,
  type PatientIntakeFormValues,
} from "@/types/form";

type SimulatorInputs = Pick<
  PatientIntakeFormValues,
  | "balanced_meals_per_day"
  | "protein_servings_per_day"
  | "hydration_cups_per_day"
  | "rehab_sessions_per_week"
  | "home_exercise_days_per_week"
  | "follows_weight_bearing_guidance"
>;

interface WhatIfSimulatorProps {
  baseInput: PatientInput;
  baseIntake: PatientIntakeFormValues | null;
  baseResult: PredictionResponse;
  simulatedResult: PredictionResponse | null;
  isSimulating: boolean;
  error: string | null;
  onSimulate: (overrides: Pick<PatientInput, "nutrition_score" | "rehab_adherence">) => Promise<void>;
}

export function WhatIfSimulator({
  baseInput,
  baseIntake,
  baseResult,
  simulatedResult,
  isSimulating,
  error,
  onSimulate,
}: WhatIfSimulatorProps) {
  const [open, setOpen] = useState(false);
  const [simulatorInputs, setSimulatorInputs] = useState<SimulatorInputs>(() =>
    buildSimulatorInputs(baseInput, baseIntake),
  );

  useEffect(() => {
    setSimulatorInputs(buildSimulatorInputs(baseInput, baseIntake));
  }, [baseInput, baseIntake]);

  const nutritionScore = calculateNutritionScore(simulatorInputs);
  const rehabAdherence = calculateRehabAdherence(simulatorInputs);

  const comparisonCopy = useMemo(() => {
    if (!simulatedResult) {
      return "Adjust the nutrition and rehab habits below to explore how modifiable inputs might shift the estimate.";
    }

    const deltaWeeks = simulatedResult.predicted_weeks - baseResult.predicted_weeks;
    const deltaLabel =
      Math.abs(deltaWeeks) < 0.05
        ? "stayed almost the same"
        : deltaWeeks > 0
          ? `increased by ${formatWeeks(Math.abs(deltaWeeks))}`
          : `decreased by ${formatWeeks(Math.abs(deltaWeeks))}`;

    if (simulatedResult.category === baseResult.category) {
      return `The simulated category stayed ${simulatedResult.category}, and the estimated healing time ${deltaLabel}.`;
    }

    return `The simulated outcome moved from ${baseResult.category} to ${simulatedResult.category}, and the estimate ${deltaLabel}.`;
  }, [baseResult, simulatedResult]);

  async function runSimulation() {
    await onSimulate({
      nutrition_score: nutritionScore,
      rehab_adherence: rehabAdherence,
    });
  }

  function updateSimulatorInput(name: keyof SimulatorInputs, value: number | boolean) {
    setSimulatorInputs((current) => ({
      ...current,
      [name]: value,
    }));
  }

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-soft backdrop-blur sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            What-if simulator
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Explore modifiable recovery habits
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            The simulator keeps every other field fixed and calculates updated
            nutrition and rehab scores from plain-language habit inputs.
          </p>
        </div>

        <Button type="button" variant="outline" onClick={() => setOpen((value) => !value)}>
          {open ? "Hide simulator" : "Open simulator"}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-5 rounded-[1.75rem] border border-border/70 bg-secondary/45 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <SimulatorNumberField
                    label="Balanced meals per day"
                    min={0}
                    max={4}
                    value={simulatorInputs.balanced_meals_per_day}
                    onChange={(value) => updateSimulatorInput("balanced_meals_per_day", value)}
                  />
                  <SimulatorNumberField
                    label="Protein servings per day"
                    min={0}
                    max={5}
                    value={simulatorInputs.protein_servings_per_day}
                    onChange={(value) => updateSimulatorInput("protein_servings_per_day", value)}
                  />
                  <SimulatorNumberField
                    label="Water cups per day"
                    min={0}
                    max={12}
                    value={simulatorInputs.hydration_cups_per_day}
                    onChange={(value) => updateSimulatorInput("hydration_cups_per_day", value)}
                  />
                  <SimulatorNumberField
                    label="Rehab sessions per week"
                    min={0}
                    max={7}
                    value={simulatorInputs.rehab_sessions_per_week}
                    onChange={(value) => updateSimulatorInput("rehab_sessions_per_week", value)}
                  />
                  <SimulatorNumberField
                    label="Home exercise days"
                    min={0}
                    max={7}
                    value={simulatorInputs.home_exercise_days_per_week}
                    onChange={(value) =>
                      updateSimulatorInput("home_exercise_days_per_week", value)
                    }
                  />
                  <SimulatorBooleanField
                    label="Following movement restrictions"
                    checked={simulatorInputs.follows_weight_bearing_guidance}
                    onCheckedChange={(checked) =>
                      updateSimulatorInput("follows_weight_bearing_guidance", checked)
                    }
                  />
                </div>

                <div className="grid gap-3 rounded-[1.5rem] bg-white/85 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                  <p className="text-sm text-foreground">
                    Nutrition score: <strong>{nutritionScore}/10</strong>
                  </p>
                  <p className="text-sm text-foreground">
                    Rehab adherence: <strong>{rehabAdherence}/10</strong>
                  </p>
                  <Button type="button" onClick={runSimulation} disabled={isSimulating}>
                    {isSimulating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Run simulation
                  </Button>
                </div>

                {isSimulating ? (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running updated prediction...
                  </div>
                ) : null}

                {error ? (
                  <p className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className="rounded-[1.75rem] border border-border/70 bg-white/85 p-5">
                <h3 className="text-sm font-semibold text-foreground">Comparison summary</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{comparisonCopy}</p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <ComparisonCard
                    title="Original"
                    category={baseResult.category}
                    confidence={baseResult.confidence}
                    weekRange={baseResult.week_range}
                    predictedWeeks={baseResult.predicted_weeks}
                  />
                  <ComparisonCard
                    title="Simulated"
                    category={simulatedResult?.category ?? baseResult.category}
                    confidence={simulatedResult?.confidence ?? baseResult.confidence}
                    weekRange={simulatedResult?.week_range ?? baseResult.week_range}
                    predictedWeeks={simulatedResult?.predicted_weeks ?? baseResult.predicted_weeks}
                    muted={!simulatedResult}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

function buildSimulatorInputs(
  baseInput: PatientInput,
  baseIntake: PatientIntakeFormValues | null,
): SimulatorInputs {
  if (baseIntake) {
    return {
      balanced_meals_per_day: baseIntake.balanced_meals_per_day,
      protein_servings_per_day: baseIntake.protein_servings_per_day,
      hydration_cups_per_day: baseIntake.hydration_cups_per_day,
      rehab_sessions_per_week: baseIntake.rehab_sessions_per_week,
      home_exercise_days_per_week: baseIntake.home_exercise_days_per_week,
      follows_weight_bearing_guidance: baseIntake.follows_weight_bearing_guidance,
    };
  }

  return {
    balanced_meals_per_day: Math.min(
      4,
      Math.max(0, Math.round((baseInput.nutrition_score / 10) * 3)),
    ),
    protein_servings_per_day: Math.min(
      5,
      Math.max(0, Math.round((baseInput.nutrition_score / 10) * 4)),
    ),
    hydration_cups_per_day: Math.min(
      12,
      Math.max(0, Math.round((baseInput.nutrition_score / 10) * 8)),
    ),
    rehab_sessions_per_week: Math.min(
      7,
      Math.max(0, Math.round((baseInput.rehab_adherence / 10) * 7)),
    ),
    home_exercise_days_per_week: Math.min(
      7,
      Math.max(0, Math.round((baseInput.rehab_adherence / 10) * 7)),
    ),
    follows_weight_bearing_guidance: baseInput.rehab_adherence >= 7,
  };
}

interface SimulatorNumberFieldProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

function SimulatorNumberField({
  label,
  min,
  max,
  value,
  onChange,
}: SimulatorNumberFieldProps) {
  return (
    <div className="space-y-2 rounded-[1.5rem] bg-white/85 p-4">
      <Label>{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        step={1}
        inputMode="numeric"
        value={value}
        onChange={(event) => {
          const parsedValue = Number(event.currentTarget.value);
          onChange(Math.min(max, Math.max(min, Number.isFinite(parsedValue) ? parsedValue : min)));
        }}
        aria-label={label}
      />
      <p className="text-xs text-muted-foreground">
        Enter a whole number from {min} to {max}.
      </p>
    </div>
  );
}

interface SimulatorBooleanFieldProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SimulatorBooleanField({
  label,
  checked,
  onCheckedChange,
}: SimulatorBooleanFieldProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.5rem] bg-white/85 p-4">
      <div className="space-y-2">
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">{checked ? "Yes" : "No"}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

interface ComparisonCardProps {
  title: string;
  category: string;
  weekRange: string;
  confidence: number;
  predictedWeeks: number;
  muted?: boolean;
}

function ComparisonCard({
  title,
  category,
  weekRange,
  confidence,
  predictedWeeks,
  muted = false,
}: ComparisonCardProps) {
  return (
    <div className={`rounded-2xl border border-border/70 p-4 ${muted ? "bg-secondary/35" : "bg-secondary/55"}`}>
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <p className="mt-3 text-xl font-semibold text-foreground">{weekRange}</p>
      <p className="mt-1 text-sm capitalize text-muted-foreground">{category}</p>
      <p className="mt-3 text-sm text-foreground">Estimate: {formatWeeks(predictedWeeks)}</p>
      <p className="mt-1 text-sm text-foreground">Confidence: {formatPercent(confidence)}</p>
    </div>
  );
}
