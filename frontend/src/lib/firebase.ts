import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "your_firebase_api_key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "your-project-id.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "your-project-id",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "your-project-id.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "your_messaging_sender_id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:your_messaging_sender_id:web:023d45d325fd19a4a2ee32",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "your_measurement_id",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const googleAuthProvider = new GoogleAuthProvider();
