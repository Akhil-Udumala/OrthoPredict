import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { formatPercent } from "@/lib/formatters";
import type { ProbabilityMap } from "@/types/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface ProbabilityChartProps {
  probabilities: ProbabilityMap;
}

export function ProbabilityChart({ probabilities }: ProbabilityChartProps) {
  const labels = ["Short", "Medium", "Long"];
  const values = [
    probabilities.short * 100,
    probabilities.medium * 100,
    probabilities.long * 100,
  ];

  return (
    <div className="rounded-[1.75rem] border border-border/70 bg-secondary/45 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Probability breakdown</h3>
        <p className="text-xs leading-5 text-muted-foreground">
          Higher bars indicate the model is more confident in that healing category.
        </p>
      </div>
      <div className="h-64">
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: "Probability",
                data: values,
                backgroundColor: ["rgba(16, 185, 129, 0.7)", "rgba(14, 165, 233, 0.7)", "rgba(245, 158, 11, 0.72)"],
                borderColor: ["rgb(16, 185, 129)", "rgb(14, 165, 233)", "rgb(245, 158, 11)"],
                borderWidth: 1.5,
                borderRadius: 10,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label(context) {
                    return `${context.label}: ${formatPercent((context.raw as number) / 100)}`;
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  callback(value) {
                    return `${value}%`;
                  },
                },
              },
            },
          }}
        />
      </div>
      <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
        <span>Short: {formatPercent(probabilities.short)}</span>
        <span>Medium: {formatPercent(probabilities.medium)}</span>
        <span>Long: {formatPercent(probabilities.long)}</span>
      </div>
    </div>
  );
}

