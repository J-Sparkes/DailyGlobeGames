"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { trackSignupAfterFirstWin } from "@/lib/cohort-analytics";
import {
  captureReferralCode,
  getStoredReferralCode,
  hasCompletedReferral,
  markReferralComplete,
} from "@/lib/referral";
import { useAuth } from "@/contexts/AuthContext";

export function AnalyticsBootstrap() {
  const params = useSearchParams();
  const { user } = useAuth();

  useEffect(() => {
    const ref = params.get("ref");
    if (ref) {
      captureReferralCode(ref);
      trackEvent("referral_landing", { ref });
    }
  }, [params]);

  useEffect(() => {
    if (!user) return;
    trackSignupAfterFirstWin();

    if (hasCompletedReferral()) return;
    const code = getStoredReferralCode();
    if (!code) return;
    const hadFirstWin =
      typeof window !== "undefined" &&
      window.localStorage.getItem("geography-game-first-win-v1");
    if (!hadFirstWin) return;

    void fetch("/api/referral/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referrerUsername: code }),
    })
      .then((res) => {
        if (res.ok) {
          markReferralComplete();
          trackEvent("referral_complete", { ref: code });
        }
      })
      .catch(() => {
        // Non-blocking
      });
  }, [user]);

  return null;
}
