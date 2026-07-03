"use client";

import { canUseStreakFreezeThisMonth, useStreakFreeze } from "@/lib/retention-storage";
import { trackEvent } from "@/lib/analytics";
import { notifyRetentionUpdate } from "@/lib/retention-events";
import { useAuth } from "@/contexts/AuthContext";

export function StreakFreezeButton({ onUsed }: { onUsed?: () => void }) {
  const { user, configured } = useAuth();

  if (!canUseStreakFreezeThisMonth()) return null;

  return (
    <button
      type="button"
      onClick={() => {
        void (async () => {
          if (configured && user) {
            const res = await fetch("/api/retention/streak-freeze", {
              method: "POST",
            });
            if (!res.ok) return;
            useStreakFreeze();
          } else if (!useStreakFreeze()) {
            return;
          }

          trackEvent("streak_freeze_used");
          notifyRetentionUpdate();
          onUsed?.();
        })();
      }}
      className="mt-2 text-xs text-sky-400 underline-offset-2 hover:underline"
    >
      Use streak freeze (1× this month)
    </button>
  );
}
