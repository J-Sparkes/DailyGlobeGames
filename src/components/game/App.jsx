"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import triviaDaily from "@/data/trivia-daily.json";
import { GameOverlay } from "@/components/game/GameOverlay";
import {
  GameResultOverlay,
  HudAnchor,
  HudLayer,
  HudSpacer,
  HudTopChrome,
} from "@/components/game/GameHud";
import { ModeSwitcher } from "@/components/game/ModeSwitcher";
import { QuizDailyResult } from "@/components/game/QuizDailyResult";
import { GameMenu } from "@/components/menu/GameMenu";
import { TriviaGlobe } from "@/components/map/TriviaGlobe";
import { useGeographyGame } from "@/lib/useGeographyGame";
import {
  calculateDistance,
  getDirectionalHint,
} from "@/lib/calculateDistance";
import { isUnlimitedPlaysEnabled } from "@/lib/daily-play";
import {
  clearQuizDailyStorage,
  getQuizCompletedForDate,
  saveQuizCompletedResult,
} from "@/lib/quiz-daily-play";
import { appendGuestQuizHistory } from "@/lib/guest-history";
import { notifyRetentionUpdate, recordDailyComplete } from "@/lib/retention-events";
import {
  loadTriviaCountryLookup,
  resolveTriviaCountryByName,
  resolveTriviaCountryInput,
} from "@/lib/trivia-country-resolve";
import { useDailyDate } from "@/lib/use-daily-date";
import { useDailyDateRollover } from "@/lib/use-daily-date-rollover";
import { useRetention } from "@/lib/use-retention";

function normalizeCountryName(name) {
  return String(name ?? "").trim().toLowerCase();
}

function countriesMatch(guessedCountry, targetCountry) {
  return normalizeCountryName(guessedCountry) === normalizeCountryName(targetCountry);
}

export default function App() {
  const {
    score,
    lives,
    currentClueIndex,
    guesses,
    gameMode,
    gameState,
    locked,
    handleGuess,
    requestNextClue,
    resetForUnlimitedReplay,
  } = useGeographyGame();

  const dateSeed = useDailyDate();
  const { calendarStreak } = useRetention();
  const dateStale = useDailyDateRollover(dateSeed);
  const unlimited = isUnlimitedPlaysEnabled();

  const [countryLookup, setCountryLookup] = useState(null);
  const [pins, setPins] = useState([]);
  const [cameraTarget, setCameraTarget] = useState(null);
  const [successCountryId, setSuccessCountryId] = useState(null);
  const [toast, setToast] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [resultsDismissed, setResultsDismissed] = useState(false);
  const [completedResult, setCompletedResult] = useState(null);
  const [freshComplete, setFreshComplete] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const toastTimerRef = useRef(null);
  const savedResultRef = useRef(false);

  const isPlaying = gameState === "playing" && !locked && !completedResult;
  const showResultOverlay = Boolean(completedResult) && !resultsDismissed;

  const currentRound = useMemo(
    () => (gameMode === "bonus" ? triviaDaily.bonus : triviaDaily.daily),
    [gameMode],
  );

  const quizPrompt = useMemo(() => {
    if (!isPlaying) return undefined;
    if (gameMode === "bonus") return "Bonus round — name the hidden country.";
    return "Name today's country from the clues.";
  }, [gameMode, isPlaying]);

  useEffect(() => {
    loadTriviaCountryLookup().then(setCountryLookup);
  }, []);

  useEffect(() => {
    savedResultRef.current = false;
    setResultsDismissed(false);
    setFreshComplete(false);

    const completed = getQuizCompletedForDate(dateSeed);
    setCompletedResult(completed);
    setInitialized(true);
  }, [dateSeed]);

  useEffect(() => {
    setSuccessCountryId(null);
    setPins([]);
  }, [gameMode]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!initialized || locked || savedResultRef.current) return;
    if (gameState !== "won" && gameState !== "lost") return;

    const result = {
      date: dateSeed,
      score,
      won: gameState === "won",
      dailyCountry: triviaDaily.daily.name,
      bonusCountry: triviaDaily.bonus.name,
      guesses,
    };

    savedResultRef.current = true;
    saveQuizCompletedResult(result);
    appendGuestQuizHistory(dateSeed, score);
    recordDailyComplete("quiz", score);
    notifyRetentionUpdate();
    setCompletedResult(result);
    setFreshComplete(true);
    setResultsDismissed(false);
  }, [dateSeed, gameState, guesses, initialized, locked, score]);

  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToast(""), 4500);
  }, []);

  const focusGlobe = useCallback((coordinates) => {
    setCameraTarget({
      lat: coordinates.lat,
      lng: coordinates.lng,
      token: Date.now(),
      durationMs: 1200,
    });
  }, []);

  const handlePlayAgain = useCallback(() => {
    clearQuizDailyStorage();
    savedResultRef.current = false;
    setCompletedResult(null);
    setFreshComplete(false);
    setResultsDismissed(false);
    resetForUnlimitedReplay();
  }, [resetForUnlimitedReplay]);

  const onGuessSubmit = useCallback(
    (rawInput) => {
      if (!isPlaying || !countryLookup) return;

      const target = currentRound;
      const resolvedGuess = resolveTriviaCountryInput(rawInput, countryLookup);
      const guessLabel = resolvedGuess?.name ?? rawInput.trim();
      const isCorrect = countriesMatch(guessLabel, target.name);
      const resolvedTarget = resolveTriviaCountryByName(target.name, countryLookup);

      handleGuess(guessLabel, target.name);

      if (isCorrect) {
        setSuccessCountryId(resolvedTarget?.countryId ?? null);
        focusGlobe(target.coordinates);

        if (gameMode === "daily") {
          showToast("Daily complete! Bonus round unlocked.");
        }
        return;
      }

      if (resolvedGuess) {
        setPins((previous) => [
          ...previous,
          {
            id: `pin-${Date.now()}-${previous.length}`,
            lat: resolvedGuess.coordinates.lat,
            lng: resolvedGuess.coordinates.lng,
            label: resolvedGuess.name,
            color: "#ef4444",
          },
        ]);
        focusGlobe(resolvedGuess.coordinates);

        const distanceKm = calculateDistance(
          resolvedGuess.coordinates,
          target.coordinates,
        );
        const direction = getDirectionalHint(
          resolvedGuess.coordinates,
          target.coordinates,
        );

        showToast(
          `Wrong! ${resolvedGuess.name} is ${distanceKm.toLocaleString()} km away ${direction}`,
        );
        return;
      }

      showToast("We couldn't find that country on the map.");
    },
    [
      countryLookup,
      currentRound,
      focusGlobe,
      gameMode,
      handleGuess,
      isPlaying,
      showToast,
    ],
  );

  return (
    <div className="relative h-full w-full pointer-events-none">
      <TriviaGlobe
        pins={pins}
        cameraTarget={cameraTarget}
        successCountryId={successCountryId}
        interactive={isPlaying}
        isActive
      />

      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      <HudLayer>
        <HudAnchor position="top">
          <HudTopChrome
            onMenuOpen={() => setMenuOpen(true)}
            date={initialized ? dateSeed : undefined}
            stat={{
              label: "Score",
              value: completedResult?.score ?? score,
            }}
            secondaryStat={{
              label: "Day streak",
              value: calendarStreak.current,
            }}
            prompt={
              completedResult
                ? "You've played today's quiz."
                : quizPrompt
            }
            meta={
              isPlaying
                ? `Clue ${Math.min(currentClueIndex + 1, currentRound.clues.length)} of ${currentRound.clues.length}`
                : undefined
            }
            dateStale={dateStale}
            onDateRefresh={() => window.location.reload()}
            modeSwitcher={<ModeSwitcher />}
          />
        </HudAnchor>

        <HudSpacer />

        {toast && isPlaying && (
          <div
            className="pointer-events-none absolute inset-x-0 top-[calc(max(0.75rem,var(--safe-top))+4.5rem)] z-[12] flex justify-center px-3 sm:top-[calc(max(0.75rem,var(--safe-top))+3.5rem)]"
            role="status"
            aria-live="polite"
          >
            <div className="w-[min(100%,24rem)] rounded-lg border border-red-400/30 bg-[rgba(40,10,10,0.88)] px-4 py-3 text-center text-sm font-medium text-red-100 shadow-lg backdrop-blur-md">
              {toast}
            </div>
          </div>
        )}

        {isPlaying && (
          <GameOverlay
            score={score}
            lives={lives}
            currentClueIndex={currentClueIndex}
            clues={currentRound.clues}
            onNextClue={requestNextClue}
            onGuessSubmit={onGuessSubmit}
            disabled={false}
          />
        )}

        {showResultOverlay && completedResult && (
          <GameResultOverlay
            label="Quiz results"
            onClose={() => setResultsDismissed(true)}
          >
            <QuizDailyResult
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
