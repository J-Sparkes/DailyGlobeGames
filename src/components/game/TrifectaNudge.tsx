"use client";

import Link from "next/link";
import {
  DAILY_MODE_COUNT,
  type TrifectaMode,
  type TrifectaStatus,
} from "@/lib/trifecta";
import { getRemainingModeLabels } from "@/lib/trifecta";

const MODE_LINKS: Record<TrifectaMode, string> = {
  sweep: "/",
  blitz: "/blitz",
  quiz: "/trivia",
  tap: "/tap",
  hunt: "/hunt",
};

const MODE_LABELS: Record<TrifectaMode, string> = {
  sweep: "Sweep",
  blitz: "Blitz",
  quiz: "Quiz",
  tap: "Tap",
  hunt: "Hunt",
};

export function TrifectaNudge({
  status,
  compact = false,
}: {
  status: TrifectaStatus;
  compact?: boolean;
}) {
  if (compact) {
    if (status.complete) {
      return (
        <p className="text-[10px] font-medium text-[var(--ui-success)]">
          All {DAILY_MODE_COUNT} modes complete today
        </p>
      );
    }

    const remaining = getRemainingModeLabels(status);
    if (remaining.length === 0) return null;

    return (
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-[var(--ui-text-muted)]">
          Daily trip {status.completed}/{DAILY_MODE_COUNT}
        </p>
        <TrifectaDots status={status} />
      </div>
    );
  }
  if (status.complete) {
    return (
      <div className="mt-3 rounded-lg border border-[color-mix(in_srgb,var(--ui-success)_35%,transparent)] bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] px-3 py-2">
        <p className="text-xs font-semibold text-[var(--ui-success)]">
          All {DAILY_MODE_COUNT} modes complete today.
        </p>
      </div>
    );
  }

  const remaining = getRemainingModeLabels(status);
  if (remaining.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-[var(--ui-border-subtle)] bg-[var(--ui-surface-raised)] px-3 py-2">
      <p className="text-xs text-[var(--ui-text-muted)]">
        Daily trip: {status.completed}/{DAILY_MODE_COUNT} complete
      </p>
      <p className="mt-1 text-sm text-[var(--ui-text-primary)]">
        Still open today —{" "}
        {remaining.map((label, index) => {
          const mode = label.toLowerCase() as TrifectaMode;
          return (
            <span key={label}>
              {index > 0 && (index === remaining.length - 1 ? " and " : ", ")}
              <Link
                href={MODE_LINKS[mode]}
                className="font-semibold text-[var(--ui-accent-primary)] underline-offset-2 hover:underline"
              >
                {label}
              </Link>
            </span>
          );
        })}
      </p>
    </div>
  );
}

export function TrifectaDots({ status }: { status: TrifectaStatus }) {
  const modes: Array<{ key: TrifectaMode; label: string }> = [
    { key: "sweep", label: MODE_LABELS.sweep },
    { key: "blitz", label: MODE_LABELS.blitz },
    { key: "quiz", label: MODE_LABELS.quiz },
    { key: "tap", label: MODE_LABELS.tap },
    { key: "hunt", label: MODE_LABELS.hunt },
  ];

  return (
    <div
      className="flex items-center justify-center gap-1 pt-1"
      aria-label={`${status.completed} of ${DAILY_MODE_COUNT} modes complete today`}
    >
      {modes.map(({ key, label }) => (
        <span
          key={key}
          title={label}
          className={`h-1.5 w-1.5 rounded-full ${
            status[key]
              ? "bg-[var(--ui-success)]"
              : "bg-[var(--ui-border-subtle)]"
          }`}
        />
      ))}
    </div>
  );
}
