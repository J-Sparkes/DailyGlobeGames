"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HuntGlobeBridge } from "@/components/game/GlobeBridge";
import { HuntDailyResult } from "@/components/game/HuntDailyResult";
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
import { GameMenu } from "@/components/menu/GameMenu";
import type { HuntGuessMarker } from "@/components/map/HuntGlobe";
import { getCountryDisplayName } from "@/lib/country-resolve";
import { fetchHuntDaily, submitHuntGuess, submitHuntResult } from "@/lib/api/client";
import { isUnlimitedPlaysEnabled } from "@/lib/daily-play";
import { isTouchDevice } from "@/lib/device";
import { getFeatureCentroid } from "@/lib/geo-centroid";
import { appendHuntGameHistory } from "@/lib/profile-storage";
import { recordDailyComplete } from "@/lib/retention-events";
import { useDailyDate } from "@/lib/use-daily-date";
import { useRetention } from "@/lib/use-retention";
import { playCorrectGuessSound, primeAudio } from "@/lib/sounds";
import { useVisualViewportInset } from "@/lib/use-visual-viewport-inset";
import { useDailyDateRollover } from "@/lib/use-daily-date-rollover";
import { acquireGlobeInputLock, releaseGlobeInputLock } from "@/lib/globe-input-lock";
import { appendHuntGuess, buildWinningHuntGuess } from "@/lib/hunt-guess";
import {
  clearHuntDailyStorage,
  createInitialHuntProgress,
  getHuntCompletedResultForToday,
  getHuntProgressForToday,
  saveHuntCompletedResult,
  saveHuntProgress,
  type HuntPhase,
} from "@/lib/hunt-daily-play";
import {
  formatMiles,
  MAX_HUNT_GUESSES,
  scoreForGuess,
} from "@/lib/hunt-scoring";
import {
  loadCountryFeatures,
  type CountryFeature,
} from "@/lib/world-geographies";
import type { CompletedHuntResult, HuntGuess } from "@/types/hunt";

export function HuntGame() {
  const dateSeed = useDailyDate();
  const { calendarStreak } = useRetention();
  const unlimited = isUnlimitedPlaysEnabled();
  const isTouch = useMemo(
    () => (typeof window !== "undefined" ? isTouchDevice() : false),
    [],
  );

  const [features, setFeatures] = useState<CountryFeature[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [hiddenCountryId, setHiddenCountryId] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<HuntGuess[]>([]);
  const [phase, setPhase] = useState<HuntPhase>("playing");
  const [completedResult, setCompletedResult] =
    useState<CompletedHuntResult | null>(null);
  const [lastGuess, setLastGuess] = useState<HuntGuess | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [freshComplete, setFreshComplete] = useState(false);
  const keyboardInset = useVisualViewportInset();
  const guessesRef = useRef(guesses);
  const hiddenCountryIdRef = useRef(hiddenCountryId);
  const phaseRef = useRef(phase);
  const completedResultRef = useRef(completedResult);
  const processingGuessRef = useRef(false);
  const dateStale = useDailyDateRollover(dateSeed);

  useEffect(() => {
    guessesRef.current = guesses;
    hiddenCountryIdRef.current = hiddenCountryId;
    phaseRef.current = phase;
    completedResultRef.current = completedResult;
    if (phase === "playing") {
      releaseGlobeInputLock(processingGuessRef);
    }
  }, [guesses, hiddenCountryId, phase, completedResult]);

  const featureById = useMemo(() => {
    const map = new Map<string, CountryFeature>();
    for (const feature of features) {
      map.set(feature.properties.countryId, feature);
    }
    return map;
  }, [features]);

  useEffect(() => {
    loadCountryFeatures().then((loaded) => {
      setFeatures(loaded);
      setMapReady(true);
    });
  }, []);

  useEffect(() => {
    if (!mapReady || features.length === 0) return;

    const completed = getHuntCompletedResultForToday();
    if (completed) {
      setCompletedResult(completed);
      setHiddenCountryId(completed.hiddenCountryId);
      setGuesses(completed.guesses);
      setInitialized(true);
      return;
    }

    const progress = getHuntProgressForToday();
    if (progress) {
      setHiddenCountryId(progress.hiddenCountryId ?? null);
      setGuesses(progress.guesses);
      setPhase(progress.phase);
      if (progress.guesses.length > 0) {
        setLastGuess(progress.guesses[progress.guesses.length - 1] ?? null);
      }
    } else {
      void fetchHuntDaily(dateSeed);
      if (!unlimited) {
        saveHuntProgress(createInitialHuntProgress());
      }
    }

    setInitialized(true);
  }, [mapReady, features, unlimited]);

  useEffect(() => {
    if (!initialized || completedResult || unlimited) return;

    saveHuntProgress({
      date: dateSeed,
      hiddenCountryId: hiddenCountryId ?? undefined,
      guesses,
      phase,
    });
  }, [initialized, completedResult, hiddenCountryId, guesses, phase, dateSeed, unlimited]);

  const guessesRemaining = MAX_HUNT_GUESSES - guesses.length;
  const isPlaying = initialized && !completedResult;
  const showFeedback = isPlaying && phase === "guess-result" && lastGuess;

  const markers = useMemo((): HuntGuessMarker[] => {
    return guesses.map((guess, index) => {
      const feature = featureById.get(guess.countryId);
      if (!feature) {
        return {
          id: `guess-${guess.countryId}`,
          lat: 0,
          lng: 0,
          label: `${index + 1}`,
          color: "#f87171",
        };
      }
      const { lat, lng } = getFeatureCentroid(feature);
      return {
        id: `guess-${guess.countryId}`,
        lat,
        lng,
        label: `${index + 1}: ${formatMiles(guess.distanceMiles)}`,
        color: "#f87171",
      };
    });
  }, [guesses, featureById]);

  const finishGame = useCallback(
    (
      finalGuesses: HuntGuess[],
      won: boolean,
      solvedOnGuess: number | null,
      revealedHiddenId: string,
    ) => {
      const result: CompletedHuntResult = {
        date: dateSeed,
        hiddenCountryId: revealedHiddenId,
        guesses: finalGuesses,
        won,
        solvedOnGuess,
        score: won && solvedOnGuess ? scoreForGuess(solvedOnGuess) : 0,
      };

      saveHuntCompletedResult(result);
      appendHuntGameHistory(result);
      recordDailyComplete("hunt", result.score);
      setCompletedResult(result);
      setFreshComplete(true);
      setHiddenCountryId(revealedHiddenId);
      setPhase("playing");
      void submitHuntResult({
        date: dateSeed,
        won,
        solvedOnGuess,
        guessCount: finalGuesses.length,
      });
    },
    [dateSeed],
  );

  const handlePlayAgain = useCallback(() => {
    if (!mapReady || features.length === 0) return;

    clearHuntDailyStorage();
    setHiddenCountryId(null);
    setGuesses([]);
    setPhase("playing");
    setCompletedResult(null);
    setLastGuess(null);
    setFreshComplete(false);
    void fetchHuntDaily(dateSeed);
    if (!unlimited) {
      saveHuntProgress(createInitialHuntProgress());
    }
  }, [mapReady, features, unlimited, dateSeed]);

  const handleCountryClick = useCallback(
    async (countryId: string) => {
      if (phaseRef.current !== "playing" || completedResultRef.current) {
        return;
      }

      const currentGuesses = guessesRef.current;
      if (currentGuesses.some((guess) => guess.countryId === countryId)) return;

      primeAudio();
      if (!acquireGlobeInputLock(processingGuessRef)) return;

      try {
        const response = await submitHuntGuess({
          date: dateSeed,
          countryId,
          previousDistanceMiles: currentGuesses.at(-1)?.distanceMiles ?? null,
        });

        if (response.won && response.hiddenCountryId) {
          playCorrectGuessSound();
          const previousMiles = currentGuesses.at(-1)?.distanceMiles ?? null;
          const winningGuess = buildWinningHuntGuess(
            response.hiddenCountryId,
            previousMiles,
          );
          const finalGuesses = appendHuntGuess(currentGuesses, winningGuess);
          guessesRef.current = finalGuesses;
          setGuesses(finalGuesses);
          finishGame(finalGuesses, true, finalGuesses.length, response.hiddenCountryId);
          return;
        }

        phaseRef.current = "guess-result";

        const guess: HuntGuess = {
          countryId,
          distanceMiles: response.distanceMiles,
          warmer: response.warmer,
        };

        const nextGuesses = appendHuntGuess(currentGuesses, guess);
        guessesRef.current = nextGuesses;
        setGuesses(nextGuesses);
        setLastGuess(guess);
        setPhase("guess-result");
      } catch {
        releaseGlobeInputLock(processingGuessRef);
      }
    },
    [dateSeed, finishGame],
  );

  const handleContinue = useCallback(async () => {
    if (guesses.length >= MAX_HUNT_GUESSES) {
      const res = await fetch("/api/daily/hunt/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateSeed, guessCount: guesses.length }),
      });
      const data = (await res.json()) as { hiddenCountryId?: string };
      finishGame(guesses, false, null, data.hiddenCountryId ?? "unknown");
      return;
    }
    setPhase("playing");
    setLastGuess(null);
  }, [guesses, finishGame, dateSeed]);

  const huntPrompt =
    isPlaying && phase === "playing"
      ? guessesRemaining === 1
        ? "1 guess left — tap a country"
        : `${guessesRemaining} guesses left — tap a country`
      : undefined;

  const huntLiveMessage = useMemo(() => {
    if (completedResult) return completedResult.won ? "Hunt won." : "Hunt complete.";
    return huntPrompt ?? "Tap a country on the globe.";
  }, [completedResult, huntPrompt]);

  const warmerLabel =
    lastGuess?.warmer === "warmer"
      ? "Warmer"
      : lastGuess?.warmer === "colder"
        ? "Colder"
        : lastGuess?.warmer === "same"
          ? "Same distance"
          : null;

  const controlHint = isTouch
    ? "Swipe to spin · pinch to zoom · tap a country"
    : "Drag to spin · scroll to zoom · click a country";

  const huntGlobeProps = useMemo(
    () =>
      mapReady && initialized
        ? {
            interactive: phase === "playing" && !completedResult,
            guesses: markers,
            hiddenCountryId,
            revealHidden: Boolean(completedResult),
            won: completedResult?.won ?? false,
            onCountryClick: handleCountryClick,
          }
        : null,
    [
      mapReady,
      initialized,
      phase,
      completedResult,
      markers,
      hiddenCountryId,
      handleCountryClick,
    ],
  );

  return (
    <div className="relative h-full w-full pointer-events-none">
      <HuntGlobeBridge props={huntGlobeProps} />
      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {(!mapReady || !initialized) && (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center bg-black text-sm text-slate-400">
          Loading…
        </div>
      )}

      <GameLiveRegion message={huntLiveMessage} />

      <HudLayer>
        <HudAnchor position="top">
          {dateStale && (
            <DailyDateStaleBanner onRefresh={() => window.location.reload()} />
          )}
          <HudPanel>
            <HudToolbar
              onMenuOpen={() => setMenuOpen(true)}
              date={isPlaying ? dateSeed : undefined}
              stat={
                isPlaying
                  ? { label: "Left", value: guessesRemaining }
                  : undefined
              }
              secondaryStat={{
                label: "Day streak",
                value: calendarStreak.current,
              }}
              prompt={huntPrompt}
              meta={isPlaying && phase === "playing" ? controlHint : undefined}
            >
              <ModeSwitcher />
            </HudToolbar>
          </HudPanel>
        </HudAnchor>

        <HudSpacer />

        <HudAnchor position="bottom" keyboardInset={keyboardInset}>
          {completedResult && (
            <HudScroll>
              <HuntDailyResult
                result={completedResult}
                variant={freshComplete ? "complete" : "already-played"}
                onPlayAgain={unlimited ? handlePlayAgain : undefined}
              />
            </HudScroll>
          )}

          {showFeedback && (
            <HudPanel>
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-semibold text-white">
                  {getCountryDisplayName(lastGuess.countryId)}
                </p>
                <span className="shrink-0 text-[10px] text-slate-500">
                  {guesses.length}/{MAX_HUNT_GUESSES}
                </span>
              </div>
              <p className="mt-0.5 text-xl font-semibold tabular-nums text-sky-300">
                {formatMiles(lastGuess.distanceMiles)} away
              </p>

              {warmerLabel && (
                <span
                  className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    lastGuess.warmer === "warmer"
                      ? "bg-orange-500/20 text-orange-200"
                      : lastGuess.warmer === "colder"
                        ? "bg-sky-500/20 text-sky-200"
                        : "bg-slate-500/20 text-slate-300"
                  }`}
                >
                  {warmerLabel}
                </span>
              )}

              <button
                type="button"
                onClick={handleContinue}
                className="touch-target btn-primary mt-2.5 w-full min-h-10 rounded-lg px-4 py-2 text-sm font-semibold"
              >
                {guesses.length >= MAX_HUNT_GUESSES
                  ? "Reveal answer"
                  : "Keep hunting"}
              </button>
            </HudPanel>
          )}
        </HudAnchor>
      </HudLayer>
    </div>
  );
}
