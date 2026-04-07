import { describeDriverSignal, getFeatureLabel } from "@/lib/formatters";
import type { DriverSignal } from "@/types/api";

interface DriverSignalsListProps {
  signals: DriverSignal[];
}

export function DriverSignalsList({ signals }: DriverSignalsListProps) {
  return (
    <div className="rounded-[1.75rem] border border-border/70 bg-card/85 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Driver signals</h3>
        <p className="text-xs leading-5 text-muted-foreground">
          Patient-specific signals estimate which inputs are adding or reducing recovery time.
        </p>
      </div>
      <div className="space-y-3">
        {signals.map((signal) => (
          <div
            key={`${signal.feature}-${signal.direction}`}
            className="rounded-2xl border border-border/60 bg-secondary/45 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-foreground">{getFeatureLabel(signal.feature)}</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  signal.direction === "lower"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                }`}
              >
                {describeDriverSignal(signal)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
