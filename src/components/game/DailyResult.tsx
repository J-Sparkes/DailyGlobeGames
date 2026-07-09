"use client";

import { useEffect, useState } from "react";
import { FriendResultContext } from "@/components/game/FriendResultContext";
import { ResultReveal } from "@/components/game/ResultReveal";
import { ShareCompareLink } from "@/components/growth/ShareCompareLink";
import { ShareResult } from "@/components/game/ShareResult";
import { TrifectaNudge } from "@/components/game/TrifectaNudge";
import { CalendarStreakStat } from "@/components/retention/CalendarStreakStat";
import { getCountryDisplayName } from "@/lib/country-resolve";
import type { CompletedDailyResult } from "@/lib/daily-play";
import {
  formatCountdown,
  getMsUntilNextPuzzle,
} from "@/lib/daily-play";
import { useRetention } from "@/lib/use-retention";
import { useCountUp } from "@/lib/use-count-up";

interface DailyResultProps {
  result: CompletedDailyResult;
  variant?: "game-over" | "already-played";
  onPlayAgain?: () => void;
  animateReveal?: boolean;
  layout?: "default" | "overlay";
}

export function DailyResult({
  result,
  variant = "game-over",
  onPlayAgain,
  animateReveal = false,
  layout = "default",
}: DailyResultProps) {
  const { trifecta } = useRetention();
  const [countdown, setCountdown] = useState(() =>
    formatCountdown(getMsUntilNextPuzzle()),
  );
  const isOverlay = layout === "overlay";
  const shouldAnimate = animateReveal && variant === "game-over";
  const displayStreak = useCountUp(result.streak, {
    enabled: shouldAnimate,
  });

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

  const statusMessage = isAlreadyPlayed
    ? `Next puzzle in ${countdown}`
    : result.streak === 0
      ? "Tough break — try again tomorrow."
      : "Nice run — see you tomorrow.";

  const shellClass = isOverlay
    ? "result-overlay-content"
    : "hud-panel";

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
                className={`font-stat font-semibold leading-none text-[var(--ui-text-primary)] ${
                  isOverlay ? "text-3xl" : "text-4xl"
                }`}
              >
                {displayStreak}
              </p>
              <div className="pb-0.5">
                <h2 className="text-sm font-semibold text-[var(--ui-text-primary)]">
                  Streak
                </h2>
                <p className="text-xs text-[var(--ui-text-muted)]">{streakLabel}</p>
              </div>
            </div>
            {isOverlay && <CalendarStreakStat animate={shouldAnimate} compact />}
          </div>
        </div>

        <div>
          {!isOverlay && <CalendarStreakStat animate={shouldAnimate} />}
          <p className={`text-xs text-[var(--ui-text-muted)] ${isOverlay ? "" : "mt-2"}`}>
            {statusMessage}
          </p>
        </div>

        {showAnswerReveal && (
          <div className="rounded-lg border border-[color-mix(in_srgb,var(--ui-error)_30%,transparent)] bg-[color-mix(in_srgb,var(--ui-error)_8%,transparent)] px-2.5 py-1.5">
            {result.failedGuess.trim() && (
              <p className="text-xs text-[var(--ui-text-primary)] line-clamp-1">
                You guessed{" "}
                <span className="font-medium text-[var(--ui-error)]">
                  &ldquo;{result.failedGuess.trim()}&rdquo;
                </span>
              </p>
            )}
            <p
              className={`text-xs text-[var(--ui-text-primary)] ${result.failedGuess.trim() ? "mt-0.5" : ""}`}
            >
              Answer:{" "}
              <span className="font-semibold">{correctAnswer}</span>
            </p>
          </div>
        )}

        {result.path.length > 0 && (
          <p className="text-[10px] text-[var(--ui-text-muted)] line-clamp-1">
            {result.path.map(getCountryDisplayName).join(" → ")}
          </p>
        )}

        <div>
          <TrifectaNudge status={trifecta} compact={isOverlay} />
          <FriendResultContext
            mode="sweep"
            yourScore={result.streak}
            date={result.date}
            compact={isOverlay}
          />
          <ShareCompareLink mode="sweep" date={result.date} />
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

        <ShareResult
          result={result}
          showCardPreview={!isOverlay}
          rewardPop={shouldAnimate}
          compact={isOverlay}
        />
      </ResultReveal>
    </div>
  );
}
