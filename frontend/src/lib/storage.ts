import { DISCLAIMER_STORAGE_KEY } from "@/lib/constants";

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

