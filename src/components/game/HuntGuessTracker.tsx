"use client";

import { MAX_HUNT_GUESSES } from "@/lib/hunt-scoring";

export function HuntGuessTracker({
  used,
  className = "",
}: {
  used: number;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 ${className}`}
      role="img"
      aria-label={`${used} of ${MAX_HUNT_GUESSES} guesses used`}
    >
      {Array.from({ length: MAX_HUNT_GUESSES }, (_, index) => {
        const filled = index < used;
        return (
          <span
            key={index}
            className={`h-2 min-w-0 flex-1 rounded-full transition-colors duration-200 ${
              filled
                ? "bg-[color-mix(in_srgb,var(--ui-error)_85%,transparent)] shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
                : "bg-[color-mix(in_srgb,var(--ui-text-muted)_22%,transparent)]"
            }`}
          />
        );
      })}
    </div>
  );
}
