import { useEffect, useRef, useState } from "react";
import { ActivitySquare, ArrowLeft, HeartPulse, ShieldPlus } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LandingPage } from "@/app/LandingPage";
import { LoginPage } from "@/app/LoginPage";
import { DisclaimerModal } from "@/features/disclaimer/DisclaimerModal";
import { PredictionForm } from "@/features/prediction-form/PredictionForm";
import { ResultCard } from "@/features/prediction-result/ResultCard";
import { WhatIfSimulator } from "@/features/what-if-simulator/WhatIfSimulator";
import { FrontendError } from "@/lib/api/errors";
import { predictHealingTime } from "@/lib/api/predict";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  clearPredictionSession,
  getPredictionSession,
  hasSeenDisclaimer,
  setDisclaimerSeen,
  setPredictionSession,
} from "@/lib/storage";
import type { PatientInput, PredictionResponse } from "@/types/api";
import type { PatientIntakeFormValues } from "@/types/form";

type AppRoute = "landing" | "login" | "form" | "results";

export function App() {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [route, setRoute] = useState<AppRoute>(() => getRouteFromLocation());
  const [submittedInput, setSubmittedInput] = useState<PatientInput | null>(null);
  const [submittedIntake, setSubmittedIntake] = useState<PatientIntakeFormValues | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [simulation, setSimulation] = useState<PredictionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [assetError, setAssetError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { isAuthReady, logout, user } = useAuth();
  const canUseProtectedRoute = isAuthReady && user !== null;

  useEffect(() => {
    setDisclaimerAccepted(hasSeenDisclaimer());

    const storedSession = getPredictionSession();

    if (storedSession) {
      setSubmittedInput(storedSession.input);
      setSubmittedIntake(storedSession.intake);
      setPrediction(storedSession.prediction);
    }
  }, []);

  useEffect(() => {
    function syncRoute() {
      setRoute(getRouteFromLocation());
    }

    window.addEventListener("popstate", syncRoute);

    return () => {
      window.removeEventListener("popstate", syncRoute);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = route === "landing" ? "dark" : "light";
  }, [route]);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!user && (route === "form" || route === "results")) {
      navigateTo("login");
      return;
    }

    if (user && route === "login") {
      navigateTo("form");
    }
  }, [isAuthReady, route, user]);

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

  async function handlePredictionRequest(
    payload: PatientInput,
    intakeValues: PatientIntakeFormValues,
  ) {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const result = await predictHealingTime(payload);
      setSubmittedInput(payload);
      setSubmittedIntake(intakeValues);
      setPrediction(result);
      setPredictionSession(payload, result, intakeValues);
      setSimulation(null);
      setSimulationError(null);
      navigateTo("results");
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

  function acceptDisclaimer() {
    setDisclaimerSeen();
    setDisclaimerAccepted(true);
  }

  async function handleSignOut() {
    await logout();
    clearPredictionSession();
    setSubmittedInput(null);
    setSubmittedIntake(null);
    setPrediction(null);
    setSimulation(null);
    setSimulationError(null);
    navigateTo("login");
  }

  function navigateTo(nextRoute: AppRoute) {
    const nextPath =
      nextRoute === "results"
        ? "/results"
        : nextRoute === "form"
          ? "/predict"
          : nextRoute === "login"
            ? "/login"
            : "/";

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }

    setRoute(nextRoute);

    if (nextRoute === "form") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <div
      className={cn(
        "min-h-screen text-foreground",
        route === "landing"
          ? "bg-[#061115]"
          : route === "login"
            ? "bg-[#f9f9fb]"
            : "bg-mesh-glow",
      )}
    >
      {route === "landing" ? <LandingPage /> : null}
      {route === "login" ? <LoginPage onAuthenticated={() => navigateTo("form")} /> : null}

      {route !== "landing" && route !== "login" ? (
        !canUseProtectedRoute ? (
          <AuthLoadingState
            message={isAuthReady ? "Redirecting to sign in…" : "Checking secure access…"}
          />
        ) : (
          <>
            <DisclaimerModal open={!disclaimerAccepted} onAccept={acceptDisclaimer} />

            <header className="sticky top-0 z-30 border-b border-border/70 bg-card/75 backdrop-blur">
              <div className="container py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
                      OrthoPredict
                    </p>
                    <h1 className="text-lg font-bold text-foreground">
                      Bone fracture healing time prediction
                    </h1>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="hidden max-w-48 truncate text-sm text-muted-foreground sm:block">
                      {getDoctorDisplayName(user.displayName)}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleSignOut()}
                    >
                      Sign out
                    </Button>
                  </div>
                </div>
              </div>
            </header>

            <main className="container pb-12 pt-8 sm:pb-16 sm:pt-10">
              {assetError ? (
                <section className="mb-6 rounded-[1.5rem] border border-amber-500/25 bg-amber-500/10 px-5 py-4 text-sm leading-6 text-amber-800 dark:text-amber-200">
                  {assetError}
                </section>
              ) : null}

              {route === "form" ? (
                <FormPage
                  apiError={apiError}
                  formRef={formRef}
                  initialValues={submittedIntake}
                  isSubmitting={isSubmitting}
                  onSubmit={handlePredictionRequest}
                />
              ) : (
                <ResultsPage
                  prediction={prediction}
                  simulation={simulation}
                  simulationError={simulationError}
                  submittedIntake={submittedIntake}
                  submittedInput={submittedInput}
                  isSimulating={isSimulating}
                  onBackToForm={() => navigateTo("form")}
                  onSimulate={handleSimulationRequest}
                />
              )}
            </main>
          </>
        )
      ) : null}
    </div>
  );
}

function getDoctorDisplayName(displayName: string | null) {
  const name = displayName?.trim();

  return name ? `Dr. ${name.replace(/^dr\.?\s+/i, "")}` : "Doctor";
}

function AuthLoadingState({ message }: { message: string }) {
  return (
    <main className="container flex min-h-screen items-center justify-center">
      <div className="rounded-[2rem] border border-border/70 bg-card/80 px-6 py-5 text-sm text-muted-foreground shadow-soft backdrop-blur">
        {message}
      </div>
    </main>
  );
}

function getRouteFromLocation(): AppRoute {
  if (typeof window === "undefined") {
    return "landing";
  }

  if (window.location.pathname.endsWith("/results")) {
    return "results";
  }

  if (window.location.pathname.endsWith("/predict")) {
    return "form";
  }

  if (window.location.pathname.endsWith("/login")) {
    return "login";
  }

  return "landing";
}

interface FormPageProps {
  apiError: string | null;
  formRef: React.RefObject<HTMLDivElement>;
  initialValues: PatientIntakeFormValues | null;
  isSubmitting: boolean;
  onSubmit: (payload: PatientInput, intakeValues: PatientIntakeFormValues) => Promise<void>;
}

function FormPage({
  apiError,
  formRef,
  initialValues,
  isSubmitting,
  onSubmit,
}: FormPageProps) {
  return (
    <>
      <section className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="overflow-hidden rounded-[2rem] border border-border/70 bg-slate-950 p-6 text-white shadow-soft sm:p-8 dark:bg-card"
        >
          <div className="flex h-full flex-col justify-between gap-8">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-200">
                Healing Outlook Intake
              </p>
              <h2 className="max-w-xl text-4xl font-bold leading-tight sm:text-[3.25rem]">
                Start with a focused patient profile.
              </h2>
              <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Enter measurements and care habits, submit once, then continue to a dedicated
                results page for the healing estimate and simulator.
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
                title="Results page"
                text="Predictions and the what-if simulator open after submission."
              />
            </div>
          </div>
        </motion.div>

        <div className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-soft backdrop-blur sm:p-8">
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
              title="Enter measurements and habits"
              text="Height, weight, meals, hydration, and rehab activity are used to calculate the model fields."
            />
            <WorkflowStep
              number="03"
              title="Open the prediction page"
              text="The submit button routes to the result view after the backend returns an estimate."
            />
            <WorkflowStep
              number="04"
              title="Try the what-if simulator"
              text="Change nutrition and rehab habits while every other patient field stays fixed."
            />
          </div>
        </div>
      </section>

      <div className="mt-8">
        <PredictionForm
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          apiError={apiError}
          formRef={formRef}
          initialValues={initialValues}
        />
      </div>
    </>
  );
}

interface ResultsPageProps {
  prediction: PredictionResponse | null;
  simulation: PredictionResponse | null;
  simulationError: string | null;
  submittedIntake: PatientIntakeFormValues | null;
  submittedInput: PatientInput | null;
  isSimulating: boolean;
  onBackToForm: () => void;
  onSimulate: (
    overrides: Pick<PatientInput, "nutrition_score" | "rehab_adherence">,
  ) => Promise<void>;
}

function ResultsPage({
  prediction,
  simulation,
  simulationError,
  submittedIntake,
  submittedInput,
  isSimulating,
  onBackToForm,
  onSimulate,
}: ResultsPageProps) {
  if (!prediction || !submittedInput) {
    return (
      <section className="rounded-[2rem] border border-dashed border-primary/25 bg-card/70 p-6 text-sm leading-6 text-muted-foreground shadow-soft backdrop-blur">
        <h2 className="text-2xl font-bold text-foreground">No prediction yet</h2>
        <p className="mt-2 max-w-2xl">
          Submit the patient profile first to open the personalized week estimate,
          confidence, probability chart, driver signals, rehab tips, and what-if simulator.
        </p>
        <Button type="button" className="mt-5" onClick={onBackToForm}>
          <ArrowLeft className="h-4 w-4" />
          Back to input form
        </Button>
      </section>
    );
  }

  return (
    <div className="grid gap-8">
      <div className="no-print">
        <Button type="button" variant="outline" onClick={onBackToForm}>
          <ArrowLeft className="h-4 w-4" />
          Back to input form
        </Button>
      </div>

      <ResultCard
        result={prediction}
        submittedInput={submittedInput}
        onEditInputs={onBackToForm}
      />
      <WhatIfSimulator
        baseInput={submittedInput}
        baseIntake={submittedIntake}
        baseResult={prediction}
        simulatedResult={simulation}
        isSimulating={isSimulating}
        error={simulationError}
        onSimulate={onSimulate}
      />
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
