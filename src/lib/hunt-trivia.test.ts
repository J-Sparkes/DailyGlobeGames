import { describe, expect, it } from "vitest";
import { MAX_HUNT_GUESSES, buildShareGrid, scoreForGuess } from "@/lib/hunt-scoring";
import {
  getHuntTriviaFact,
  getHuntTriviaFactsForCountry,
} from "@/lib/hunt-trivia";

describe("hunt scoring (5 guesses)", () => {
  it("scores 5 down to 1 by guess number", () => {
    expect(scoreForGuess(1)).toBe(5);
    expect(scoreForGuess(3)).toBe(3);
    expect(scoreForGuess(5)).toBe(1);
    expect(scoreForGuess(6)).toBe(0);
  });

  it("builds a five-cell share grid", () => {
    expect(buildShareGrid(false, null)).toBe("⬜⬜⬜⬜⬜");
    expect(buildShareGrid(true, 3)).toBe("⬜⬜🟩⬜⬜");
  });
});

describe("hunt trivia", () => {
  it("returns non-empty curated facts for a tier-1 country", () => {
    const facts = getHuntTriviaFactsForCountry("japan");
    expect(facts.length).toBeGreaterThanOrEqual(MAX_HUNT_GUESSES);
    expect(facts.every((fact) => !fact.toLowerCase().includes("tokyo"))).toBe(
      true,
    );
  });

  it("never returns duplicate facts within a daily round", () => {
    const seen = new Set<string>();
    for (let i = 0; i < MAX_HUNT_GUESSES; i++) {
      const fact = getHuntTriviaFact("france", "2026-07-09", i);
      expect(seen.has(fact)).toBe(false);
      seen.add(fact);
    }
  });

  it("builds fallback facts for countries without curated entries", () => {
    const facts = getHuntTriviaFactsForCountry("slovakia");
    expect(facts.length).toBeGreaterThanOrEqual(MAX_HUNT_GUESSES);
  });
});
