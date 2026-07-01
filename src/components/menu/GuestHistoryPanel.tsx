"use client";

import { getCountryDisplayName } from "@/lib/country-resolve";
import { getAllGameHistory, getBestScoreForMode } from "@/lib/game-history";
import type { GameHistoryEntry } from "@/types/profile";

function HistoryList({ games }: { games: GameHistoryEntry[] }) {
  if (games.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No completed games yet. Finish a daily game to see it here.
      </p>
    );
  }

  return (
    <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
      {games.map((game) => {
        const mode = game.mode ?? "sweep";
        const key = `${game.date}-${mode}`;

        return (
          <li
            key={key}
            className="rounded-lg border border-white/[0.06] bg-black/30 px-3 py-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-200">
                {game.date}
              </span>
              <span className="text-xs uppercase tracking-wide text-slate-500">
                {mode}
              </span>
            </div>
            {mode === "tap" ? (
              <p className="mt-1 text-sm tabular-nums text-sky-300">
                {game.totalScore ?? 0} pts
              </p>
            ) : mode === "hunt" ? (
              <p className="mt-1 text-sm tabular-nums text-sky-300">
                {game.won
                  ? `${game.huntScore ?? 0} pts · guess ${game.solvedOnGuess}`
                  : "Missed"}
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm tabular-nums text-sky-300">
                  {game.streak ?? 0}{" "}
                  {(game.streak ?? 0) === 1 ? "country" : "countries"}
                </p>
                {(game.path?.length ?? 0) > 0 && (
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {game.path!.map(getCountryDisplayName).join(" → ")}
                  </p>
                )}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function GuestHistoryPanel() {
  const history = getAllGameHistory();
  const bestSweep = getBestScoreForMode("sweep");
  const bestTap = getBestScoreForMode("tap");
  const bestHunt = getBestScoreForMode("hunt");

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-400">
        Playing as guest — scores are saved on this device. Create a profile to
        personalize your name on leaderboards.
      </p>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            Sweep
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-white">
            {bestSweep}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            Tap
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-white">
            {bestTap}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            Hunt
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-white">
            {bestHunt}
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-200">
          Daily game history
        </h3>
        <HistoryList games={history} />
      </div>
    </div>
  );
}
