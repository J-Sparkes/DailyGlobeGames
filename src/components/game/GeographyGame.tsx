"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DailyResult } from "@/components/game/DailyResult";
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
import { SweepGlobeBridge } from "@/components/game/GlobeBridge";
import { ModeSwitcher } from "@/components/game/ModeSwitcher";
import { GameMenu } from "@/components/menu/GameMenu";
import { isCorrectAnswer } from "@/lib/answer-check";
import { getFrontierCountryIds, loadBorderGraph } from "@/lib/border-graph";
import {
  clearDailyStorage,
  createInitialProgress,
  getCompletedResultForToday,
  getProgressForToday,
  isUnlimitedPlaysEnabled,
  saveCompletedResult,
  saveProgress,
  type CompletedDailyResult,
  type GamePhase,
} from "@/lib/daily-play";
import { isSweepDeadEnd, sanitizeSweepProgress } from "@/lib/sweep-progress";
import { resolveCountry } from "@/lib/country-resolve";
import { getDateSeed, pickDailyCountry } from "@/lib/daily-seed";
import {
  EMPTY_STRING_SET,
  setFromArrayStable,
} from "@/lib/globe-constants";
import { isTouchDevice } from "@/lib/device";
import { getDailyPool } from "@/lib/game-data";
import { appendGameHistory } from "@/lib/profile-storage";
import { playCorrectGuessSound, playWrongGuessSound, primeAudio } from "@/lib/sounds";
import { useVisualViewportInset } from "@/lib/use-visual-viewport-inset";
import { loadCountryFeatures } from "@/lib/world-geographies";

export function GeographyGame() {
  const dailyCountry = useMemo(
    () => pickDailyCountry(getDailyPool()),
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
    useState<CompletedDailyResult | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const [phase, setPhase] = useState<GamePhase>("naming");
  const [targetId, setTargetId] = useState(dailyCountry.id);
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
  const keyboardInset = useVisualViewportInset();

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
      setGameOver(result);
      if (!unlimited) {
        setCompletedResult(result);
      }
    },
    [dateSeed, unlimited],
  );

  const finishSweepSuccess = useCallback(
    (path: string[]) => {
      const result: CompletedDailyResult = {
        date: dateSeed,
        path,
        failedGuess: "",
        targetCountryId: path.at(-1) ?? dailyCountry.id,
        streak: path.length,
      };
      saveCompletedResult(result);
      appendGameHistory(result);
      if (!unlimited) {
        setCompletedResult(result);
      }
    },
    [dateSeed, dailyCountry.id, unlimited],
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
    const completed = getCompletedResultForToday();
    if (completed) {
      setCompletedResult(completed);
      setInitialized(true);
      return;
    }

    const progress = getProgressForToday();
    if (progress) {
      const sanitized = sanitizeSweepProgress(progress, dailyCountry.id);
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
      saveProgress(createInitialProgress(dailyCountry.id));
    }

    setInitialized(true);
  }, [dailyCountry.id, unlimited]);

  useEffect(() => {
    Promise.all([loadCountryFeatures(), loadBorderGraph()]).then(() =>
      setMapReady(true),
    );
  }, []);

  useEffect(() => {
    if (!initialized || completedResult || gameOver || unlimited) return;

    saveProgress({
      date: dateSeed,
      dailyCountryId: dailyCountry.id,
      claimedIds,
      phase,
      targetId,
    });
  }, [
    initialized,
    completedResult,
    gameOver,
    dateSeed,
    dailyCountry.id,
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

  const handlePlayAgain = useCallback(() => {
    clearDailyStorage();
    setGameOver(null);
    setCompletedResult(null);
    setPendingGameOver(null);
    setClaimedIds([]);
    setPhase("naming");
    setTargetId(dailyCountry.id);
    setGuess("");
    setInputError(false);
    setClickableIds(new Set());
  }, [dailyCountry.id]);

  const handleSubmit = useCallback(
    (event?: React.FormEvent) => {
      event?.preventDefault();
      if (gameOver || completedResult || pendingGameOver || phase !== "naming" || !targetCountry) {
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
      if (gameOver || completedResult || phase !== "selecting") return;
      if (!clickableIds.has(countryId)) return;

      setTargetId(countryId);
      setPhase("naming");
      setGuess("");
      setInputError(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    },
    [gameOver, completedResult, phase, clickableIds],
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
    <div className="relative h-full w-full overflow-hidden bg-transparent">
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

      <HudLayer>
        <HudAnchor position="top">
          <HudPanel>
            <HudToolbar
              onMenuOpen={() => setMenuOpen(true)}
              stat={{
                label: "Streak",
                value: completedResult?.streak ?? claimedIds.length,
                pop: streakPop,
              }}
              badge={
                initialized && !completedResult && !gameOver ? (
                  <HudBadge>{dateSeed}</HudBadge>
                ) : undefined
              }
            >
              <ModeSwitcher />
            </HudToolbar>

            {initialized && !completedResult && !gameOver && (
              <>
                <HudPrompt>{prompt}</HudPrompt>
                <HudMeta>{controlHint}</HudMeta>
              </>
            )}

            {unlimited && (
              <p className="mt-1 text-[10px] text-amber-200/90">
                Test mode
              </p>
            )}
          </HudPanel>
        </HudAnchor>

        <HudSpacer />

        <HudAnchor position="bottom" keyboardInset={keyboardInset}>
          {completedResult && !gameOver && (
            <HudScroll>
              <DailyResult
                result={completedResult}
                variant="already-played"
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
                  className={`min-h-10 flex-1 rounded-lg border bg-black/50 px-3 py-2 text-base text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60 ${
                    inputError
                      ? "border-red-500/60 shake"
                      : "border-white/15"
                  }`}
                />
                <button
                  type="submit"
                  disabled={!guess.trim()}
                  className="touch-target min-h-10 shrink-0 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
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
                onPlayAgain={unlimited ? handlePlayAgain : undefined}
              />
            </HudScroll>
          )}
        </HudAnchor>
      </HudLayer>
    </div>
  );
}
