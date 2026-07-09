"use client";

import { useEffect, useState } from "react";
import { FriendResultContext } from "@/components/game/FriendResultContext";
import { ResultReveal } from "@/components/game/ResultReveal";
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
import { useCountUp } from "@/lib/use-count-up";

interface TapDailyResultProps {
  result: CompletedTapResult;
  variant?: "complete" | "already-played";
  onPlayAgain?: () => void;
  layout?: "default" | "overlay";
}

export function TapDailyResult({
  result,
  variant = "complete",
  onPlayAgain,
  layout = "default",
}: TapDailyResultProps) {
  const { trifecta } = useRetention();
  const [countdown, setCountdown] = useState(() =>
    formatCountdown(getMsUntilNextPuzzle()),
  );
  const isOverlay = layout === "overlay";
  const shouldAnimate = variant === "complete";
  const displayScore = useCountUp(result.totalScore, { enabled: shouldAnimate });

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCountdown(formatCountdown(getMsUntilNextPuzzle()));
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const isAlreadyPlayed = variant === "already-played";
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
                  isOverlay ? "text-3xl" : "text-4xl"
                }`}
              >
                {displayScore}
              </p>
              <div className="pb-0.5">
                <h2 className="text-sm font-semibold text-[var(--ui-text-primary)]">
                  Score
                </h2>
                <p className="text-xs text-[var(--ui-text-muted)]">/ {MAX_TAP_SCORE}</p>
              </div>
            </div>
            {isOverlay && <CalendarStreakStat animate={shouldAnimate} compact />}
          </div>
        </div>

        <div>
          {!isOverlay && <CalendarStreakStat animate={shouldAnimate} />}

          <p className={`text-xs tracking-wide text-[var(--ui-text-muted)] ${isOverlay ? "" : "mt-2"}`}>
            {result.rounds
              .map((round) => `${round.basePoints}${getScoreEmoji(round.basePoints)}`)
              .join(" ")}
          </p>

          <p className={`text-xs text-[var(--ui-text-muted)] ${isOverlay ? "mt-0.5" : "mt-2"}`}>
            {isAlreadyPlayed
              ? `Next puzzle in ${countdown}`
              : "See you tomorrow for five new locations."}
          </p>
        </div>

        <div>
          <TrifectaNudge status={trifecta} compact={isOverlay} />
          <FriendResultContext
            mode="tap"
            yourScore={result.totalScore}
            date={result.date}
            compact={isOverlay}
          />
          <ShareCompareLink mode="tap" date={result.date} />
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

        {!isOverlay && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-[var(--ui-text-primary)]">
              Rounds
            </h3>
            {result.rounds.map((round, index) => (
              <div
                key={`${round.locationId}-${index}`}
                className="rounded-md border border-[var(--ui-border-subtle)] bg-[color-mix(in_srgb,var(--ui-surface-raised)_70%,transparent)] px-2.5 py-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-[var(--ui-text-primary)] line-clamp-1">
                    {round.prompt}
                  </p>
                  <p className="font-stat shrink-0 text-xs tabular-nums text-[var(--ui-accent-primary)]">
                    {round.totalPoints}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <TapShareResult
          result={result}
          rewardPop={shouldAnimate}
          compact={isOverlay}
        />
      </ResultReveal>
    </div>
  );
}
