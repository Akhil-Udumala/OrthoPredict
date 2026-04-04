import { useEffect, useMemo, useRef, useState } from "react";
import { ActivitySquare, HeartPulse, ShieldPlus } from "lucide-react";
import { motion } from "framer-motion";
import { DisclaimerModal } from "@/features/disclaimer/DisclaimerModal";
import { PredictionForm } from "@/features/prediction-form/PredictionForm";
import { ResultCard } from "@/features/prediction-result/ResultCard";
import { WhatIfSimulator } from "@/features/what-if-simulator/WhatIfSimulator";
import { FrontendError } from "@/lib/api/errors";
import { predictHealingTime } from "@/lib/api/predict";
import { hasSeenDisclaimer, setDisclaimerSeen } from "@/lib/storage";
import type { PatientInput, PredictionResponse } from "@/types/api";

export function App() {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [submittedInput, setSubmittedInput] = useState<PatientInput | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [simulation, setSimulation] = useState<PredictionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisclaimerAccepted(hasSeenDisclaimer());
  }, []);

  useEffect(() => {
    function setFrontendAssetError(url?: string | null) {
      const suffix = url ? ` Missing asset: ${url}` : "";
      setAssetError(
        `A frontend asset failed to load. Refresh the page or restart the frontend dev server.${suffix}`,
      );
    }

    function onWindowError(event: Event) {
      const target = event.target;

      if (target instanceof HTMLScriptElement) {
        setFrontendAssetError(target.src || null);
      }

      if (target instanceof HTMLLinkElement) {
        setFrontendAssetError(target.href || null);
      }
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const reason =
        typeof event.reason === "string"
          ? event.reason
          : event.reason instanceof Error
            ? event.reason.message
            : "";

      if (
        reason.includes("Failed to fetch dynamically imported module") ||
        reason.includes("ChunkLoadError")
      ) {
        setFrontendAssetError();
      }
    }

    window.addEventListener("error", onWindowError, true);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onWindowError, true);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  async function handlePredictionRequest(payload: PatientInput) {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const result = await predictHealingTime(payload);
      setSubmittedInput(payload);
      setPrediction(result);
      setSimulation(null);
      setSimulationError(null);
    } catch (error) {
      setApiError(getReadableErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSimulationRequest(
    overrides: Pick<PatientInput, "nutrition_score" | "rehab_adherence">,
  ) {
    if (!submittedInput) {
      return;
    }

    setIsSimulating(true);
    setSimulationError(null);

    try {
      const nextPayload: PatientInput = {
        ...submittedInput,
        nutrition_score: overrides.nutrition_score,
        rehab_adherence: overrides.rehab_adherence,
      };

      const result = await predictHealingTime(nextPayload);
      setSimulation(result);
    } catch (error) {
      setSimulationError(getReadableErrorMessage(error));
    } finally {
      setIsSimulating(false);
    }
  }

  const activeResult = useMemo(() => prediction, [prediction]);

  function acceptDisclaimer() {
    setDisclaimerSeen();
    setDisclaimerAccepted(true);
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-mesh-glow text-foreground">
      <DisclaimerModal open={!disclaimerAccepted} onAccept={acceptDisclaimer} />

      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/75 backdrop-blur">
        <div className="container py-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
              OrthoPredict
            </p>
            <h1 className="text-lg font-bold text-foreground">
              Bone fracture healing time prediction
            </h1>
          </div>
        </div>
      </header>

      <main className="container pb-12 pt-8 sm:pb-16 sm:pt-10">
        {assetError ? (
          <section className="mb-6 rounded-[1.5rem] border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm leading-6 text-amber-900">
            {assetError}
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 p-6 text-white shadow-soft sm:p-8"
          >
            <div className="flex h-full flex-col justify-between gap-8">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-200">
                  Healing Outlook Workspace
                </p>
                <h2 className="max-w-xl text-4xl font-bold leading-tight sm:text-[3.25rem]">
                  Structured intake on the left. Recovery estimate below.
                </h2>
                <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                  The interface stays clinical, quiet, and readable: enter the exact contract
                  fields, submit once, then review the healing category, confidence, and key
                  recovery factors without leaving the page.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <InsightTile
                  icon={<HeartPulse className="h-5 w-5" />}
                  title="Evidence-aware"
                  text="Inline validation mirrors the backend ranges before any request is sent."
                />
                <InsightTile
                  icon={<ShieldPlus className="h-5 w-5" />}
                  title="Advisory-first"
                  text="A session disclaimer blocks interaction until it is acknowledged."
                />
                <InsightTile
                  icon={<ActivitySquare className="h-5 w-5" />}
                  title="What-if ready"
                  text="Two post-result sliders explore modifiable care factors."
                />
              </div>
            </div>
          </motion.div>

          <div className="rounded-[2rem] border border-white/70 bg-white/55 p-6 shadow-soft backdrop-blur sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Beginner-friendly workflow
            </p>
            <div className="mt-5 space-y-5">
              <WorkflowStep
                number="01"
                title="Review the advisory notice"
                text="The modal explains that this tool supports decisions but does not replace a clinician."
              />
              <WorkflowStep
                number="02"
                title="Enter the nine required fields"
                text="Every value uses the backend’s exact snake_case contract and allowed ranges."
              />
              <WorkflowStep
                number="03"
                title="Submit and review the result"
                text="The result stays on the same page with confidence, probabilities, top features, and rehab tips."
              />
              <WorkflowStep
                number="04"
                title="Try the what-if simulator"
                text="Only nutrition_score and rehab_adherence change, so the comparison stays easy to understand."
              />
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8">
          <PredictionForm
            onSubmit={handlePredictionRequest}
            isSubmitting={isSubmitting}
            apiError={apiError}
            formRef={formRef}
          />

          {activeResult && submittedInput ? (
            <>
              <ResultCard
                result={activeResult}
                submittedInput={submittedInput}
                onEditInputs={scrollToForm}
              />
              <WhatIfSimulator
                baseInput={submittedInput}
                baseResult={activeResult}
                simulatedResult={simulation}
                isSimulating={isSimulating}
                error={simulationError}
                onSimulate={handleSimulationRequest}
              />
            </>
          ) : (
            <section className="rounded-[2rem] border border-dashed border-primary/25 bg-white/45 p-6 text-sm leading-6 text-muted-foreground">
              Submit the form to see the personalized week estimate, confidence, probability
              chart, top features, driver signals, rehab tips, and print-ready patient summary.
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function getReadableErrorMessage(error: unknown) {
  if (error instanceof FrontendError) {
    switch (error.kind) {
      case "frontend_asset":
        return error.message;
      case "api_404":
        return `${error.message}${error.url ? ` Request target: ${error.url}` : ""}`;
      case "schema_mismatch":
        return `${error.message}${error.details ? ` Details: ${error.details}` : ""}`;
      case "network":
      case "server":
      case "unknown":
      default:
        return error.message;
    }
  }

  return error instanceof Error ? error.message : "Unexpected error.";
}

interface InsightTileProps {
  icon: React.ReactNode;
  title: string;
  text: string;
}

function InsightTile({ icon, title, text }: InsightTileProps) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-teal-200">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}

interface WorkflowStepProps {
  number: string;
  title: string;
  text: string;
}

function WorkflowStep({ number, title, text }: WorkflowStepProps) {
  return (
    <div className="flex gap-4">
      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
        {number}
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
