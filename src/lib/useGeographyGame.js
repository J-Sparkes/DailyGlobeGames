"use client";

import { useCallback, useEffect, useState } from "react";
import { getDateSeed } from "@/lib/daily-seed";
import { isUnlimitedPlaysEnabled } from "@/lib/daily-play";
import {
  getQuizCompletedForDate,
  getQuizProgressForDate,
  saveQuizProgress,
} from "@/lib/quiz-daily-play";

export const INITIAL_SCORE = 10000;
export const INITIAL_LIVES = 3;
export const WRONG_GUESS_PENALTY = 2000;
export const NEXT_CLUE_PENALTY = 1000;

const DEFAULT_STATE = {
  score: INITIAL_SCORE,
  lives: INITIAL_LIVES,
  currentClueIndex: 0,
  guesses: [],
  gameMode: "daily",
  gameState: "playing",
};

function normalizeCountryName(name) {
  return String(name ?? "").trim().toLowerCase();
}

function countriesMatch(guessedCountry, targetCountry) {
  return normalizeCountryName(guessedCountry) === normalizeCountryName(targetCountry);
}

function createBonusRoundState(previousGuesses) {
  return {
    score: INITIAL_SCORE,
    lives: INITIAL_LIVES,
    currentClueIndex: 0,
    guesses: previousGuesses,
    gameMode: "bonus",
    gameState: "playing",
  };
}

function readStoredState() {
  if (typeof window === "undefined") return DEFAULT_STATE;

  const date = getDateSeed();

  if (!isUnlimitedPlaysEnabled()) {
    const completed = getQuizCompletedForDate(date);
    if (completed) {
      return {
        ...DEFAULT_STATE,
        score: completed.score,
        guesses: completed.guesses,
        gameState: completed.won ? "won" : "lost",
      };
    }

    const progress = getQuizProgressForDate(date);
    if (progress) {
      return {
        score: progress.score,
        lives: progress.lives,
        currentClueIndex: progress.currentClueIndex,
        guesses: [...progress.guesses],
        gameMode: progress.gameMode,
        gameState: "playing",
      };
    }
  }

  return DEFAULT_STATE;
}

export function useGeographyGame() {
  const [state, setState] = useState(readStoredState);
  const [locked, setLocked] = useState(() => {
    if (typeof window === "undefined" || isUnlimitedPlaysEnabled()) return false;
    return Boolean(getQuizCompletedForDate(getDateSeed()));
  });

  useEffect(() => {
    if (locked || state.gameState !== "playing" || isUnlimitedPlaysEnabled()) return;

    saveQuizProgress({
      date: getDateSeed(),
      score: state.score,
      lives: state.lives,
      currentClueIndex: state.currentClueIndex,
      guesses: state.guesses,
      gameMode: state.gameMode,
    });
  }, [locked, state]);

  const handleGuess = useCallback((guessedCountry, targetCountry) => {
    if (locked) return;

    setState((previous) => {
      if (previous.gameState !== "playing") return previous;

      const nextGuesses = [...previous.guesses, guessedCountry];

      if (countriesMatch(guessedCountry, targetCountry)) {
        if (previous.gameMode === "daily") {
          return createBonusRoundState(nextGuesses);
        }

        return {
          ...previous,
          guesses: nextGuesses,
          gameState: "won",
        };
      }

      const nextLives = previous.lives - 1;
      const nextScore = Math.max(0, previous.score - WRONG_GUESS_PENALTY);

      return {
        ...previous,
        guesses: nextGuesses,
        score: nextScore,
        lives: Math.max(0, nextLives),
        gameState: nextLives <= 0 ? "lost" : previous.gameState,
      };
    });
  }, [locked]);

  const requestNextClue = useCallback(() => {
    if (locked) return;

    setState((previous) => {
      if (previous.gameState !== "playing") return previous;

      return {
        ...previous,
        score: Math.max(0, previous.score - NEXT_CLUE_PENALTY),
        currentClueIndex: previous.currentClueIndex + 1,
      };
    });
  }, [locked]);

  const resetForUnlimitedReplay = useCallback(() => {
    setLocked(false);
    setState(DEFAULT_STATE);
  }, []);

  return {
    score: state.score,
    lives: state.lives,
    currentClueIndex: state.currentClueIndex,
    guesses: state.guesses,
    gameMode: state.gameMode,
    gameState: state.gameState,
    locked,
    handleGuess,
    requestNextClue,
    resetForUnlimitedReplay,
  };
}
