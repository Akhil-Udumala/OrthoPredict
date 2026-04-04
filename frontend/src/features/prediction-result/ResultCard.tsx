import { motion } from "framer-motion";
import { ArrowUpRight, PencilLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { categoryCopy } from "@/lib/constants";
import {
  buildPatientSummary,
  formatPercent,
  formatWeeks,
  getCategoryLabel,
} from "@/lib/formatters";
import type { PatientInput, PredictionResponse } from "@/types/api";
import { ProbabilityChart } from "./ProbabilityChart";
import { TopFeaturesList } from "./TopFeaturesList";
import { RehabTips } from "./RehabTips";
import { DriverSignalsList } from "./DriverSignalsList";
import { PrintExportButton } from "@/features/print-export/PrintExportButton";

interface ResultCardProps {
  result: PredictionResponse;
  submittedInput: PatientInput;
  onEditInputs: () => void;
}

export function ResultCard({ result, submittedInput, onEditInputs }: ResultCardProps) {
  const categoryMeta = categoryCopy[result.category];
  const patientSummary = buildPatientSummary(submittedInput);

  return (
    <motion.section
      id="prediction-result-print"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="print-target rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur sm:p-7"
      aria-labelledby="prediction-result-title"
    >
      <div className="flex flex-col gap-5 border-b border-slate-200/80 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <Badge className={categoryMeta.accent}>{getCategoryLabel(result.category)}</Badge>
          <div className="space-y-2">
            <h2 id="prediction-result-title" className="text-3xl font-bold text-foreground">
              {formatWeeks(result.predicted_weeks)}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {categoryMeta.description} The personalized interval spans {result.week_range}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="rounded-full bg-secondary px-4 py-2 text-foreground">
              Category: <strong>{result.category}</strong>
            </div>
            <div className="rounded-full bg-secondary px-4 py-2 text-foreground">
              Confidence: <strong>{formatPercent(result.confidence)}</strong>
            </div>
            <div className="rounded-full bg-secondary px-4 py-2 text-foreground">
              Uncertainty: <strong>{formatWeeks(result.uncertainty_weeks)}</strong>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={onEditInputs} className="no-print">
            <PencilLine className="h-4 w-4" />
            Edit Inputs
          </Button>
          <PrintExportButton />
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-border/70 bg-white/85 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Submitted patient summary</h3>
                <p className="text-xs leading-5 text-muted-foreground">
                  This summary is included in the print view.
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {patientSummary.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/60 bg-secondary/45 px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Predicted weeks" value={formatWeeks(result.predicted_weeks)} />
            <MetricCard label="Range low" value={formatWeeks(result.week_range_low)} />
            <MetricCard label="Range high" value={formatWeeks(result.week_range_high)} />
          </div>

          <ProbabilityChart probabilities={result.probabilities} />
        </div>

        <div className="space-y-5">
          <TopFeaturesList features={result.top_features} />
          <DriverSignalsList signals={result.driver_signals} />
          <RehabTips tips={result.rehab_tips} />
        </div>
      </div>
    </motion.section>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-secondary/45 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
