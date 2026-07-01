"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TapGlobeBridge } from "@/components/game/GlobeBridge";
import {
  HudAnchor,
  HudBadge,
  HudLayer,
  HudMeta,
  HudPanel,
  HudPrompt,
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
import { pickDailyLocations } from "@/lib/daily-locations";
import { isTouchDevice } from "@/lib/device";
import { getLocationPool } from "@/lib/location-data";
import { appendTapGameHistory } from "@/lib/profile-storage";
import { playCorrectGuessSound, primeAudio } from "@/lib/sounds";
import { useVisualViewportInset } from "@/lib/use-visual-viewport-inset";
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
  haversineKm,
  MAX_ROUNDS,
  scoreRound,
  sumTapScore,
} from "@/lib/tap-scoring";
import type { DailyLocation, TapRoundResult } from "@/types/location";

export function TapGame() {
  const dailyLocations = useMemo(
    () => pickDailyLocations(getLocationPool(), MAX_ROUNDS),
    [],
  );
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

  useEffect(() => {
    resultsRef.current = results;
    roundIndexRef.current = roundIndex;
    phaseRef.current = phase;
    completedResultRef.current = completedResult;
  }, [results, roundIndex, phase, completedResult]);

  const currentLocation: DailyLocation | undefined = dailyLocations[roundIndex];
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
    (lat: number, lng: number) => {
      const location = dailyLocations[roundIndexRef.current];
      if (
        !location ||
        phaseRef.current !== "aiming" ||
        completedResultRef.current
      ) {
        return;
      }

      primeAudio();

      const distanceKm = haversineKm(
        lat,
        lng,
        location.lat,
        location.lng,
      );
      const scoring = scoreRound(distanceKm, roundIndexRef.current);

      const roundResult: TapRoundResult = {
        locationId: location.id,
        prompt: location.prompt,
        guessLat: lat,
        guessLng: lng,
        answerLat: location.lat,
        answerLng: location.lng,
        distanceKm,
        basePoints: scoring.basePoints,
        multiplier: scoring.multiplier,
        totalPoints: scoring.totalPoints,
        fact: location.fact,
      };

      if (scoring.basePoints >= 70) {
        playCorrectGuessSound();
      }

      const nextResults = [...resultsRef.current, roundResult];
      setResults(nextResults);
      setCurrentRound(roundResult);
      setPhase("round-result");
    },
    [dailyLocations],
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
    <div className="relative h-full w-full overflow-hidden bg-transparent">
      <TapGlobeBridge props={tapGlobeProps} />
      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {!initialized && (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center bg-black text-sm text-slate-400">
          Loading…
        </div>
      )}

      <HudLayer>
        <HudAnchor position="top">
          <HudPanel>
            <HudToolbar
              onMenuOpen={() => setMenuOpen(true)}
              stat={{
                label: "Score",
                value: completedResult?.totalScore ?? runningScore,
              }}
              badge={
                isPlaying && phase === "aiming" ? (
                  <HudBadge>
                    R{roundIndex + 1}/{MAX_ROUNDS}
                    {multiplier > 1 ? ` ×${multiplier}` : ""}
                  </HudBadge>
                ) : undefined
              }
            >
              <ModeSwitcher />
            </HudToolbar>

            {isPlaying && phase === "aiming" && currentLocation && (
              <>
                <HudPrompt>{currentLocation.prompt}</HudPrompt>
                <HudMeta>{controlHint}</HudMeta>
              </>
            )}

            {unlimited && (
              <p className="mt-1 text-[10px] text-amber-200/90">Test mode</p>
            )}
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
                className="touch-target mt-2.5 w-full min-h-10 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
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
