"use client";

import { BLITZ_START_SECONDS } from "@/lib/blitz-timer";

interface BlitzTimerProps {
  seconds: number;
  pulse?: boolean;
  running?: boolean;
}

export function BlitzTimer({ seconds, pulse = false, running = true }: BlitzTimerProps) {
  const urgent = seconds <= 5;
  const fillPct = Math.min(
    100,
    Math.max(0, (seconds / BLITZ_START_SECONDS) * 100),
  );

  return (
    <div
      className="flex min-w-[5.5rem] flex-col items-end gap-1"
      aria-live="polite"
      aria-label={
        running
          ? `${seconds} seconds remaining`
          : `${seconds} seconds — starts after your first correct guess`
      }
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--ui-text-muted)]">
        Time
      </p>
      <div className="flex items-center gap-2">
        <div
          className="h-1.5 w-14 overflow-hidden rounded-full bg-white/10"
          aria-hidden
        >
          <div
            className={`h-full rounded-full transition-[width,background-color] duration-300 ease-out ${
              urgent
                ? "bg-red-500"
                : "bg-[var(--ui-accent-primary)]"
            }`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
        <p
          className={`font-stat min-w-[2.25rem] text-right text-lg font-semibold leading-none tabular-nums ${
            urgent && running
              ? "text-red-400 animate-pulse"
              : running
                ? "text-[var(--ui-accent-warm)]"
                : "text-[var(--ui-text-muted)]"
          } ${pulse ? "streak-pop" : ""}`}
        >
          {seconds}s
        </p>
      </div>
    </div>
  );
}
