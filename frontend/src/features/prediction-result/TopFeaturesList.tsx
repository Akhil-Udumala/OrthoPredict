import { getFeatureLabel, formatPercent } from "@/lib/formatters";
import type { TopFeature } from "@/types/api";

interface TopFeaturesListProps {
  features: TopFeature[];
}

export function TopFeaturesList({ features }: TopFeaturesListProps) {
  return (
    <div className="rounded-[1.75rem] border border-border/70 bg-card/85 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Key factors</h3>
        <p className="text-xs leading-5 text-muted-foreground">
          These were the strongest signals in the current prediction.
        </p>
      </div>
      <div className="space-y-3">
        {features.map((feature) => (
          <div
            key={feature.feature}
            className="rounded-2xl border border-border/60 bg-secondary/45 p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-foreground">{getFeatureLabel(feature.feature)}</span>
              <span className="text-sm text-primary">{formatPercent(feature.importance)}</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-background">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${Math.max(feature.importance * 100, 8)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
