import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "firebase-vendor": ["firebase/app", "firebase/auth", "firebase/firestore"],
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod", "axios"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-label",
            "@radix-ui/react-select",
            "@radix-ui/react-slider",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "lucide-react",
            "framer-motion",
          ],
          "chart-vendor": ["chart.js", "react-chartjs-2"],
        },
      },
    },
  },
});
