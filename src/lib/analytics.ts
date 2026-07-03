export type AnalyticsEvent =
  | "daily_complete"
  | "share_clicked"
  | "friend_added"
  | "trifecta_complete"
  | "email_reminder_opt_in"
  | "streak_freeze_used"
  | "return_within_24h"
  | "signup_after_first_win"
  | "referral_landing"
  | "referral_complete"
  | "premium_view"
  | "premium_convert";

export interface AnalyticsPayload {
  mode?: "sweep" | "tap" | "hunt";
  score?: number;
  streak_length?: number;
  channel?: string;
  trifecta?: boolean;
  [key: string]: string | number | boolean | undefined;
}

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

export function trackEvent(event: AnalyticsEvent, payload: AnalyticsPayload = {}): void {
  if (typeof window === "undefined") return;

  const props: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) props[key] = typeof value === "boolean" ? (value ? 1 : 0) : value;
  }

  if (typeof window.plausible === "function") {
    window.plausible(event, { props });
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, payload: props }),
    keepalive: true,
  }).catch(() => {
    // Analytics should never block gameplay
  });
}
