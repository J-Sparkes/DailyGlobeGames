"use client";

import { useStreakFreezeApi } from "@/lib/api/client";
import { trackEvent } from "@/lib/analytics";
import { notifyRetentionUpdate } from "@/lib/retention-events";
import {
  canUseStreakFreezeThisMonth,
  useStreakFreeze,
} from "@/lib/retention-storage";
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
            const ok = await useStreakFreezeApi();
            if (!ok) return;
            useStreakFreeze();
          } else if (!useStreakFreeze()) {
            return;
          }

          trackEvent("streak_freeze_used");
          notifyRetentionUpdate();
          onUsed?.();
        })();
      }}
      className="mt-2 text-xs text-[var(--ui-accent-primary)] underline-offset-2 hover:underline"
    >
      Use streak freeze (1× this month)
    </button>
  );
}
