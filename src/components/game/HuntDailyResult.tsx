"use client";

import { useEffect, useState } from "react";
import { FriendResultContext } from "@/components/game/FriendResultContext";
import { ResultReveal } from "@/components/game/ResultReveal";
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
import { useCountUp } from "@/lib/use-count-up";
import type { CompletedHuntResult } from "@/types/hunt";

interface HuntDailyResultProps {
  result: CompletedHuntResult;
  variant?: "complete" | "already-played";
  onPlayAgain?: () => void;
  layout?: "default" | "overlay";
}

export function HuntDailyResult({
  result,
  variant = "complete",
  onPlayAgain,
  layout = "default",
}: HuntDailyResultProps) {
  const { trifecta } = useRetention();
  const [countdown, setCountdown] = useState(() =>
    formatCountdown(getMsUntilNextPuzzle()),
  );
  const isOverlay = layout === "overlay";
  const shouldAnimate = variant === "complete";
  const displayScore = useCountUp(result.score, { enabled: shouldAnimate });
  const showMilestoneBurst =
    shouldAnimate && result.won && (result.solvedOnGuess ?? 99) <= 2;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCountdown(formatCountdown(getMsUntilNextPuzzle()));
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const isAlreadyPlayed = variant === "already-played";
  const hiddenName = getCountryDisplayName(result.hiddenCountryId);
  const fact = getHuntCountryFact(result.hiddenCountryId, hiddenName);
  const shellClass = isOverlay ? "result-overlay-content" : "hud-panel";

  return (
    <div className={shellClass}>
      <ResultReveal enabled={shouldAnimate}>
        <div>
          <p className="font-stat text-[10px] font-medium tracking-[0.15em] text-[var(--ui-accent-primary)] uppercase">
            {result.date}
          </p>

          <div
            className={
              isOverlay
                ? "mt-1.5 flex items-end justify-between gap-3"
                : "mt-2 flex items-end gap-2.5"
            }
          >
            <div className="flex items-end gap-2">
              <p
                className={`font-stat font-semibold tabular-nums leading-none text-[var(--ui-text-primary)] ${
                  showMilestoneBurst ? "milestone-burst" : ""
                } ${isOverlay ? "text-3xl" : "text-4xl"}`}
              >
                {displayScore}
              </p>
              <div className="pb-0.5">
                <h2 className="text-sm font-semibold text-[var(--ui-text-primary)]">
                  {result.won ? "Found!" : "Missed"}
                </h2>
                <p className="text-xs text-[var(--ui-text-muted)]">/ {MAX_HUNT_SCORE}</p>
              </div>
            </div>
            {isOverlay && <CalendarStreakStat animate={shouldAnimate} compact />}
          </div>
        </div>

        <div>
          {!isOverlay && <CalendarStreakStat animate={shouldAnimate} />}

          <p className={`text-xs tracking-wide text-[var(--ui-text-muted)] ${isOverlay ? "" : "mt-2"}`}>
            {buildShareGrid(result.won, result.solvedOnGuess)}
          </p>

          <p className={`text-sm font-medium text-[var(--ui-text-primary)] ${isOverlay ? "mt-0.5" : "mt-2"}`}>
            {hiddenName}
          </p>
          <p
            className={`text-xs leading-snug text-[var(--ui-text-muted)] ${
              isOverlay ? "line-clamp-2" : "line-clamp-3"
            }`}
          >
            {fact}
          </p>

          {isAlreadyPlayed ? (
            <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
              Next hunt in {countdown}
            </p>
          ) : result.won ? (
            <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
              {result.solvedOnGuess === 1
                ? "First guess — incredible."
                : `Found on guess ${result.solvedOnGuess}.`}
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--ui-text-muted)]">
              Tough one today. Try again tomorrow.
            </p>
          )}
        </div>

        {isOverlay && result.guesses.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {result.guesses.map((guess, index) => (
              <span
                key={`${guess.countryId}-${index}`}
                className="rounded-md border border-[var(--ui-border-subtle)] bg-[color-mix(in_srgb,var(--ui-surface-raised)_70%,transparent)] px-1.5 py-0.5 text-[10px] text-[var(--ui-text-muted)]"
              >
                {getCountryDisplayName(guess.countryId)} ·{" "}
                {formatMiles(guess.distanceMiles)}
              </span>
            ))}
          </div>
        )}

        <div>
          <TrifectaNudge status={trifecta} compact={isOverlay} />
          <FriendResultContext
            mode="hunt"
            yourScore={result.score}
            date={result.date}
            compact={isOverlay}
          />
          <ShareCompareLink mode="hunt" date={result.date} />
        </div>

        {onPlayAgain && (
          <button
            type="button"
            onClick={onPlayAgain}
            className="touch-target btn-primary w-full min-h-11 rounded-lg px-4 py-2 text-sm font-semibold"
          >
            Play again
          </button>
        )}

        {!isOverlay && result.guesses.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-[var(--ui-text-primary)]">
              Guesses
            </h3>
            {result.guesses.map((guess, index) => (
              <div
                key={`${guess.countryId}-${index}`}
                className="rounded-md border border-[var(--ui-border-subtle)] bg-[color-mix(in_srgb,var(--ui-surface-raised)_70%,transparent)] px-2.5 py-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-[var(--ui-text-primary)]">
                    {index + 1}. {getCountryDisplayName(guess.countryId)}
                  </span>
                  <span className="font-stat shrink-0 text-xs tabular-nums text-[var(--ui-accent-primary)]">
                    {formatMiles(guess.distanceMiles)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <HuntShareResult
          result={result}
          rewardPop={shouldAnimate}
          compact={isOverlay}
        />
      </ResultReveal>
    </div>
  );
}
