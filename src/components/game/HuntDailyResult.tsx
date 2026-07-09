"use client";

import { useEffect, useState } from "react";
import { FriendResultContext } from "@/components/game/FriendResultContext";
import { ShareCompareLink } from "@/components/growth/ShareCompareLink";
import { HuntShareResult } from "@/components/game/HuntShareResult";
import { TrifectaNudge } from "@/components/game/TrifectaNudge";
import { CalendarStreakStat } from "@/components/retention/CalendarStreakStat";
import { getCountryDisplayName } from "@/lib/country-resolve";
import {
  formatCountdown,
  getMsUntilNextPuzzle,
} from "@/lib/daily-play";
import { getHuntCountryFact } from "@/lib/daily-hunt-facts";
import {
  buildShareGrid,
  formatMiles,
  MAX_HUNT_SCORE,
} from "@/lib/hunt-scoring";
import { useRetention } from "@/lib/use-retention";
import type { CompletedHuntResult } from "@/types/hunt";

interface HuntDailyResultProps {
  result: CompletedHuntResult;
  variant?: "complete" | "already-played";
  onPlayAgain?: () => void;
}

export function HuntDailyResult({
  result,
  variant = "complete",
  onPlayAgain,
}: HuntDailyResultProps) {
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
  const hiddenName = getCountryDisplayName(result.hiddenCountryId);
  const fact = getHuntCountryFact(result.hiddenCountryId, hiddenName);

  return (
    <div className="hud-panel">
      <p className="font-stat text-[10px] font-medium tracking-[0.15em] text-[var(--ui-accent-primary)] uppercase">
        {result.date}
      </p>

      <div className="mt-2 flex items-end gap-2.5">
        <p className="font-stat text-4xl font-semibold tabular-nums leading-none text-[var(--ui-text-primary)]">
          {result.score}
        </p>
        <div className="pb-0.5">
          <h2 className="text-sm font-semibold text-[var(--ui-text-primary)]">
            {result.won ? "Found!" : "Missed"}
          </h2>
          <p className="text-xs text-[var(--ui-text-muted)]">/ {MAX_HUNT_SCORE}</p>
        </div>
      </div>

      <CalendarStreakStat animate={variant === "complete"} />

      <p className="mt-2 text-xs tracking-wide text-[var(--ui-text-muted)]">
        {buildShareGrid(result.won, result.solvedOnGuess)}
      </p>

      <p className="mt-2 text-sm font-medium text-[var(--ui-text-primary)]">{hiddenName}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-[var(--ui-text-muted)] line-clamp-3">
        {fact}
      </p>

      {isAlreadyPlayed ? (
        <p className="mt-2 text-xs text-[var(--ui-text-muted)]">
          Next hunt in {countdown}
        </p>
      ) : result.won ? (
        <p className="mt-2 text-xs text-[var(--ui-text-muted)]">
          {result.solvedOnGuess === 1
            ? "First guess — incredible."
            : `Found on guess ${result.solvedOnGuess}.`}
        </p>
      ) : (
        <p className="mt-2 text-xs text-[var(--ui-text-muted)]">
          Tough one today. Try again tomorrow.
        </p>
      )}

      <TrifectaNudge status={trifecta} />

      <FriendResultContext
        mode="hunt"
        yourScore={result.score}
        date={result.date}
      />

      <ShareCompareLink mode="hunt" date={result.date} />

      {onPlayAgain && (
        <button
          type="button"
          onClick={onPlayAgain}
          className="touch-target btn-primary mt-2.5 min-h-11 rounded-lg px-4 py-2 text-sm font-semibold"
        >
          Play again
        </button>
      )}

      {result.guesses.length > 0 && (
        <div className="mt-2.5 space-y-1.5">
          <h3 className="text-xs font-semibold text-slate-200">Guesses</h3>
          {result.guesses.map((guess, index) => (
            <div
              key={`${guess.countryId}-${index}`}
              className="rounded-md border border-white/[0.06] bg-black/30 px-2.5 py-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-slate-200">
                  {index + 1}. {getCountryDisplayName(guess.countryId)}
                </span>
                <span className="shrink-0 text-xs tabular-nums text-sky-300">
                  {formatMiles(guess.distanceMiles)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <HuntShareResult result={result} />
    </div>
  );
}
