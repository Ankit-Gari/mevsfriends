import { Platform } from "react-native";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Web-only, no-op everywhere else (native, gtag not yet loaded, SSR) — safe
// to call from any shared component without checking the platform first.
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (Platform.OS !== "web") return;
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}
