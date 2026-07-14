"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TapGlobeBridge } from "@/components/game/GlobeBridge";
import {
  GameLiveRegion,
  HudAnchor,
  HudLayer,
  HudPanel,
  HudSpacer,
  HudTopChrome,
  HudMobileInstruction,
  GameResultOverlay,
} from "@/components/game/GameHud";
import { ModeSwitcher } from "@/components/game/ModeSwitcher";
import { TapDailyResult } from "@/components/game/TapDailyResult";
import { GameMenu } from "@/components/menu/GameMenu";
import type { GlobeMarker } from "@/components/map/TapGlobe";
import { isUnlimitedPlaysEnabled } from "@/lib/daily-play";
import { isTouchDevice } from "@/lib/device";
import { TAP_PIN_SIZE } from "@/lib/tap-globe-view";
import { fetchTapDaily, submitTapGuess, submitTapResult } from "@/lib/api/client";
import type { TapRoundPublic } from "@/lib/api/client";
import { appendTapGameHistory } from "@/lib/profile-storage";
import { recordDailyComplete } from "@/lib/retention-events";
import { useDailyDate } from "@/lib/use-daily-date";
import { useRetention } from "@/lib/use-retention";
import { playCorrectGuessSound, primeAudio } from "@/lib/sounds";
import { useVisualViewportInset } from "@/lib/use-visual-viewport-inset";
import { acquireGlobeInputLock, releaseGlobeInputLock } from "@/lib/globe-input-lock";
import { useDailyDateRollover } from "@/lib/use-daily-date-rollover";
import {
  TAP_HIGH_SCORE_STREAK_TARGET,
  TAP_HIGH_SCORE_THRESHOLD,
  triggerHaptic,
} from "@/lib/game-feedback";
import {
  clearTapDailyStorage,
  createInitialTapProgress,
  getTapCompletedResultForDate,
  getTapProgressForDate,
  saveTapCompletedResult,
  saveTapProgress,
  type CompletedTapResult,
  type TapPhase,
} from "@/lib/tap-daily-play";
import {
  formatDistance,
  getRoundMultiplier,
  MAX_ROUNDS,
  sumTapScore,
} from "@/lib/tap-scoring";
import { UI } from "@/lib/design-tokens";
import type { TapRoundResult } from "@/types/location";

export function TapGame() {
  const [dailyRounds, setDailyRounds] = useState<TapRoundPublic[]>([]);
  const dateSeed = useDailyDate();
  const { calendarStreak } = useRetention();
  const unlimited = isUnlimitedPlaysEnabled();
  const isTouch = useMemo(
    () => (typeof window !== "undefined" ? isTouchDevice() : false),
    [],
  );

  const [initialized, setInitialized] = useState(false);
  const [completedResult, setCompletedResult] =
    useState<CompletedTapResult | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [results, setResults] = useState<TapRoundResult[]>([]);
  const [phase, setPhase] = useState<TapPhase>("aiming");
  const [currentRound, setCurrentRound] = useState<TapRoundResult | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [freshComplete, setFreshComplete] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scorePop, setScorePop] = useState(false);
  const [scoreBurst, setScoreBurst] = useState(false);
  const [resultsDismissed, setResultsDismissed] = useState(false);
  const keyboardInset = useVisualViewportInset();
  const resultsRef = useRef(results);
  const roundIndexRef = useRef(roundIndex);
  const phaseRef = useRef(phase);
  const completedResultRef = useRef(completedResult);
  const processingTapRef = useRef(false);
  const highScoreStreakRef = useRef(0);
  const dateStale = useDailyDateRollover(dateSeed);

  useEffect(() => {
    resultsRef.current = results;
    roundIndexRef.current = roundIndex;
    phaseRef.current = phase;
    completedResultRef.current = completedResult;
    if (phase === "aiming") {
      releaseGlobeInputLock(processingTapRef);
    }
  }, [results, roundIndex, phase, completedResult]);

  useEffect(() => {
    setResultsDismissed(false);
  }, [completedResult]);

  useEffect(() => {
    fetchTapDaily(dateSeed)
      .then((data) => setDailyRounds(data.rounds))
      .catch(() => setDailyRounds([]));
  }, [dateSeed]);

  const currentLocation: TapRoundPublic | undefined = dailyRounds[roundIndex];
  const runningScore = useMemo(() => sumTapScore(results), [results]);

  useEffect(() => {
    setCompletedResult(null);
    setRoundIndex(0);
    setResults([]);
    setPhase("aiming");
    setCurrentRound(null);
    setFreshComplete(false);

    const completed = getTapCompletedResultForDate(dateSeed);
    if (completed) {
      setCompletedResult(completed);
      setRoundIndex(completed.rounds.length);
      setResults(completed.rounds);
      setInitialized(true);
      return;
    }

    const progress = getTapProgressForDate(dateSeed);
    if (progress) {
      setRoundIndex(progress.roundIndex);
      setResults(progress.results);
      setPhase(progress.phase);
      if (progress.phase === "round-result" && progress.results.length > 0) {
        setCurrentRound(progress.results[progress.results.length - 1] ?? null);
      }
    } else if (!unlimited) {
      saveTapProgress(createInitialTapProgress(dateSeed));
    }

    setInitialized(true);
  }, [unlimited, dateSeed]);

  useEffect(() => {
    if (!initialized || completedResult || unlimited) return;
    if (roundIndex >= MAX_ROUNDS) return;

    saveTapProgress({
      date: dateSeed,
      roundIndex,
      results,
      phase,
    });
  }, [initialized, completedResult, unlimited, dateSeed, roundIndex, results, phase]);

  const markers = useMemo((): GlobeMarker[] => {
    if (phase !== "round-result" || !currentRound) return [];

    return [
      {
        id: "guess",
        lat: currentRound.guessLat,
        lng: currentRound.guessLng,
        color: UI.error,
        size: TAP_PIN_SIZE,
      },
      {
        id: "answer",
        lat: currentRound.answerLat,
        lng: currentRound.answerLng,
        color: UI.success,
        size: TAP_PIN_SIZE,
      },
    ];
  }, [phase, currentRound]);

  const revealArc = useMemo(() => {
    if (phase !== "round-result" || !currentRound) return null;

    return {
      startLat: currentRound.guessLat,
      startLng: currentRound.guessLng,
      endLat: currentRound.answerLat,
      endLng: currentRound.answerLng,
    };
  }, [phase, currentRound]);

  const finishGame = useCallback(
    (finalRounds: TapRoundResult[]) => {
      const result: CompletedTapResult = {
        date: dateSeed,
        rounds: finalRounds,
        totalScore: sumTapScore(finalRounds),
      };
      saveTapCompletedResult(result);
      appendTapGameHistory(result);
      recordDailyComplete("tap", result.totalScore);
      setCompletedResult(result);
      setFreshComplete(true);
      setRoundIndex(MAX_ROUNDS);
      void submitTapResult({ date: dateSeed, rounds: finalRounds });
    },
    [dateSeed],
  );

  const handlePlayAgain = useCallback(() => {
    clearTapDailyStorage();
    setCompletedResult(null);
    setFreshComplete(false);
    setRoundIndex(0);
    setResults([]);
    setPhase("aiming");
    setCurrentRound(null);
    if (!unlimited) {
      saveTapProgress(createInitialTapProgress(dateSeed));
    }
  }, [unlimited, dateSeed]);

  const handleGlobeTap = useCallback(
    async (lat: number, lng: number) => {
      const location = dailyRounds[roundIndexRef.current];
      if (
        !location ||
        phaseRef.current !== "aiming" ||
        completedResultRef.current
      ) {
        return;
      }
      if (!acquireGlobeInputLock(processingTapRef)) return;

      setIsProcessing(true);
      phaseRef.current = "round-result";
      primeAudio();

      try {
        const { result: roundResult } = await submitTapGuess({
          date: dateSeed,
          roundIndex: roundIndexRef.current,
          lat,
          lng,
        });

        if (roundResult.basePoints >= TAP_HIGH_SCORE_THRESHOLD) {
          playCorrectGuessSound();
          triggerHaptic("success");
          highScoreStreakRef.current += 1;
          if (highScoreStreakRef.current >= TAP_HIGH_SCORE_STREAK_TARGET) {
            setScoreBurst(true);
            triggerHaptic("milestone");
            highScoreStreakRef.current = 0;
            window.setTimeout(() => setScoreBurst(false), 600);
          } else {
            setScorePop(true);
            window.setTimeout(() => setScorePop(false), 500);
          }
        } else {
          highScoreStreakRef.current = 0;
          triggerHaptic("success");
        }

        const nextResults = [...resultsRef.current, roundResult];
        resultsRef.current = nextResults;
        setResults(nextResults);
        setCurrentRound(roundResult);
        setPhase("round-result");
      } catch {
        releaseGlobeInputLock(processingTapRef);
        phaseRef.current = "aiming";
      } finally {
        setIsProcessing(false);
      }
    },
    [dailyRounds, dateSeed],
  );

  const handleNextRound = useCallback(() => {
    if (!currentRound) return;

    const nextIndex = roundIndex + 1;
    if (nextIndex >= MAX_ROUNDS) {
      finishGame(results);
      setPhase("aiming");
      setCurrentRound(null);
      return;
    }

    setRoundIndex(nextIndex);
    setPhase("aiming");
    setCurrentRound(null);
  }, [currentRound, roundIndex, results, finishGame]);

  const controlHint = isTouch
    ? "Swipe to spin · pinch to zoom · press and hold to pin"
    : "Drag to spin · scroll to zoom · hold click to pin";

  const multiplier = getRoundMultiplier(roundIndex);
  const isPlaying = initialized && !completedResult && roundIndex < MAX_ROUNDS;
  const showRoundResult = isPlaying && phase === "round-result" && currentRound;

  const tapMeta =
    isPlaying && phase === "aiming"
      ? `Round ${roundIndex + 1}/${MAX_ROUNDS}${multiplier > 1 ? ` · ×${multiplier}` : ""} · ${controlHint}`
      : undefined;

  const tapLiveMessage = useMemo(() => {
    if (completedResult) return "Tap is done for today.";
    if (phase === "round-result") return "Round result ready.";
    if (currentLocation) return currentLocation.prompt;
    return "Press and hold on the globe to place your pin.";
  }, [completedResult, phase, currentLocation]);

  const tapGlobeProps = useMemo(
    () =>
      initialized
        ? {
            interactive: phase === "aiming" && !completedResult,
            markers,
            revealArc,
            onGlobeTap: handleGlobeTap,
          }
        : null,
    [initialized, phase, completedResult, markers, revealArc, handleGlobeTap],
  );

  return (
    <div className="relative h-full w-full pointer-events-none">
      <TapGlobeBridge props={tapGlobeProps} />
      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {!initialized && (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center bg-black text-sm text-[var(--ui-text-muted)]">
          Loading…
        </div>
      )}

      {isProcessing && (
        <div className="pointer-events-none absolute inset-0 z-[5] globe-processing" />
      )}

      <GameLiveRegion message={tapLiveMessage} />

      <HudLayer>
        <HudAnchor position="top">
          <HudTopChrome
            onMenuOpen={() => setMenuOpen(true)}
            date={isPlaying ? dateSeed : undefined}
            stat={{
              label: "Score",
              value: completedResult?.totalScore ?? runningScore,
              pop: scorePop,
              burst: scoreBurst,
            }}
            secondaryStat={{
              label: "Day streak",
              value: calendarStreak.current,
            }}
            prompt={
              isPlaying && phase === "aiming" && currentLocation
                ? currentLocation.prompt
                : undefined
            }
            meta={tapMeta}
            dateStale={dateStale}
            onDateRefresh={() => window.location.reload()}
            modeSwitcher={<ModeSwitcher />}
          />
        </HudAnchor>

        <HudSpacer />

        <HudAnchor position="bottom" keyboardInset={keyboardInset}>
          {showRoundResult && (
            <HudPanel className="panel-enter">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--ui-text-muted)]">
                    Distance
                  </p>
                  <p className="font-stat text-xl font-semibold tabular-nums text-[var(--ui-text-primary)]">
                    {formatDistance(currentRound.distanceKm)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-[var(--ui-text-muted)]">
                    Round
                  </p>
                  <p className="font-stat text-xl font-semibold tabular-nums text-[var(--ui-accent-primary)]">
                    +{currentRound.totalPoints}
                  </p>
                </div>
              </div>

              {currentRound.fact && (
                <p className="mt-2 text-xs leading-relaxed text-[var(--ui-text-muted)] line-clamp-2">
                  {currentRound.fact}
                </p>
              )}

              <button
                type="button"
                onClick={handleNextRound}
                className="touch-target btn-primary mt-2.5 w-full min-h-11 rounded-lg px-4 py-2 text-sm font-semibold"
              >
                {roundIndex + 1 >= MAX_ROUNDS
                  ? `Final score (${runningScore})`
                  : "Next round"}
              </button>
            </HudPanel>
          )}
        </HudAnchor>

        <HudMobileInstruction
          primary={currentLocation?.prompt ?? "Press and hold on the globe to place your pin."}
          secondary={tapMeta}
          visible={isPlaying && !showRoundResult && !completedResult}
        />

        {completedResult && !resultsDismissed && (
          <GameResultOverlay
            label="Tap results"
            onClose={() => setResultsDismissed(true)}
          >
            <TapDailyResult
              result={completedResult}
              variant={freshComplete ? "complete" : "already-played"}
              layout="overlay"
              onPlayAgain={unlimited ? handlePlayAgain : undefined}
            />
          </GameResultOverlay>
        )}
      </HudLayer>
    </div>
  );
}
