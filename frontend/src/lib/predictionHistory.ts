import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  patientInputSchema,
  patientIntakeSchema,
  predictionResponseSchema,
} from "@/types/form";
import type { PatientInput, PredictionResponse } from "@/types/api";
import type { PatientIntakeFormValues } from "@/types/form";

export interface PredictionHistoryItem {
  id: string;
  createdAtMs: number;
  doctorId: string;
  doctorName: string;
  patientName: string;
  input: PatientInput;
  intake: PatientIntakeFormValues;
  prediction: PredictionResponse;
}

interface SavePredictionHistoryParams {
  doctorId: string;
  doctorName: string;
  input: PatientInput;
  intake: PatientIntakeFormValues;
  prediction: PredictionResponse;
}

export async function savePredictionHistory({
  doctorId,
  doctorName,
  input,
  intake,
  prediction,
}: SavePredictionHistoryParams) {
  await addDoc(getDoctorHistoryCollection(doctorId), {
    createdAt: serverTimestamp(),
    createdAtMs: Date.now(),
    doctorId,
    doctorName,
    patientName: intake.patient_name,
    input,
    intake,
    prediction,
  });
}

export function watchPredictionHistory(
  doctorId: string,
  onHistory: (history: PredictionHistoryItem[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const historyQuery = query(
    getDoctorHistoryCollection(doctorId),
    orderBy("createdAtMs", "desc"),
    limit(25),
  );

  return onSnapshot(
    historyQuery,
    (snapshot) => {
      onHistory(
        snapshot.docs.flatMap((document) => {
          const data = document.data();
          const input = patientInputSchema.safeParse(data.input);
          const intake = patientIntakeSchema.safeParse(data.intake);
          const prediction = predictionResponseSchema.safeParse(data.prediction);

          if (!input.success || !intake.success || !prediction.success) {
            return [];
          }

          return [
            {
              id: document.id,
              createdAtMs:
                typeof data.createdAtMs === "number" ? data.createdAtMs : Date.now(),
              doctorId: typeof data.doctorId === "string" ? data.doctorId : doctorId,
              doctorName:
                typeof data.doctorName === "string" ? data.doctorName : "Doctor",
              patientName:
                typeof data.patientName === "string"
                  ? data.patientName
                  : intake.data.patient_name,
              input: input.data,
              intake: intake.data,
              prediction: prediction.data,
            },
          ];
        }),
      );
    },
    onError,
  );
}

function getDoctorHistoryCollection(doctorId: string) {
  return collection(db, "doctors", doctorId, "predictions");
}
