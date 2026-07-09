"use client";

import Link from "next/link";
import type { TrifectaStatus } from "@/lib/trifecta";
import { getRemainingModeLabels } from "@/lib/trifecta";

const MODE_LINKS: Record<"sweep" | "tap" | "hunt", string> = {
  sweep: "/",
  tap: "/tap",
  hunt: "/hunt",
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
          Trifecta complete today
        </p>
      );
    }

    const remaining = getRemainingModeLabels(status);
    if (remaining.length === 0) return null;

    return (
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-[var(--ui-text-muted)]">
          Daily trip {status.completed}/3
        </p>
        <TrifectaDots status={status} />
      </div>
    );
  }
  if (status.complete) {
    return (
      <div className="mt-3 rounded-lg border border-[color-mix(in_srgb,var(--ui-success)_35%,transparent)] bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] px-3 py-2">
        <p className="text-xs font-semibold text-[var(--ui-success)]">
          Trifecta complete — all three modes done today.
        </p>
      </div>
    );
  }

  const remaining = getRemainingModeLabels(status);
  if (remaining.length === 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-[var(--ui-border-subtle)] bg-[var(--ui-surface-raised)] px-3 py-2">
      <p className="text-xs text-[var(--ui-text-muted)]">
        Daily trip: {status.completed}/3 complete
      </p>
      <p className="mt-1 text-sm text-[var(--ui-text-primary)]">
        Still open today —{" "}
        {remaining.map((label, index) => {
          const mode = label.toLowerCase() as "sweep" | "tap" | "hunt";
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
  const modes: Array<{ key: keyof Pick<TrifectaStatus, "sweep" | "tap" | "hunt">; label: string }> = [
    { key: "sweep", label: "Sweep" },
    { key: "tap", label: "Tap" },
    { key: "hunt", label: "Hunt" },
  ];

  return (
    <div
      className="flex items-center justify-center gap-1 pt-1"
      aria-label={`${status.completed} of 3 modes complete today`}
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
