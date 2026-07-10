"use client";

import { useEffect, useState } from "react";
import { CalendarStreakStat } from "@/components/retention/CalendarStreakStat";
import { ResultReveal } from "@/components/game/ResultReveal";
import { TrifectaNudge } from "@/components/game/TrifectaNudge";
import {
  formatCountdown,
  getMsUntilNextPuzzle,
} from "@/lib/daily-play";
import type { CompletedQuizResult } from "@/lib/quiz-daily-play";
import { useRetention } from "@/lib/use-retention";
import { useCountUp } from "@/lib/use-count-up";

interface QuizDailyResultProps {
  result: CompletedQuizResult;
  variant?: "complete" | "already-played";
  onPlayAgain?: () => void;
  layout?: "default" | "overlay";
}

export function QuizDailyResult({
  result,
  variant = "complete",
  onPlayAgain,
  layout = "overlay",
}: QuizDailyResultProps) {
  const { trifecta } = useRetention();
  const [countdown, setCountdown] = useState(() =>
    formatCountdown(getMsUntilNextPuzzle()),
  );
  const isOverlay = layout === "overlay";
  const shouldAnimate = variant === "complete";
  const displayScore = useCountUp(result.score, { enabled: shouldAnimate });
  const isAlreadyPlayed = variant === "already-played";

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCountdown(formatCountdown(getMsUntilNextPuzzle()));
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const statusMessage = isAlreadyPlayed
    ? `Next puzzle in ${countdown}`
    : result.won
      ? "Nice work — see you tomorrow for two new countries."
      : "Tough break — come back tomorrow for a fresh quiz.";

  return (
    <div className={isOverlay ? "result-overlay-content" : "hud-panel"}>
      <ResultReveal enabled={shouldAnimate}>
        <div>
          <p className="font-stat text-[10px] font-medium tracking-[0.15em] text-[var(--ui-accent-primary)] uppercase">
            {result.date}
          </p>

          <div className="mt-1.5 flex items-end justify-between gap-3">
            <div>
              <p
                className={`font-stat font-semibold tabular-nums leading-none text-[var(--ui-text-primary)] ${
                  isOverlay ? "text-3xl" : "text-4xl"
                }`}
              >
                {displayScore}
              </p>
              <h2 className="mt-1 text-sm font-semibold text-[var(--ui-text-primary)]">
                {result.won ? "Quiz complete" : "Quiz over"}
              </h2>
            </div>
            {isOverlay && <CalendarStreakStat animate={shouldAnimate} compact />}
          </div>
        </div>

        <div>
          <p className="text-xs text-[var(--ui-text-muted)]">{statusMessage}</p>
          {result.dailyCountry && (
            <p className="mt-2 text-xs text-[var(--ui-text-muted)]">
              Daily: {result.dailyCountry}
              {result.bonusCountry ? ` · Bonus: ${result.bonusCountry}` : ""}
            </p>
          )}
        </div>

        <TrifectaNudge status={trifecta} compact={isOverlay} />

        {onPlayAgain && (
          <button
            type="button"
            onClick={onPlayAgain}
            className="touch-target btn-primary w-full min-h-11 rounded-lg px-4 py-2 text-sm font-semibold"
          >
            Play again
          </button>
        )}
      </ResultReveal>
    </div>
  );
}
