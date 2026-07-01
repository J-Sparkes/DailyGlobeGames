"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HuntGlobeBridge } from "@/components/game/GlobeBridge";
import { HuntDailyResult } from "@/components/game/HuntDailyResult";
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
import { GameMenu } from "@/components/menu/GameMenu";
import type { HuntGuessMarker } from "@/components/map/HuntGlobe";
import { getCountryDisplayName } from "@/lib/country-resolve";
import { getDateSeed } from "@/lib/daily-seed";
import { pickDailyHuntCountry } from "@/lib/daily-hunt";
import { isUnlimitedPlaysEnabled } from "@/lib/daily-play";
import { isTouchDevice } from "@/lib/device";
import { haversineKm, kmToMiles } from "@/lib/geo-distance";
import { getFeatureCentroid } from "@/lib/geo-centroid";
import {
  appendHuntGameHistory,
} from "@/lib/profile-storage";
import { playCorrectGuessSound, primeAudio } from "@/lib/sounds";
import { useVisualViewportInset } from "@/lib/use-visual-viewport-inset";
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
  getWarmerHint,
  MAX_HUNT_GUESSES,
  scoreForGuess,
} from "@/lib/hunt-scoring";
import {
  loadCountryFeatures,
  type CountryFeature,
} from "@/lib/world-geographies";
import type { CompletedHuntResult, HuntGuess } from "@/types/hunt";

export function HuntGame() {
  const dateSeed = useMemo(() => getDateSeed(), []);
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

  useEffect(() => {
    guessesRef.current = guesses;
    hiddenCountryIdRef.current = hiddenCountryId;
    phaseRef.current = phase;
    completedResultRef.current = completedResult;
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
      setHiddenCountryId(progress.hiddenCountryId);
      setGuesses(progress.guesses);
      setPhase(progress.phase);
      if (progress.guesses.length > 0) {
        setLastGuess(progress.guesses[progress.guesses.length - 1] ?? null);
      }
    } else {
      const picked = pickDailyHuntCountry(features);
      setHiddenCountryId(picked);
      if (!unlimited) {
        saveHuntProgress(createInitialHuntProgress(picked));
      }
    }

    setInitialized(true);
  }, [mapReady, features, unlimited]);

  useEffect(() => {
    if (!initialized || completedResult || !hiddenCountryId || unlimited) return;

    saveHuntProgress({
      date: dateSeed,
      hiddenCountryId,
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
    ) => {
      if (!hiddenCountryId) return;

      const result: CompletedHuntResult = {
        date: dateSeed,
        hiddenCountryId,
        guesses: finalGuesses,
        won,
        solvedOnGuess,
        score: won && solvedOnGuess ? scoreForGuess(solvedOnGuess) : 0,
      };

      saveHuntCompletedResult(result);
      appendHuntGameHistory(result);
      setCompletedResult(result);
      setFreshComplete(true);
      setPhase("playing");
    },
    [hiddenCountryId, dateSeed],
  );

  const handlePlayAgain = useCallback(() => {
    if (!mapReady || features.length === 0) return;

    clearHuntDailyStorage();
    const picked = pickDailyHuntCountry(features);
    setHiddenCountryId(picked);
    setGuesses([]);
    setPhase("playing");
    setCompletedResult(null);
    setLastGuess(null);
    setFreshComplete(false);
    if (!unlimited) {
      saveHuntProgress(createInitialHuntProgress(picked));
    }
  }, [mapReady, features, unlimited]);

  const getDistanceMiles = useCallback(
    (fromCountryId: string, toCountryId: string): number | null => {
      const fromFeature = featureById.get(fromCountryId);
      const toFeature = featureById.get(toCountryId);
      if (!fromFeature || !toFeature) return null;

      const from = getFeatureCentroid(fromFeature);
      const to = getFeatureCentroid(toFeature);
      return kmToMiles(
        haversineKm(from.lat, from.lng, to.lat, to.lng),
      );
    },
    [featureById],
  );

  const handleCountryClick = useCallback(
    (countryId: string) => {
      const hiddenId = hiddenCountryIdRef.current;
      if (!hiddenId || phaseRef.current !== "playing" || completedResultRef.current) {
        return;
      }

      const currentGuesses = guessesRef.current;
      if (currentGuesses.some((guess) => guess.countryId === countryId)) return;

      primeAudio();

      if (countryId === hiddenId) {
        playCorrectGuessSound();
        const guessNumber = currentGuesses.length + 1;
        finishGame(currentGuesses, true, guessNumber);
        return;
      }

      const distanceMiles = getDistanceMiles(countryId, hiddenId);
      if (distanceMiles === null) return;

      const previousMiles = currentGuesses.at(-1)?.distanceMiles ?? null;
      const guess: HuntGuess = {
        countryId,
        distanceMiles,
        warmer: getWarmerHint(distanceMiles, previousMiles),
      };

      const nextGuesses = [...currentGuesses, guess];
      setGuesses(nextGuesses);
      setLastGuess(guess);
      setPhase("guess-result");
    },
    [getDistanceMiles, finishGame],
  );

  const handleContinue = useCallback(() => {
    if (guesses.length >= MAX_HUNT_GUESSES) {
      finishGame(guesses, false, null);
      return;
    }
    setPhase("playing");
    setLastGuess(null);
  }, [guesses, finishGame]);

  const controlHint = isTouch
    ? "Swipe to spin · pinch to zoom · tap a country"
    : "Drag to spin · scroll to zoom · click a country";

  const warmerLabel =
    lastGuess?.warmer === "warmer"
      ? "Warmer"
      : lastGuess?.warmer === "colder"
        ? "Colder"
        : lastGuess?.warmer === "same"
          ? "Same distance"
          : null;

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
    <div className="relative h-full w-full overflow-hidden bg-transparent">
      <HuntGlobeBridge props={huntGlobeProps} />
      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {(!mapReady || !initialized) && (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center bg-black text-sm text-slate-400">
          Loading…
        </div>
      )}

      <HudLayer>
        <HudAnchor position="top">
          <HudPanel>
            <HudToolbar
              onMenuOpen={() => setMenuOpen(true)}
              stat={
                isPlaying
                  ? { label: "Left", value: guessesRemaining }
                  : undefined
              }
              badge={
                isPlaying && phase === "playing" ? (
                  <HudBadge>{dateSeed}</HudBadge>
                ) : undefined
              }
            >
              <ModeSwitcher />
            </HudToolbar>

            {isPlaying && phase === "playing" && (
              <>
                <HudPrompt>
                  {guessesRemaining === 1
                    ? "1 guess left — tap a country"
                    : `${guessesRemaining} guesses left — tap a country`}
                </HudPrompt>
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
                className="touch-target mt-2.5 w-full min-h-10 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
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
