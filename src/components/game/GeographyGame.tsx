"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DailyResult } from "@/components/game/DailyResult";
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
import { playCorrectGuessSound, playWrongGuessSound, primeAudio } from "@/lib/sounds";
import { useVisualViewportInset } from "@/lib/use-visual-viewport-inset";
import { shouldFinishSweepSuccess } from "@/lib/sweep-finish";
import { canSelectFrontierCountry } from "@/lib/sweep-select";
import { shouldAcceptSweepSubmit } from "@/lib/sweep-submit";
import { useDailyDateRollover } from "@/lib/use-daily-date-rollover";

export function GeographyGame() {
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
  const [pendingGameOver, setPendingGameOver] = useState<{
    path: string[];
    failedGuess: string;
    targetCountryId: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const gameOverTimerRef = useRef<number | null>(null);
  const phaseRef = useRef<GamePhase>("naming");
  const selectionLockRef = useRef(false);
  const sweepCompletedRef = useRef(false);
  const keyboardInset = useVisualViewportInset();
  const dateStale = useDailyDateRollover(dateSeed);

  useEffect(() => {
    phaseRef.current = phase;
    if (phase === "selecting") {
      selectionLockRef.current = false;
    }
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
      saveCompletedResult(result);
      appendGameHistory(result);
      recordDailyComplete("sweep", result.streak);
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
    [dateSeed, unlimited],
  );

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
      saveCompletedResult(result);
      appendGameHistory(result);
      recordDailyComplete("sweep", result.streak);
      setCompletedResult(result);
      void submitSweepResult({
        date: dateSeed,
        path,
        failedGuess: "",
        targetCountryId: path.at(-1) ?? dailyStartId ?? "",
      });
    },
    [dateSeed, dailyStartId],
  );

  useEffect(() => {
    return () => {
      if (gameOverTimerRef.current !== null) {
        window.clearTimeout(gameOverTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!pendingGameOver) return;

    playWrongGuessSound();
    setInputError(true);

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

    const completed = getCompletedResultForDate(dateSeed);
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
  }, [dailyStartId, unlimited, dateSeed]);

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
      phase !== "selecting" ||
      claimedIds.length === 0 ||
      gameOver ||
      completedResult
    ) {
      setClickableIds(EMPTY_STRING_SET);
      return;
    }

    const frontier = getFrontierCountryIds(claimedIds);
    if (isSweepDeadEnd(phase, claimedIds, frontier)) {
      finishSweepSuccess(claimedIds);
      return;
    }

    setClickableIds((prev) => setFromArrayStable(prev, frontier));
  }, [
    mapReady,
    phase,
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

  const targetCountry = resolveCountry(targetId);

  const prompt =
    phase === "naming"
      ? claimedIds.length === 0
        ? "Name the highlighted country to begin today's sweep."
        : "Name the country you selected."
      : "Tap a glowing neighbor on the globe, then name it.";

  const controlHint = isTouch
    ? "Swipe to spin · pinch to zoom"
    : "Drag to spin · scroll to zoom";

  const liveMessage = useMemo(() => {
    if (gameOver) return "Game over.";
    if (completedResult) return "Today's sweep complete.";
    if (phase === "naming") {
      return claimedIds.length === 0
        ? "Name the highlighted country to begin today's sweep."
        : "Name the country you selected.";
    }
    return "Tap a glowing neighbor on the globe, then name it.";
  }, [gameOver, completedResult, phase, claimedIds.length]);

  const handlePlayAgain = useCallback(() => {
    clearDailyStorage();
    setGameOver(null);
    setCompletedResult(null);
    setPendingGameOver(null);
    setClaimedIds([]);
    setPhase("naming");
    phaseRef.current = "naming";
    selectionLockRef.current = false;
    sweepCompletedRef.current = false;
    setTargetId(dailyStartId ?? "");
    setGuess("");
    setInputError(false);
    setClickableIds(new Set());
  }, [dailyStartId]);

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
        playCorrectGuessSound();
        const nextClaimed = [...claimedIds, targetId];
        setClaimedIds(nextClaimed);
        setGuess("");
        setInputError(false);
        setFlashSuccessId(targetId);
        setStreakPop(true);
        window.setTimeout(() => setFlashSuccessId(null), 700);
        window.setTimeout(() => setStreakPop(false), 500);
        setPhase("selecting");
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
    ],
  );

  const handleInvalidCountryClick = useCallback((countryId: string) => {
    setFlashInvalidId(countryId);
    window.setTimeout(() => setFlashInvalidId(null), 350);
  }, []);

  const handleCountryClick = useCallback(
    (countryId: string) => {
      if (gameOver || completedResult || selectionLockRef.current) return;
      if (!canSelectFrontierCountry(phaseRef.current, selectionLockRef.current)) {
        return;
      }
      if (!clickableIds.has(countryId)) return;

      selectionLockRef.current = true;
      phaseRef.current = "naming";
      setTargetId(countryId);
      setPhase("naming");
      setGuess("");
      setInputError(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [gameOver, completedResult, clickableIds],
  );

  const showGlobe = mapReady && initialized;

  const sweepGlobeProps = useMemo(
    () =>
      showGlobe
        ? {
            claimedIds: displayClaimedIds,
            highlightId:
              gameOver || completedResult
                ? null
                : phase === "naming"
                  ? targetId
                  : null,
            clickableIds:
              gameOver || completedResult ? EMPTY_STRING_SET : clickableIds,
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
      gameOver,
      completedResult,
      phase,
      targetId,
      clickableIds,
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
          {dateStale && (
            <DailyDateStaleBanner onRefresh={() => window.location.reload()} />
          )}
          <HudPanel>
            <HudToolbar
              onMenuOpen={() => setMenuOpen(true)}
              date={
                initialized && !completedResult && !gameOver
                  ? dateSeed
                  : undefined
              }
              stat={{
                label: "Streak",
                value: completedResult?.streak ?? claimedIds.length,
                pop: streakPop,
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
            >
              <ModeSwitcher />
            </HudToolbar>
          </HudPanel>
        </HudAnchor>

        <HudSpacer />

        <HudAnchor position="bottom" keyboardInset={keyboardInset}>
          {completedResult && !gameOver && (
            <HudScroll>
              <DailyResult
                result={completedResult}
                variant="already-played"
                onPlayAgain={unlimited ? handlePlayAgain : undefined}
              />
            </HudScroll>
          )}

          {!gameOver && !completedResult && phase === "naming" && mapReady && (
            <HudPanel>
              <form onSubmit={handleSubmit} className="flex gap-2">
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
                  aria-label="Country name"
                  className={`min-h-11 flex-1 rounded-lg border bg-[var(--ui-surface-raised)] px-3 py-2 text-base text-[var(--ui-text-primary)] placeholder:text-[var(--ui-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--ui-accent-primary)_60%,transparent)] ${
                    inputError
                      ? "border-[color-mix(in_srgb,var(--ui-error)_60%,transparent)] shake"
                      : "border-[var(--ui-border-subtle)]"
                  }`}
                />
                <button
                  type="submit"
                  disabled={!guess.trim()}
                  className="touch-target btn-primary min-h-11 shrink-0 rounded-lg px-4 py-2 text-sm font-semibold"
                >
                  Go
                </button>
              </form>
            </HudPanel>
          )}

          {gameOver && (
            <HudScroll>
              <DailyResult
                result={gameOver}
                variant="game-over"
                animateReveal
                onPlayAgain={unlimited ? handlePlayAgain : undefined}
              />
            </HudScroll>
          )}
        </HudAnchor>
      </HudLayer>
    </div>
  );
}
