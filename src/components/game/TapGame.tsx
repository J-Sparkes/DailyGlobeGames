"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TapGlobeBridge } from "@/components/game/GlobeBridge";
import {
  DailyDateStaleBanner,
  GameLiveRegion,
  HudAnchor,
  HudLayer,
  HudPanel,
  HudScroll,
  HudSpacer,
  HudToolbar,
} from "@/components/game/GameHud";
import { ModeSwitcher } from "@/components/game/ModeSwitcher";
import { TapDailyResult } from "@/components/game/TapDailyResult";
import { GameMenu } from "@/components/menu/GameMenu";
import type { GlobeMarker } from "@/components/map/TapGlobe";
import { getDateSeed } from "@/lib/daily-seed";
import { isUnlimitedPlaysEnabled } from "@/lib/daily-play";
import { isTouchDevice } from "@/lib/device";
import { fetchTapDaily, submitTapGuess, submitTapResult } from "@/lib/api/client";
import type { TapRoundPublic } from "@/lib/api/client";
import { appendTapGameHistory } from "@/lib/profile-storage";
import { playCorrectGuessSound, primeAudio } from "@/lib/sounds";
import { useVisualViewportInset } from "@/lib/use-visual-viewport-inset";
import { acquireGlobeInputLock, releaseGlobeInputLock } from "@/lib/globe-input-lock";
import { useDailyDateRollover } from "@/lib/use-daily-date-rollover";
import {
  clearTapDailyStorage,
  createInitialTapProgress,
  getTapCompletedResultForToday,
  getTapProgressForToday,
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
import type { TapRoundResult } from "@/types/location";

export function TapGame() {
  const [dailyRounds, setDailyRounds] = useState<TapRoundPublic[]>([]);
  const dateSeed = useMemo(() => getDateSeed(), []);
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
  const keyboardInset = useVisualViewportInset();
  const resultsRef = useRef(results);
  const roundIndexRef = useRef(roundIndex);
  const phaseRef = useRef(phase);
  const completedResultRef = useRef(completedResult);
  const processingTapRef = useRef(false);
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
    fetchTapDaily(dateSeed)
      .then((data) => setDailyRounds(data.rounds))
      .catch(() => setDailyRounds([]));
  }, [dateSeed]);

  const currentLocation: TapRoundPublic | undefined = dailyRounds[roundIndex];
  const runningScore = useMemo(() => sumTapScore(results), [results]);

  useEffect(() => {
    const completed = getTapCompletedResultForToday();
    if (completed) {
      setCompletedResult(completed);
      setRoundIndex(completed.rounds.length);
      setResults(completed.rounds);
      setInitialized(true);
      return;
    }

    const progress = getTapProgressForToday();
    if (progress) {
      setRoundIndex(progress.roundIndex);
      setResults(progress.results);
      setPhase(progress.phase);
      if (progress.phase === "round-result" && progress.results.length > 0) {
        setCurrentRound(progress.results[progress.results.length - 1] ?? null);
      }
    } else if (!unlimited) {
      saveTapProgress(createInitialTapProgress());
    }

    setInitialized(true);
  }, [unlimited]);

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
        color: "#f87171",
        size: 0.35,
      },
      {
        id: "answer",
        lat: currentRound.answerLat,
        lng: currentRound.answerLng,
        color: "#4ade80",
        size: 0.35,
      },
    ];
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
      saveTapProgress(createInitialTapProgress());
    }
  }, [unlimited]);

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

      phaseRef.current = "round-result";
      primeAudio();

      try {
        const { result: roundResult } = await submitTapGuess({
          date: dateSeed,
          roundIndex: roundIndexRef.current,
          lat,
          lng,
        });

        if (roundResult.basePoints >= 70) {
          playCorrectGuessSound();
        }

        const nextResults = [...resultsRef.current, roundResult];
        resultsRef.current = nextResults;
        setResults(nextResults);
        setCurrentRound(roundResult);
        setPhase("round-result");
      } catch {
        releaseGlobeInputLock(processingTapRef);
        phaseRef.current = "aiming";
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
    ? "Swipe to spin · pinch to zoom · tap to guess"
    : "Drag to spin · scroll to zoom · click to guess";

  const multiplier = getRoundMultiplier(roundIndex);
  const isPlaying = initialized && !completedResult && roundIndex < MAX_ROUNDS;
  const showRoundResult = isPlaying && phase === "round-result" && currentRound;

  const tapMeta =
    isPlaying && phase === "aiming"
      ? `Round ${roundIndex + 1}/${MAX_ROUNDS}${multiplier > 1 ? ` · ×${multiplier}` : ""} · ${controlHint}`
      : undefined;

  const tapLiveMessage = useMemo(() => {
    if (completedResult) return "Tap game complete.";
    if (phase === "round-result") return "Round result ready.";
    if (currentLocation) return currentLocation.prompt;
    return "Tap the globe to guess.";
  }, [completedResult, phase, currentLocation]);

  const tapGlobeProps = useMemo(
    () =>
      initialized
        ? {
            interactive: phase === "aiming" && !completedResult,
            markers,
            onGlobeTap: handleGlobeTap,
          }
        : null,
    [initialized, phase, completedResult, markers, handleGlobeTap],
  );

  return (
    <div className="relative h-full w-full pointer-events-none">
      <TapGlobeBridge props={tapGlobeProps} />
      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {!initialized && (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center bg-black text-sm text-slate-400">
          Loading…
        </div>
      )}

      <GameLiveRegion message={tapLiveMessage} />

      <HudLayer>
        <HudAnchor position="top">
          {dateStale && (
            <DailyDateStaleBanner onRefresh={() => window.location.reload()} />
          )}
          <HudPanel>
            <HudToolbar
              onMenuOpen={() => setMenuOpen(true)}
              date={isPlaying ? dateSeed : undefined}
              stat={{
                label: "Score",
                value: completedResult?.totalScore ?? runningScore,
              }}
              prompt={
                isPlaying && phase === "aiming" && currentLocation
                  ? currentLocation.prompt
                  : undefined
              }
              meta={tapMeta}
            >
              <ModeSwitcher />
            </HudToolbar>
          </HudPanel>
        </HudAnchor>

        <HudSpacer />

        <HudAnchor position="bottom" keyboardInset={keyboardInset}>
          {completedResult && (
            <HudScroll>
              <TapDailyResult
                result={completedResult}
                variant={freshComplete ? "complete" : "already-played"}
                onPlayAgain={unlimited ? handlePlayAgain : undefined}
              />
            </HudScroll>
          )}

          {showRoundResult && (
            <HudPanel>
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">
                    Distance
                  </p>
                  <p className="text-xl font-semibold tabular-nums text-white">
                    {formatDistance(currentRound.distanceKm)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">
                    Round
                  </p>
                  <p className="text-xl font-semibold tabular-nums text-sky-300">
                    +{currentRound.totalPoints}
                  </p>
                </div>
              </div>

              {currentRound.fact && (
                <p className="mt-2 text-xs leading-relaxed text-slate-400 line-clamp-2">
                  {currentRound.fact}
                </p>
              )}

              <button
                type="button"
                onClick={handleNextRound}
                className="touch-target btn-primary mt-2.5 w-full min-h-10 rounded-lg px-4 py-2 text-sm font-semibold"
              >
                {roundIndex + 1 >= MAX_ROUNDS
                  ? `Final score (${runningScore})`
                  : "Next round"}
              </button>
            </HudPanel>
          )}
        </HudAnchor>
      </HudLayer>
    </div>
  );
}
