const REFERRAL_KEY = "geography-game-referral-v1";
const REFERRAL_COMPLETE_KEY = "geography-game-referral-complete-v1";

export function captureReferralCode(username: string): void {
  if (typeof window === "undefined") return;
  const code = username.trim().toLowerCase();
  if (!code || code.length < 2) return;
  if (window.localStorage.getItem(REFERRAL_COMPLETE_KEY)) return;
  window.localStorage.setItem(REFERRAL_KEY, code);
}

export function getStoredReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFERRAL_KEY);
}

export function markReferralComplete(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REFERRAL_COMPLETE_KEY, "1");
  window.localStorage.removeItem(REFERRAL_KEY);
}

export function hasCompletedReferral(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(REFERRAL_COMPLETE_KEY) === "1";
}
