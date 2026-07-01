"use client";

import { useEffect, useState } from "react";
import { ShareResult } from "@/components/game/ShareResult";
import { getCountryDisplayName } from "@/lib/country-resolve";
import type { CompletedDailyResult } from "@/lib/daily-play";
import {
  formatCountdown,
  getMsUntilNextPuzzle,
} from "@/lib/daily-play";

interface DailyResultProps {
  result: CompletedDailyResult;
  variant?: "game-over" | "already-played";
  onPlayAgain?: () => void;
}

export function DailyResult({
  result,
  variant = "game-over",
  onPlayAgain,
}: DailyResultProps) {
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
  const streakLabel =
    result.streak === 1 ? "1 country" : `${result.streak} countries`;
  const correctAnswer = result.targetCountryId
    ? getCountryDisplayName(result.targetCountryId)
    : null;
  const showAnswerReveal =
    Boolean(correctAnswer) &&
    (variant === "game-over" || result.failedGuess.trim().length > 0);

  return (
    <div className="hud-panel">
      <p className="text-[10px] font-medium tracking-[0.15em] text-sky-400/80 uppercase">
        {result.date}
      </p>

      <div className="mt-2 flex items-end gap-2.5">
        <p className="text-4xl font-semibold tabular-nums leading-none text-white">
          {result.streak}
        </p>
        <div className="pb-0.5">
          <h2 className="text-sm font-semibold text-white">Streak</h2>
          <p className="text-xs text-slate-400">{streakLabel}</p>
        </div>
      </div>

      {isAlreadyPlayed ? (
        <p className="mt-2 text-xs text-slate-400">
          Next puzzle in {countdown}
        </p>
      ) : result.streak === 0 ? (
        <p className="mt-2 text-xs text-slate-400">
          Tough break — try again tomorrow.
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-400">
          Nice run — see you tomorrow.
        </p>
      )}

      {showAnswerReveal && (
        <div className="mt-2 rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-2">
          {result.failedGuess.trim() && (
            <p className="text-xs text-slate-300">
              You guessed{" "}
              <span className="font-medium text-red-200">
                &ldquo;{result.failedGuess.trim()}&rdquo;
              </span>
            </p>
          )}
          <p className={`text-xs text-slate-300 ${result.failedGuess.trim() ? "mt-1" : ""}`}>
            Answer:{" "}
            <span className="font-semibold text-white">{correctAnswer}</span>
          </p>
        </div>
      )}

      {onPlayAgain && (
        <button
          type="button"
          onClick={onPlayAgain}
          className="touch-target mt-2.5 min-h-10 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
        >
          Play again
        </button>
      )}

      {result.path.length > 0 && (
        <p className="mt-2 text-xs text-slate-400 line-clamp-2">
          {result.path.map(getCountryDisplayName).join(" → ")}
        </p>
      )}

      <ShareResult result={result} />
    </div>
  );
}
