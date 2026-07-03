"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { isArchivePlaySession } from "@/lib/archive-play";
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

    void fetch("/api/subscription/status")
      .then((res) => (res.ok ? res.json() : { premium: false }))
      .then((data: { premium: boolean }) => setAllowed(Boolean(data.premium)))
      .catch(() => setAllowed(false));
  }, [dateSeed, user]);

  if (allowed === null) return null;
  if (allowed) return <>{children}</>;

  return (
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-6">
      <div className="max-w-sm rounded-xl border border-white/10 bg-[#0c1018] p-6 text-center">
        <h2 className="text-lg font-semibold text-white">Premium archive</h2>
        <p className="mt-2 text-sm text-slate-400">
          Past puzzles ({dateSeed}) are part of Premium. Today&apos;s dailies are
          always free.
        </p>
        <Link
          href="/archive"
          className="mt-4 inline-block rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Unlock archive
        </Link>
        <Link
          href="/"
          className="mt-3 block text-xs text-sky-400 hover:underline"
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
