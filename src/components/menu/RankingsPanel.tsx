"use client";

import { useEffect, useState } from "react";
import {
  getFriendsLeaderboard,
  getGlobalLeaderboard,
  getLeaderboardScoreLabel,
  isCloudSyncEnabled,
} from "@/lib/leaderboard";
import type { LeaderboardEntry, LeaderboardMode } from "@/types/profile";

const MODE_TABS: { id: LeaderboardMode; label: string }[] = [
  { id: "sweep", label: "Sweep" },
  { id: "tap", label: "Tap" },
  { id: "hunt", label: "Hunt" },
];

function LeaderboardTable({
  entries,
  scoreLabel,
}: {
  entries: LeaderboardEntry[];
  scoreLabel: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Play some games and add friends to see rankings here.
      </p>
    );
  }

  return (
    <ol className="space-y-1.5">
      {entries.map((entry) => (
        <li
          key={`${entry.rank}-${entry.username}`}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
            entry.isYou
              ? "border border-sky-500/30 bg-sky-500/10"
              : "border border-white/[0.06] bg-black/30"
          }`}
        >
          <span className="w-6 shrink-0 text-center text-sm font-semibold tabular-nums text-slate-400">
            {entry.rank}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">
              {entry.displayName}
              {entry.isYou && (
                <span className="ml-1.5 text-xs text-sky-400">(you)</span>
              )}
            </p>
            <p className="text-xs text-slate-500">@{entry.username}</p>
          </div>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-white">
            {entry.score}
            <span className="ml-1 text-xs font-normal text-slate-500">
              {scoreLabel}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function RankingsPanel() {
  const [scope, setScope] = useState<"global" | "friends">("global");
  const [mode, setMode] = useState<LeaderboardMode>("sweep");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load = scope === "global" ? getGlobalLeaderboard : getFriendsLeaderboard;
    void load(mode).then((data) => {
      if (!cancelled) {
        setEntries(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [scope, mode]);

  const scoreLabel = getLeaderboardScoreLabel(mode);
  const modeDescription =
    mode === "sweep"
      ? "best daily streak"
      : mode === "tap"
        ? "best daily score"
        : "best daily hunt score";

  return (
    <div className="space-y-4">
      {!isCloudSyncEnabled() && (
        <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200/90">
          Sign in to appear on live worldwide rankings. Local best scores show
          when cloud sync is unavailable.
        </p>
      )}

      <div className="flex rounded-lg border border-white/10 bg-black/40 p-1">
        {MODE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMode(tab.id)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              mode === tab.id
                ? "bg-sky-500 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex rounded-lg border border-white/10 bg-black/40 p-1">
        <button
          type="button"
          onClick={() => setScope("global")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
            scope === "global"
              ? "bg-white/10 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Global
        </button>
        <button
          type="button"
          onClick={() => setScope("friends")}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
            scope === "friends"
              ? "bg-white/10 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Friends
        </button>
      </div>

      <p className="text-xs text-slate-500">Ranked by {modeDescription}</p>

      {loading ? (
        <p className="text-sm text-slate-500">Loading rankings…</p>
      ) : (
        <LeaderboardTable entries={entries} scoreLabel={scoreLabel} />
      )}
    </div>
  );
}
