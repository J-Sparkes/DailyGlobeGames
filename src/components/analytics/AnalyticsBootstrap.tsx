"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { trackSignupAfterFirstWin, hasRecordedFirstWin } from "@/lib/cohort-analytics";
import {
  captureReferralCode,
  getStoredReferralCode,
  hasCompletedReferral,
  markReferralComplete,
} from "@/lib/referral";
import { completeReferralApi } from "@/lib/api/client";
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
    if (!code || !hasRecordedFirstWin()) return;

    void completeReferralApi(code)
      .then((ok) => {
        if (ok) {
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
