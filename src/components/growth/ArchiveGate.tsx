"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { isArchivePlaySession } from "@/lib/archive-play";
import { fetchSubscriptionStatus } from "@/lib/api/client";
import { useDailyDate } from "@/lib/use-daily-date";
import { useAuth } from "@/contexts/AuthContext";

function ArchiveGateInner({ children }: { children: ReactNode }) {
  const dateSeed = useDailyDate();
  const { user } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isArchivePlaySession(dateSeed)) {
      setAllowed(true);
      return;
    }

    if (!user) {
      setAllowed(false);
      return;
    }

    void fetchSubscriptionStatus()
      .then((data) => setAllowed(Boolean(data.premium)))
      .catch(() => setAllowed(false));
  }, [dateSeed, user]);

  if (allowed === null) return null;
  if (allowed) return <>{children}</>;

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-6">
      <div className="max-w-sm rounded-xl border border-[var(--ui-border-subtle)] bg-[var(--ui-surface-hud)] p-6 text-center">
        <h2 className="text-lg font-semibold text-[var(--ui-text-primary)]">
          Premium archive
        </h2>
        <p className="mt-2 text-sm text-[var(--ui-text-muted)]">
          Past puzzles ({dateSeed}) are part of Premium. Today&apos;s dailies are
          always free.
        </p>
        <Link
          href="/archive"
          className="touch-target btn-primary mt-4 inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold"
        >
          Get archive access
        </Link>
        <Link
          href="/"
          className="mt-3 block text-xs text-[var(--ui-accent-primary)] hover:underline"
        >
          Play today instead
        </Link>
      </div>
    </div>
  );
}

export function ArchiveGate({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ArchiveGateInner>{children}</ArchiveGateInner>
    </Suspense>
  );
}
