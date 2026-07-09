"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { fetchCompare, type CompareData } from "@/lib/api/client";
import { getModeDeepLink } from "@/lib/share-deep-link";
import type { LeaderboardMode } from "@/types/profile";

function CompareContent() {
  const params = useSearchParams();
  const user = (params.get("user") ?? "").trim();
  const mode = (params.get("mode") ?? "sweep") as LeaderboardMode;
  const date = params.get("date") ?? "";
  const [data, setData] = useState<CompareData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !date) {
      setError("Missing compare parameters");
      return;
    }

    void fetchCompare(user, mode, date)
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, [user, mode, date]);

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (!data) {
    return <p className="text-slate-400">Loading comparison…</p>;
  }

  const modeLinks: Record<LeaderboardMode, string> = {
    sweep: getModeDeepLink("sweep", data.date),
    tap: getModeDeepLink("tap", data.date),
    hunt: getModeDeepLink("hunt", data.date),
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-500">
          {data.date} · {data.mode}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          {data.target.displayName}
        </h1>
      </div>

      {!data.target.played ? (
        <p className="text-slate-400">They haven&apos;t played this mode yet today.</p>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm text-slate-400">Their score</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-sky-300">
            {data.target.score}
          </p>
        </div>
      )}

      {!data.viewer.played ? (
        <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
          <p className="text-sm text-sky-100">
            Play today&apos;s {data.mode} puzzle to see how you compare.
          </p>
          <Link
            href={modeLinks[data.mode]}
            className="mt-3 inline-block rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Play {data.mode}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center">
            <p className="text-xs text-slate-500">You</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
              {data.viewer.score}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center">
            <p className="text-xs text-slate-500">{data.target.displayName}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
              {data.target.score ?? "—"}
            </p>
          </div>
        </div>
      )}

      {data.viewer.played &&
        data.target.played &&
        data.viewer.score !== null &&
        data.target.score !== null && (
          <p className="text-sm text-slate-300">
            {data.viewer.score > data.target.score
              ? "You win!"
              : data.viewer.score < data.target.score
                ? "They edged you today."
                : "It's a tie!"}
          </p>
        )}
    </div>
  );
}

export function CompareClient() {
  return (
    <Suspense fallback={<p className="text-slate-400">Loading…</p>}>
      <CompareContent />
    </Suspense>
  );
}
