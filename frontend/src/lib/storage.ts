import { DISCLAIMER_STORAGE_KEY, PREDICTION_SESSION_STORAGE_KEY } from "@/lib/constants";
import { patientInputSchema, patientIntakeSchema, predictionResponseSchema } from "@/types/form";
import type { PatientInput, PredictionResponse } from "@/types/api";
import type { PatientIntakeFormValues } from "@/types/form";

interface PredictionSession {
  input: PatientInput;
  intake: PatientIntakeFormValues | null;
  prediction: PredictionResponse;
}

export function hasSeenDisclaimer() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(DISCLAIMER_STORAGE_KEY) === "true";
}

export function setDisclaimerSeen() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(DISCLAIMER_STORAGE_KEY, "true");
}

export function getPredictionSession(): PredictionSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedSession = window.sessionStorage.getItem(PREDICTION_SESSION_STORAGE_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(storedSession) as unknown;

    if (
      typeof parsedSession !== "object" ||
      parsedSession === null ||
      !("input" in parsedSession) ||
      !("prediction" in parsedSession)
    ) {
      return null;
    }

    const input = patientInputSchema.safeParse(parsedSession.input);
    const intake =
      "intake" in parsedSession ? patientIntakeSchema.safeParse(parsedSession.intake) : null;
    const prediction = predictionResponseSchema.safeParse(parsedSession.prediction);

    if (!input.success || !prediction.success || (intake !== null && !intake.success)) {
      return null;
    }

    return {
      input: input.data,
      intake: intake?.data ?? null,
      prediction: prediction.data,
    };
  } catch {
    return null;
  }
}

export function setPredictionSession(
  input: PatientInput,
  prediction: PredictionResponse,
  intake: PatientIntakeFormValues,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    PREDICTION_SESSION_STORAGE_KEY,
    JSON.stringify({ input, intake, prediction }),
  );
}

export function clearPredictionSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(PREDICTION_SESSION_STORAGE_KEY);
}
