"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DailyResult } from "@/components/game/DailyResult";
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
import { SweepGlobeBridge } from "@/components/game/GlobeBridge";
import { ModeSwitcher } from "@/components/game/ModeSwitcher";
import { GameMenu } from "@/components/menu/GameMenu";
import { isCorrectAnswer } from "@/lib/answer-check";
import { getFrontierCountryIds, loadBorderGraph } from "@/lib/border-graph";
import {
  clearDailyStorage,
  createInitialProgress,
  getCompletedResultForDate,
  getProgressForDate,
  isUnlimitedPlaysEnabled,
  saveCompletedResult,
  saveProgress,
  type CompletedDailyResult,
  type GamePhase,
} from "@/lib/daily-play";
import { saveBlitzCompletedResult, getBlitzCompletedForDate } from "@/lib/blitz-daily-play";
import { isSweepDeadEnd, sanitizeSweepProgress } from "@/lib/sweep-progress";
import { resolveCountry } from "@/lib/country-resolve";
import { fetchSweepDaily, submitSweepResult } from "@/lib/api/client";
import { recordDailyComplete } from "@/lib/retention-events";
import { useDailyDate } from "@/lib/use-daily-date";
import { useRetention } from "@/lib/use-retention";
import {
  EMPTY_STRING_SET,
  setFromArrayStable,
} from "@/lib/globe-constants";
import { isTouchDevice } from "@/lib/device";
import { appendGameHistory } from "@/lib/profile-storage";
import { appendGuestBlitzHistory } from "@/lib/guest-history";
import { playCorrectGuessSound, playWrongGuessSound, primeAudio } from "@/lib/sounds";
import { useVisualViewportInset } from "@/lib/use-visual-viewport-inset";
import { shouldFinishSweepSuccess } from "@/lib/sweep-finish";
import { canSelectFrontierCountry } from "@/lib/sweep-select";
import { shouldAcceptSweepSubmit } from "@/lib/sweep-submit";
import { useDailyDateRollover } from "@/lib/use-daily-date-rollover";
import { isNewMilestone, triggerHaptic } from "@/lib/game-feedback";
import { BlitzTimer } from "@/components/game/BlitzTimer";
import { BLITZ_BONUS_SECONDS } from "@/lib/blitz-timer";
import {
  isSweepBlitzMode,
  type SweepGameMode,
} from "@/lib/sweep-game-mode";
import { useBlitzTimer } from "@/lib/use-blitz-timer";

export function GeographyGame({
  gameMode = "sweep",
}: {
  gameMode?: SweepGameMode;
}) {
  const isBlitz = isSweepBlitzMode(gameMode);
  const [dailyStartId, setDailyStartId] = useState<string | null>(null);
  const dateSeed = useDailyDate();
  const { calendarStreak } = useRetention();
  const unlimited = isUnlimitedPlaysEnabled();
  const isTouch = useMemo(
    () => (typeof window !== "undefined" ? isTouchDevice() : false),
    [],
  );

  const [initialized, setInitialized] = useState(false);
  const [completedResult, setCompletedResult] =
    useState<CompletedDailyResult | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [phase, setPhase] = useState<GamePhase>("naming");
  const [targetId, setTargetId] = useState("");
  const [clickableIds, setClickableIds] = useState<Set<string>>(new Set());
  const [gameOver, setGameOver] = useState<CompletedDailyResult | null>(null);
  const [guess, setGuess] = useState("");
  const [inputError, setInputError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [flashSuccessId, setFlashSuccessId] = useState<string | null>(null);
  const [flashInvalidId, setFlashInvalidId] = useState<string | null>(null);
  const [streakPop, setStreakPop] = useState(false);
  const [milestoneBurst, setMilestoneBurst] = useState(false);
  const [inputSuccess, setInputSuccess] = useState(false);
  const [resultsDismissed, setResultsDismissed] = useState(false);
  const [blitzBonusPulse, setBlitzBonusPulse] = useState(false);
  const [pendingGameOver, setPendingGameOver] = useState<{
    path: string[];
    failedGuess: string;
    targetCountryId: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const gameOverTimerRef = useRef<number | null>(null);
  const phaseRef = useRef<GamePhase>("naming");
  const sweepCompletedRef = useRef(false);
  const claimedIdsRef = useRef(claimedIds);
  const targetIdRef = useRef(targetId);
  const keyboardInset = useVisualViewportInset();
  const dateStale = useDailyDateRollover(dateSeed);

  useEffect(() => {
    claimedIdsRef.current = claimedIds;
  }, [claimedIds]);

  useEffect(() => {
    targetIdRef.current = targetId;
  }, [targetId]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const finishGame = useCallback(
    (path: string[], failedGuess: string, targetCountryId: string) => {
      const result: CompletedDailyResult = {
        date: dateSeed,
        path,
        failedGuess,
        targetCountryId,
        streak: path.length,
      };
      if (isBlitz) {
        saveBlitzCompletedResult(result);
        appendGuestBlitzHistory(result);
      } else {
        saveCompletedResult(result);
        appendGameHistory(result);
      }
      recordDailyComplete(isBlitz ? "blitz" : "sweep", result.streak);
      setGameOver(result);
      void submitSweepResult({
        date: dateSeed,
        path,
        failedGuess,
        targetCountryId,
      });
      if (!unlimited) {
        setCompletedResult(result);
      }
    },
    [dateSeed, isBlitz, unlimited],
  );

  const handleBlitzExpire = useCallback(() => {
    if (gameOver || completedResult || pendingGameOver) return;
    finishGame(claimedIdsRef.current, "", targetIdRef.current);
  }, [finishGame, gameOver, completedResult, pendingGameOver]);

  const blitzActive =
    isBlitz &&
    initialized &&
    mapReady &&
    !completedResult &&
    !gameOver &&
    !pendingGameOver &&
    Boolean(dailyStartId) &&
    claimedIds.length > 0;

  const { seconds: blitzSeconds, addBonus: addBlitzBonus } = useBlitzTimer({
    active: blitzActive,
    onExpire: handleBlitzExpire,
  });

  const finishSweepSuccess = useCallback(
    (path: string[]) => {
      if (!shouldFinishSweepSuccess(sweepCompletedRef.current)) return;
      sweepCompletedRef.current = true;

      const result: CompletedDailyResult = {
        date: dateSeed,
        path,
        failedGuess: "",
        targetCountryId: path.at(-1) ?? dailyStartId ?? "",
        streak: path.length,
      };
      if (isBlitz) {
        saveBlitzCompletedResult(result);
        appendGuestBlitzHistory(result);
      } else {
        saveCompletedResult(result);
        appendGameHistory(result);
      }
      recordDailyComplete(isBlitz ? "blitz" : "sweep", result.streak);
      setCompletedResult(result);
      void submitSweepResult({
        date: dateSeed,
        path,
        failedGuess: "",
        targetCountryId: path.at(-1) ?? dailyStartId ?? "",
      });
    },
    [dateSeed, dailyStartId, isBlitz],
  );

  useEffect(() => {
    return () => {
      if (gameOverTimerRef.current !== null) {
        window.clearTimeout(gameOverTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setResultsDismissed(false);
  }, [completedResult, gameOver]);

  useEffect(() => {
    if (!pendingGameOver) return;

    playWrongGuessSound();
    setInputError(true);
    triggerHaptic("error");

    gameOverTimerRef.current = window.setTimeout(() => {
      finishGame(
        pendingGameOver.path,
        pendingGameOver.failedGuess,
        pendingGameOver.targetCountryId,
      );
      setPendingGameOver(null);
      gameOverTimerRef.current = null;
    }, 450);

    return () => {
      if (gameOverTimerRef.current !== null) {
        window.clearTimeout(gameOverTimerRef.current);
        gameOverTimerRef.current = null;
      }
    };
  }, [pendingGameOver, finishGame]);

  useEffect(() => {
    let cancelled = false;
    void fetchSweepDaily(dateSeed)
      .then((daily) => {
        if (cancelled) return;
        setDailyStartId(daily.startCountryId);
        setTargetId((current) => current || daily.startCountryId);
      })
      .catch(() => {
        // Fallback if API unavailable during dev
      });
    return () => {
      cancelled = true;
    };
  }, [dateSeed]);

  useEffect(() => {
    if (!dailyStartId) return;

    setCompletedResult(null);
    setGameOver(null);
    setPendingGameOver(null);
    setClaimedIds([]);
    setPhase("naming");
    setGuess("");
    setInputError(false);
    sweepCompletedRef.current = false;

    const completed = isBlitz
      ? getBlitzCompletedForDate(dateSeed)
      : getCompletedResultForDate(dateSeed);
    if (completed) {
      setCompletedResult(completed);
      setInitialized(true);
      return;
    }

    const progress = getProgressForDate(dateSeed);
    if (progress) {
      const sanitized = sanitizeSweepProgress(progress, dailyStartId);
      setClaimedIds(sanitized.claimedIds);
      setPhase(sanitized.phase);
      setTargetId(sanitized.targetId);
      if (
        sanitized.phase !== progress.phase ||
        sanitized.targetId !== progress.targetId ||
        sanitized.dailyCountryId !== progress.dailyCountryId ||
        sanitized.claimedIds.length !== progress.claimedIds.length ||
        sanitized.claimedIds.some((id, index) => id !== progress.claimedIds[index])
      ) {
        saveProgress(sanitized);
      }
    } else if (!unlimited) {
      saveProgress(createInitialProgress(dailyStartId, dateSeed));
      setTargetId(dailyStartId);
    }

    setInitialized(true);
  }, [dailyStartId, unlimited, dateSeed, isBlitz]);

  useEffect(() => {
    loadBorderGraph().then(() => setMapReady(true));
  }, []);

  useEffect(() => {
    if (!initialized || completedResult || gameOver || unlimited) return;

    saveProgress({
      date: dateSeed,
      dailyCountryId: dailyStartId ?? "",
      claimedIds,
      phase,
      targetId,
    });
  }, [
    initialized,
    completedResult,
    gameOver,
    dateSeed,
    dailyStartId,
    claimedIds,
    phase,
    targetId,
    unlimited,
  ]);

  useEffect(() => {
    if (
      !mapReady ||
      claimedIds.length === 0 ||
      gameOver ||
      completedResult
    ) {
      setClickableIds(EMPTY_STRING_SET);
      return;
    }

    const frontier = getFrontierCountryIds(claimedIds);

    if (phase === "selecting") {
      if (isSweepDeadEnd(phase, claimedIds, frontier)) {
        finishSweepSuccess(claimedIds);
        return;
      }
      setClickableIds((prev) => setFromArrayStable(prev, frontier));
      return;
    }

    if (phase === "naming" && !claimedIds.includes(targetId)) {
      setClickableIds((prev) => setFromArrayStable(prev, frontier));
      return;
    }

    setClickableIds(EMPTY_STRING_SET);
  }, [
    mapReady,
    phase,
    targetId,
    claimedIds,
    gameOver,
    completedResult,
    finishSweepSuccess,
  ]);

  const claimedSet = useMemo(() => new Set(claimedIds), [claimedIds]);

  const displayClaimedIds = useMemo(() => {
    if (completedResult && !gameOver) {
      return new Set(completedResult.path);
    }
    return claimedSet;
  }, [completedResult, gameOver, claimedSet]);

  const connectingIds = useMemo(() => {
    if (
      claimedIds.length === 0 ||
      gameOver ||
      completedResult
    ) {
      return EMPTY_STRING_SET;
    }
    return new Set(getFrontierCountryIds(claimedIds));
  }, [claimedIds, gameOver, completedResult]);

  const targetCountry = resolveCountry(targetId);

  const prompt =
    phase === "naming"
      ? claimedIds.length === 0
        ? isBlitz
          ? "Name the highlighted country to start the clock."
          : "Name the highlighted country to begin today's sweep."
        : isBlitz
          ? "Name the country, or tap a neighbor to switch. +3s per correct guess."
          : "Name the highlighted country, or tap another neighbor to switch."
      : isBlitz
        ? "Tap a neighbor, then name it. Correct guesses add 3 seconds."
        : "Tap a neighbor to select — tap another to switch — then name it.";

  const controlHint = isTouch
    ? "Swipe to spin · pinch to zoom"
    : "Drag to spin · scroll to zoom";

  const liveMessage = useMemo(() => {
    if (gameOver) return "Game over.";
    if (completedResult) return "Today's sweep complete.";
    if (phase === "naming") {
      return claimedIds.length === 0
        ? "Name the highlighted country to begin today's sweep."
        : "Name the highlighted country, or tap another neighbor to switch.";
    }
    return "Tap a neighbor to select — tap another to switch — then name it.";
  }, [gameOver, completedResult, phase, claimedIds.length]);

  const handlePlayAgain = useCallback(() => {
    clearDailyStorage();
    setGameOver(null);
    setCompletedResult(null);
    setPendingGameOver(null);
    setClaimedIds([]);
    setPhase("naming");
    phaseRef.current = "naming";
    sweepCompletedRef.current = false;
    setTargetId(dailyStartId ?? "");
    setGuess("");
    setInputError(false);
    setClickableIds(new Set());
    setBlitzBonusPulse(false);
  }, [dailyStartId]);

  const onCorrectCountryGuess = useCallback(() => {
    playCorrectGuessSound();
    const prevLength = claimedIds.length;
    const nextClaimed = [...claimedIds, targetId];
    const nextLength = nextClaimed.length;
    setClaimedIds(nextClaimed);
    setGuess("");
    setInputError(false);
    setFlashSuccessId(targetId);
    setInputSuccess(true);
    window.setTimeout(() => setInputSuccess(false), 400);

    if (isNewMilestone(prevLength, nextLength)) {
      setMilestoneBurst(true);
      triggerHaptic("milestone");
      window.setTimeout(() => setMilestoneBurst(false), 600);
    } else {
      setStreakPop(true);
      triggerHaptic("success");
      window.setTimeout(() => setStreakPop(false), 500);
    }

    window.setTimeout(() => setFlashSuccessId(null), 700);

    if (isBlitz && prevLength > 0) {
      addBlitzBonus(BLITZ_BONUS_SECONDS);
      setBlitzBonusPulse(true);
      window.setTimeout(() => setBlitzBonusPulse(false), 400);
    }

    setPhase("selecting");
  }, [claimedIds, targetId, isBlitz, addBlitzBonus]);

  const handleSubmit = useCallback(
    (event?: React.FormEvent) => {
      event?.preventDefault();
      if (
        gameOver ||
        completedResult ||
        pendingGameOver ||
        phase !== "naming" ||
        !targetCountry ||
        !shouldAcceptSweepSubmit(guess, phase, Boolean(pendingGameOver))
      ) {
        return;
      }

      if (isCorrectAnswer(guess, targetCountry)) {
        onCorrectCountryGuess();
        return;
      }

      if (pendingGameOver) return;
      setPendingGameOver({
        path: claimedIds,
        failedGuess: guess,
        targetCountryId: targetId,
      });
    },
    [
      gameOver,
      completedResult,
      phase,
      targetCountry,
      guess,
      claimedIds,
      targetId,
      pendingGameOver,
      onCorrectCountryGuess,
    ],
  );

  const handleInvalidCountryClick = useCallback((countryId: string) => {
    setFlashInvalidId(countryId);
    window.setTimeout(() => setFlashInvalidId(null), 350);
  }, []);

  const handleCountryClick = useCallback(
    (countryId: string) => {
      if (gameOver || completedResult) return;
      if (!clickableIds.has(countryId)) return;
      if (
        !canSelectFrontierCountry(phaseRef.current, targetId, claimedIds)
      ) {
        return;
      }
      if (phaseRef.current === "naming" && countryId === targetId) return;

      phaseRef.current = "naming";
      setTargetId(countryId);
      setPhase("naming");
      setGuess("");
      setInputError(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [gameOver, completedResult, clickableIds, targetId, claimedIds],
  );

  const showGlobe = mapReady && initialized;

  const sweepGlobeProps = useMemo(
    () =>
      showGlobe
        ? {
            claimedIds: displayClaimedIds,
            dailyCountryId: dailyStartId,
            highlightId:
              gameOver || completedResult
                ? null
                : phase === "naming"
                  ? targetId
                  : null,
            clickableIds:
              gameOver || completedResult ? EMPTY_STRING_SET : clickableIds,
            connectingIds:
              gameOver || completedResult ? EMPTY_STRING_SET : connectingIds,
            interactive: !gameOver && !completedResult,
            flashSuccessId,
            flashInvalidId,
            onCountryClick: handleCountryClick,
            onInvalidCountryClick: handleInvalidCountryClick,
          }
        : null,
    [
      showGlobe,
      displayClaimedIds,
      dailyStartId,
      gameOver,
      completedResult,
      phase,
      targetId,
      clickableIds,
      connectingIds,
      flashSuccessId,
      flashInvalidId,
      handleCountryClick,
      handleInvalidCountryClick,
    ],
  );

  return (
    <div className="relative h-full w-full pointer-events-none">
      <SweepGlobeBridge props={sweepGlobeProps} />
      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {!showGlobe && (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center bg-black text-sm text-slate-400">
          {!initialized || !mapReady ? "Loading…" : null}
        </div>
      )}

      {flashSuccessId && (
        <div className="pointer-events-none absolute inset-0 z-[5] success-flash" />
      )}

      {pendingGameOver && (
        <div className="pointer-events-none absolute inset-0 z-[5] error-vignette" />
      )}

      <GameLiveRegion message={liveMessage} />

      <HudLayer>
        <HudAnchor position="top">
          <HudTopChrome
            onMenuOpen={() => setMenuOpen(true)}
            date={
              initialized && !completedResult && !gameOver ? dateSeed : undefined
            }
            stat={{
              label: "Streak",
              value: completedResult?.streak ?? claimedIds.length,
              pop: streakPop,
              burst: milestoneBurst,
            }}
            secondaryStat={{
              label: "Day streak",
              value: calendarStreak.current,
            }}
            prompt={
              initialized && !completedResult && !gameOver ? prompt : undefined
            }
            meta={
              initialized && !completedResult && !gameOver
                ? controlHint
                : undefined
            }
            dateStale={dateStale}
            onDateRefresh={() => window.location.reload()}
            modeSwitcher={<ModeSwitcher />}
            topExtra={
              isBlitz && initialized && !completedResult && !gameOver ? (
                <div className="flex justify-end border-t border-[var(--ui-border-subtle)] px-3 py-2">
                  <BlitzTimer
                    seconds={blitzSeconds}
                    pulse={blitzBonusPulse}
                    running={blitzActive}
                  />
                </div>
              ) : undefined
            }
          />
        </HudAnchor>

        <HudSpacer />

        <HudAnchor
          position="bottom"
          keyboardInset={keyboardInset}
          reserveMobileInstruction={
            initialized &&
            !completedResult &&
            !gameOver &&
            phase === "naming" &&
            mapReady
          }
        >
          {!gameOver && !completedResult && phase === "naming" && mapReady && (
            <HudPanel>
              <form
                onSubmit={handleSubmit}
                className={`flex gap-2 ${pendingGameOver ? "input-lockout" : ""}`}
              >
                <input
                  ref={inputRef}
                  id="country-guess"
                  type="text"
                  inputMode="text"
                  enterKeyHint="go"
                  value={guess}
                  onChange={(e) => {
                    setGuess(e.target.value);
                    setInputError(false);
                  }}
                  onFocus={primeAudio}
                  placeholder="Country name…"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  autoFocus={!isTouch}
                  disabled={Boolean(pendingGameOver)}
                  aria-label="Country name"
                  className={`min-h-11 flex-1 rounded-lg border bg-[var(--ui-surface-raised)] px-3 py-2 text-base text-[var(--ui-text-primary)] placeholder:text-[var(--ui-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--ui-accent-primary)_60%,transparent)] ${
                    inputError
                      ? "border-[color-mix(in_srgb,var(--ui-error)_60%,transparent)] shake"
                      : "border-[var(--ui-border-subtle)]"
                  } ${inputSuccess ? "input-success-pop" : ""}`}
                />
                <button
                  type="submit"
                  disabled={!guess.trim() || Boolean(pendingGameOver)}
                  className="touch-target btn-primary min-h-11 shrink-0 rounded-lg px-4 py-2 text-sm font-semibold"
                >
                  Go
                </button>
              </form>
            </HudPanel>
          )}
        </HudAnchor>

        <HudMobileInstruction
          primary={prompt}
          secondary={controlHint}
          visible={initialized && !completedResult && !gameOver}
        />

        {completedResult && !gameOver && !resultsDismissed && (
          <GameResultOverlay
            label="Sweep results"
            onClose={() => setResultsDismissed(true)}
          >
            <DailyResult
              result={completedResult}
              variant="already-played"
              layout="overlay"
              onPlayAgain={unlimited ? handlePlayAgain : undefined}
            />
          </GameResultOverlay>
        )}

        {gameOver && !resultsDismissed && (
          <GameResultOverlay
            label="Sweep game over"
            onClose={() => setResultsDismissed(true)}
          >
            <DailyResult
              result={gameOver}
              variant="game-over"
              layout="overlay"
              animateReveal
              onPlayAgain={unlimited ? handlePlayAgain : undefined}
            />
          </GameResultOverlay>
        )}
      </HudLayer>
    </div>
  );
}
