import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatPercent, formatWeeks } from "@/lib/formatters";
import type { PatientInput, PredictionResponse } from "@/types/api";

interface WhatIfSimulatorProps {
  baseInput: PatientInput;
  baseResult: PredictionResponse;
  simulatedResult: PredictionResponse | null;
  isSimulating: boolean;
  error: string | null;
  onSimulate: (overrides: Pick<PatientInput, "nutrition_score" | "rehab_adherence">) => Promise<void>;
}

export function WhatIfSimulator({
  baseInput,
  baseResult,
  simulatedResult,
  isSimulating,
  error,
  onSimulate,
}: WhatIfSimulatorProps) {
  const [open, setOpen] = useState(false);
  const [nutritionScore, setNutritionScore] = useState(baseInput.nutrition_score);
  const [rehabAdherence, setRehabAdherence] = useState(baseInput.rehab_adherence);

  useEffect(() => {
    setNutritionScore(baseInput.nutrition_score);
    setRehabAdherence(baseInput.rehab_adherence);
  }, [baseInput]);

  const comparisonCopy = useMemo(() => {
    if (!simulatedResult) {
      return "Adjust the two sliders below to explore how supportive lifestyle inputs might shift the estimate.";
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

  async function runSimulation(nextNutritionScore: number, nextRehabAdherence: number) {
    await onSimulate({
      nutrition_score: nextNutritionScore,
      rehab_adherence: nextRehabAdherence,
    });
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
            Explore two modifiable recovery factors
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            The simulator keeps every other field fixed and only resubmits
            <code className="mx-1 rounded bg-secondary px-1.5 py-0.5 text-xs">
              nutrition_score
            </code>
            and
            <code className="mx-1 rounded bg-secondary px-1.5 py-0.5 text-xs">
              rehab_adherence
            </code>
            .
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
                <SimulatorSlider
                  label="Nutrition score"
                  value={nutritionScore}
                  helper="Moves from 1 to 10, matching the contract exactly."
                  onChange={setNutritionScore}
                  onCommit={async (value) => {
                    await runSimulation(value, rehabAdherence);
                  }}
                />

                <SimulatorSlider
                  label="Rehab adherence"
                  value={rehabAdherence}
                  helper="Moves from 1 to 10 and triggers a fresh prediction on release."
                  onChange={setRehabAdherence}
                  onCommit={async (value) => {
                    await runSimulation(nutritionScore, value);
                  }}
                />

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

interface SimulatorSliderProps {
  label: string;
  value: number;
  helper: string;
  onChange: (value: number) => void;
  onCommit: (value: number) => Promise<void>;
}

function SimulatorSlider({
  label,
  value,
  helper,
  onChange,
  onCommit,
}: SimulatorSliderProps) {
  return (
    <div className="space-y-4 rounded-[1.5rem] bg-white/85 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">{label}</h4>
          <p className="text-xs leading-5 text-muted-foreground">{helper}</p>
        </div>
        <div className="rounded-full bg-secondary px-3 py-1 text-sm font-semibold text-primary">
          {value}/10
        </div>
      </div>
      <Slider
        min={1}
        max={10}
        step={1}
        value={[value]}
        onValueChange={(values) => onChange(values[0] ?? value)}
        onValueCommit={async (values) => {
          const committedValue = values[0] ?? value;
          await onCommit(committedValue);
        }}
        aria-label={label}
      />
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
