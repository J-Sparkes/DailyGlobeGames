"use client";

import Fuse from "fuse.js";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { countries } from "@/lib/game-data";

const MAX_LIVES = 3;
const AUTOCOMPLETE_LIMIT = 6;
const MIN_AUTOCOMPLETE_CHARS = 2;

const countrySearchIndex = new Fuse(
  countries.flatMap((country) =>
    [country.name, country.mapName, ...country.aliases].map((label) => ({
      label,
      countryName: country.name,
    })),
  ),
  {
    keys: ["label"],
    threshold: 0.35,
    ignoreLocation: true,
    isCaseSensitive: false,
    minMatchCharLength: MIN_AUTOCOMPLETE_CHARS,
  },
);

function HeartIcon({ filled = true }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden
      className={filled ? "text-red-400" : "text-white/20"}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function LivesIndicator({ lives }) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${lives} ${lives === 1 ? "life" : "lives"} remaining`}
    >
      {Array.from({ length: MAX_LIVES }, (_, index) => (
        <HeartIcon key={index} filled={index < lives} />
      ))}
    </div>
  );
}

export function GameOverlay({
  clues,
  currentClueIndex,
  lives,
  score,
  onNextClue,
  onGuessSubmit,
  disabled = false,
}) {
  const listboxId = useId();
  const [guessInput, setGuessInput] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const clueNumber = Math.min(currentClueIndex + 1, clues.length);
  const activeClue = clues[Math.min(currentClueIndex, clues.length - 1)] ?? "";
  const onFinalClue = currentClueIndex >= clues.length - 1;

  const suggestions = useMemo(() => {
    const query = guessInput.trim();
    if (query.length < MIN_AUTOCOMPLETE_CHARS) return [];

    const seen = new Set();
    const matches = [];

    for (const result of countrySearchIndex.search(query, { limit: 12 })) {
      const name = result.item.countryName;
      if (seen.has(name)) continue;
      seen.add(name);
      matches.push(name);
      if (matches.length >= AUTOCOMPLETE_LIMIT) break;
    }

    return matches;
  }, [guessInput]);

  useEffect(() => {
    setActiveSuggestion(0);
  }, [suggestions]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setSuggestionsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const submitGuess = (value) => {
    const trimmed = value.trim();
    if (!trimmed || disabled || !onGuessSubmit) return;

    onGuessSubmit(trimmed);
    setGuessInput("");
    setSuggestionsOpen(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitGuess(guessInput);
  };

  const handleSuggestionSelect = (countryName) => {
    setGuessInput(countryName);
    submitGuess(countryName);
  };

  const handleInputKeyDown = (event) => {
    if (!suggestionsOpen || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((current) =>
        current + 1 >= suggestions.length ? 0 : current + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((current) =>
        current - 1 < 0 ? suggestions.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter" && suggestionsOpen) {
      event.preventDefault();
      handleSuggestionSelect(suggestions[activeSuggestion]);
      return;
    }

    if (event.key === "Escape") {
      setSuggestionsOpen(false);
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div
        className="pointer-events-auto fixed inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,var(--safe-bottom))] pl-[max(0.75rem,var(--safe-left))] pr-[max(0.75rem,var(--safe-right))] md:absolute md:inset-x-auto md:bottom-auto md:right-3 md:top-1/2 md:w-[min(100%,22rem)] md:-translate-y-1/2 md:px-0 md:pb-0"
      >
        <div className="rounded-2xl border border-white/10 bg-[rgba(8,12,18,0.72)] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl md:rounded-3xl md:p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
                Score
              </p>
              <p className="font-stat text-2xl font-semibold leading-none text-[var(--ui-text-primary)]">
                {score.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ui-text-muted)]">
                Lives
              </p>
              <LivesIndicator lives={lives} />
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-white/8 bg-white/5 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ui-accent-warm)]">
              Clue {clueNumber} of {clues.length}
            </p>
            <p className="mt-2 text-base leading-relaxed text-[var(--ui-text-primary)] md:text-[1.05rem]">
              {activeClue}
            </p>
          </div>

          <button
            type="button"
            onClick={onNextClue}
            disabled={disabled || onFinalClue}
            className="touch-target mb-4 w-full rounded-xl border border-[var(--ui-accent-primary)]/35 bg-[var(--ui-accent-primary)]/10 px-4 py-3 text-sm font-semibold text-[var(--ui-accent-primary)] transition hover:bg-[var(--ui-accent-primary)]/18 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-[var(--ui-text-muted)]"
          >
            Reveal Next Clue (−1000 points)
          </button>

          <form onSubmit={handleSubmit} ref={containerRef} className="relative">
            <label htmlFor="trivia-country-guess" className="sr-only">
              Guess a country
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                id="trivia-country-guess"
                type="text"
                role="combobox"
                aria-expanded={suggestionsOpen && suggestions.length > 0}
                aria-controls={listboxId}
                aria-autocomplete="list"
                value={guessInput}
                onChange={(event) => {
                  setGuessInput(event.target.value);
                  setSuggestionsOpen(true);
                }}
                onFocus={() => setSuggestionsOpen(true)}
                onKeyDown={handleInputKeyDown}
                placeholder="Search countries…"
                disabled={disabled}
                autoComplete="off"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[rgba(255,255,255,0.04)] px-3 py-3 text-sm text-[var(--ui-text-primary)] outline-none placeholder:text-[var(--ui-text-muted)] focus:border-[var(--ui-accent-primary)] disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={disabled || !guessInput.trim()}
                className="touch-target shrink-0 rounded-xl bg-[var(--ui-accent-primary)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Guess
              </button>
            </div>

            {suggestionsOpen && suggestions.length > 0 && (
              <ul
                id={listboxId}
                role="listbox"
                className="absolute inset-x-0 bottom-[calc(100%+0.5rem)] z-30 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[rgba(8,12,18,0.95)] py-1 shadow-[0_12px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl md:bottom-auto md:top-[calc(100%+0.5rem)]"
              >
                {suggestions.map((countryName, index) => (
                  <li key={countryName} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === activeSuggestion}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSuggestionSelect(countryName)}
                      className={`touch-target flex w-full px-3 py-2.5 text-left text-sm transition ${
                        index === activeSuggestion
                          ? "bg-[var(--ui-accent-primary)]/20 text-[var(--ui-text-primary)]"
                          : "text-[var(--ui-text-muted)] hover:bg-white/5 hover:text-[var(--ui-text-primary)]"
                      }`}
                    >
                      {countryName}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
