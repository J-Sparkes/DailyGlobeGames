"use client";

import { useEffect, useState } from "react";
import { FriendResultContext } from "@/components/game/FriendResultContext";
import { ShareCompareLink } from "@/components/growth/ShareCompareLink";
import { TapShareResult } from "@/components/game/TapShareResult";
import { TrifectaNudge } from "@/components/game/TrifectaNudge";
import { CalendarStreakStat } from "@/components/retention/CalendarStreakStat";
import type { CompletedTapResult } from "@/lib/tap-daily-play";
import {
  formatCountdown,
  getMsUntilNextPuzzle,
} from "@/lib/daily-play";
import { useRetention } from "@/lib/use-retention";
import { getScoreEmoji, MAX_TAP_SCORE } from "@/lib/tap-scoring";

interface TapDailyResultProps {
  result: CompletedTapResult;
  variant?: "complete" | "already-played";
  onPlayAgain?: () => void;
}

export function TapDailyResult({
  result,
  variant = "complete",
  onPlayAgain,
}: TapDailyResultProps) {
  const { trifecta } = useRetention();
  const [countdown, setCountdown] = useState(() =>
    formatCountdown(getMsUntilNextPuzzle()),
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCountdown(formatCountdown(getMsUntilNextPuzzle()));
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const isAlreadyPlayed = variant === "already-played";

  return (
    <div className="hud-panel">
      <p className="text-[10px] font-medium tracking-[0.15em] text-sky-400/80 uppercase">
        {result.date}
      </p>

      <div className="mt-2 flex items-end gap-2.5">
        <p className="text-4xl font-semibold tabular-nums leading-none text-white">
          {result.totalScore}
        </p>
        <div className="pb-0.5">
          <h2 className="text-sm font-semibold text-white">Score</h2>
          <p className="text-xs text-slate-400">/ {MAX_TAP_SCORE}</p>
        </div>
      </div>

      <CalendarStreakStat animate={variant === "complete"} />

      <p className="mt-2 text-xs tracking-wide text-slate-300">
        {result.rounds
          .map((round) => `${round.basePoints}${getScoreEmoji(round.basePoints)}`)
          .join(" ")}
      </p>

      {isAlreadyPlayed ? (
        <p className="mt-2 text-xs text-slate-400">
          Next puzzle in {countdown}
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-400">
          See you tomorrow for five new locations.
        </p>
      )}

      <TrifectaNudge status={trifecta} />

      <FriendResultContext
        mode="tap"
        yourScore={result.totalScore}
        date={result.date}
      />

      <ShareCompareLink mode="tap" date={result.date} />

      {onPlayAgain && (
        <button
          type="button"
          onClick={onPlayAgain}
          className="touch-target mt-2.5 min-h-10 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
        >
          Play again
        </button>
      )}

      <div className="mt-2.5 space-y-1.5">
        <h3 className="text-xs font-semibold text-slate-200">Rounds</h3>
        {result.rounds.map((round, index) => (
          <div
            key={`${round.locationId}-${index}`}
            className="rounded-md border border-white/[0.06] bg-black/30 px-2.5 py-1.5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-slate-200 line-clamp-1">
                {round.prompt}
              </p>
              <p className="shrink-0 text-xs tabular-nums text-sky-300">
                {round.totalPoints}
              </p>
            </div>
          </div>
        ))}
      </div>

      <TapShareResult result={result} />
    </div>
  );
}
