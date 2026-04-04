import axios from "axios";
import { apiClient } from "@/lib/api/client";
import { FrontendError } from "@/lib/api/errors";
import { predictionResponseSchema } from "@/types/form";
import type { PatientInput, PredictionResponse } from "@/types/api";

function toFrontendError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const requestUrl = error.config?.baseURL
      ? `${error.config.baseURL}${error.config.url ?? ""}`
      : error.config?.url;
    const responseMessage =
      typeof error.response?.data?.error === "string" ? error.response.data.error : null;

    if (error.response?.status === 404) {
      return new FrontendError(
        "api_404",
        "The frontend reached the API host, but POST /predict was not found.",
        {
          status: 404,
          url: requestUrl,
          details: responseMessage ?? "Expected POST /predict on the backend.",
        },
      );
    }

    if (error.response && error.response.status >= 500) {
      return new FrontendError(
        "server",
        "The backend returned a server error while creating the prediction.",
        {
          status: error.response.status,
          url: requestUrl,
          details: responseMessage ?? "The server responded with a 5xx error.",
        },
      );
    }

    if (error.code === "ERR_NETWORK") {
      return new FrontendError(
        "network",
        "The backend is unavailable. Make sure the API server is running.",
        {
          url: requestUrl,
        },
      );
    }
  }

  if (error instanceof FrontendError) {
    return error;
  }

  return new FrontendError(
    "unknown",
    "Something went wrong while requesting a prediction.",
  );
}

export async function predictHealingTime(payload: PatientInput): Promise<PredictionResponse> {
  try {
    const response = await apiClient.post("/predict", payload);
    const parsed = predictionResponseSchema.safeParse(response.data);

    if (!parsed.success) {
      throw new FrontendError(
        "schema_mismatch",
        "The backend responded, but its JSON shape no longer matches the frontend schema.",
        {
          details: parsed.error.issues
            .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
            .join("; "),
        },
      );
    }

    return parsed.data;
  } catch (error) {
    throw toFrontendError(error);
  }
}
