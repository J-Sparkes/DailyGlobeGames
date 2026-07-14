import { describe, expect, it } from "vitest";
import locationsData from "@/data/locations.json";
import { countries } from "@/lib/game-data";
import {
  getUtcDayOfYear,
  pickDailyLocations,
} from "@/lib/daily-locations";
import type { DailyLocation } from "@/types/location";
import { MAX_ROUNDS } from "@/lib/tap-scoring";

const pool = locationsData as DailyLocation[];

describe("pickDailyLocations", () => {
  it("covers every playable country with at least one location", () => {
    expect(countries).toHaveLength(197);
    const covered = new Set(
      pool.map((loc) => loc.countryId).filter(Boolean),
    );
    for (const country of countries) {
      expect(covered.has(country.id)).toBe(true);
    }
    expect(covered.size).toBe(197);
  });

  it("returns a deterministic set for the same UTC date", () => {
    const date = new Date("2026-07-13T00:00:00Z");
    const a = pickDailyLocations(pool, MAX_ROUNDS, date);
    const b = pickDailyLocations(pool, MAX_ROUNDS, date);
    expect(a.map((loc) => loc.id)).toEqual(b.map((loc) => loc.id));
  });

  it("gives different sets on consecutive days", () => {
    const dayA = pickDailyLocations(
      pool,
      MAX_ROUNDS,
      new Date("2026-07-13T00:00:00Z"),
    );
    const dayB = pickDailyLocations(
      pool,
      MAX_ROUNDS,
      new Date("2026-07-14T00:00:00Z"),
    );
    const idsA = new Set(dayA.map((loc) => loc.id));
    const overlap = dayB.filter((loc) => idsA.has(loc.id));
    expect(overlap).toHaveLength(0);
  });

  it("uses unique daily sets across a non-leap year", () => {
    const signatures = new Set<string>();
    const start = Date.UTC(2026, 0, 1);

    for (let i = 0; i < 365; i++) {
      const date = new Date(start + i * 86_400_000);
      const picked = pickDailyLocations(pool, MAX_ROUNDS, date);
      const signature = picked
        .map((loc) => loc.id)
        .sort()
        .join("|");
      signatures.add(signature);
    }

    expect(signatures.size).toBe(365);
  });

  it("computes UTC day of year from Jan 1", () => {
    expect(getUtcDayOfYear(new Date("2026-01-01T00:00:00Z"))).toBe(0);
    expect(getUtcDayOfYear(new Date("2026-01-02T00:00:00Z"))).toBe(1);
    expect(getUtcDayOfYear(new Date("2026-12-31T00:00:00Z"))).toBe(364);
  });
});
