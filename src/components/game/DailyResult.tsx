"use client";

import { useEffect, useState } from "react";
import { FriendResultContext } from "@/components/game/FriendResultContext";
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
}

export function DailyResult({
  result,
  variant = "game-over",
  onPlayAgain,
  animateReveal = false,
}: DailyResultProps) {
  const { trifecta } = useRetention();
  const [countdown, setCountdown] = useState(() =>
    formatCountdown(getMsUntilNextPuzzle()),
  );
  const displayStreak = useCountUp(result.streak, {
    enabled: animateReveal && variant === "game-over",
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

  return (
    <div className="hud-panel">
      <p className="font-stat text-[10px] font-medium tracking-[0.15em] text-[var(--ui-accent-primary)] uppercase">
        {result.date}
      </p>

      <div className="mt-2 flex items-end gap-2.5">
        <p className="font-stat text-4xl font-semibold leading-none text-[var(--ui-text-primary)]">
          {displayStreak}
        </p>
        <div className="pb-0.5">
          <h2 className="text-sm font-semibold text-[var(--ui-text-primary)]">
            Streak
          </h2>
          <p className="text-xs text-[var(--ui-text-muted)]">{streakLabel}</p>
        </div>
      </div>

      <CalendarStreakStat animate={animateReveal && variant === "game-over"} />

      {isAlreadyPlayed ? (
        <p className="mt-2 text-xs text-[var(--ui-text-muted)]">
          Next puzzle in {countdown}
        </p>
      ) : result.streak === 0 ? (
        <p className="mt-2 text-xs text-[var(--ui-text-muted)]">
          Tough break — try again tomorrow.
        </p>
      ) : (
        <p className="mt-2 text-xs text-[var(--ui-text-muted)]">
          Nice run — see you tomorrow.
        </p>
      )}

      {showAnswerReveal && (
        <div className="mt-2 rounded-lg border border-[color-mix(in_srgb,var(--ui-error)_30%,transparent)] bg-[color-mix(in_srgb,var(--ui-error)_8%,transparent)] px-2.5 py-2">
          {result.failedGuess.trim() && (
            <p className="text-xs text-[var(--ui-text-primary)]">
              You guessed{" "}
              <span className="font-medium text-[var(--ui-error)]">
                &ldquo;{result.failedGuess.trim()}&rdquo;
              </span>
            </p>
          )}
          <p
            className={`text-xs text-[var(--ui-text-primary)] ${result.failedGuess.trim() ? "mt-1" : ""}`}
          >
            Answer:{" "}
            <span className="font-semibold">{correctAnswer}</span>
          </p>
        </div>
      )}

      <TrifectaNudge status={trifecta} />

      <FriendResultContext
        mode="sweep"
        yourScore={result.streak}
        date={result.date}
      />

      <ShareCompareLink mode="sweep" date={result.date} />

      {onPlayAgain && (
        <button
          type="button"
          onClick={onPlayAgain}
          className="touch-target btn-primary mt-2.5 min-h-10 rounded-lg px-4 py-2 text-sm font-semibold"
        >
          Play again
        </button>
      )}

      {result.path.length > 0 && (
        <p className="mt-2 text-xs text-[var(--ui-text-muted)] line-clamp-2">
          {result.path.map(getCountryDisplayName).join(" → ")}
        </p>
      )}

      <ShareResult result={result} showCardPreview />
    </div>
  );
}
