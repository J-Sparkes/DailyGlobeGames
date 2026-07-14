import { describe, expect, it } from "vitest";
import { countries } from "@/lib/game-data";
import { getDailyTrivia, getTriviaCountryPool } from "@/lib/daily-trivia";

describe("daily trivia", () => {
  it("covers all 197 playable countries with at least five clues each", () => {
    expect(countries).toHaveLength(197);
    const pool = getTriviaCountryPool();
    expect(pool.length).toBe(197);
  });

  it("picks different daily and bonus countries for a given date", () => {
    const trivia = getDailyTrivia("2026-07-13");
    expect(trivia.daily.countryId).not.toBe(trivia.bonus.countryId);
    expect(trivia.daily.clues).toHaveLength(5);
    expect(trivia.bonus.clues).toHaveLength(5);
  });

  it("is deterministic for the same date seed", () => {
    const a = getDailyTrivia("2026-03-01");
    const b = getDailyTrivia("2026-03-01");
    expect(a).toEqual(b);
  });

  it("changes the daily country across many dates", () => {
    const ids = new Set<string>();
    for (let day = 1; day <= 31; day++) {
      const date = `2026-01-${String(day).padStart(2, "0")}`;
      ids.add(getDailyTrivia(date).daily.countryId);
    }
    expect(ids.size).toBeGreaterThan(10);
  });

  it("rotates through many countries over a long span", () => {
    const ids = new Set<string>();
    const start = Date.UTC(2026, 0, 1);
    for (let i = 0; i < 200; i++) {
      const d = new Date(start + i * 86_400_000);
      const seed = d.toISOString().slice(0, 10);
      ids.add(getDailyTrivia(seed).daily.countryId);
    }
    expect(ids.size).toBeGreaterThan(40);
  });
});
