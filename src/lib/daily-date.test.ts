import { describe, expect, it } from "vitest";
import { isDateSeedStale } from "@/lib/daily-date";

describe("isDateSeedStale (BUG-04 midnight rollover)", () => {
  it("returns false when mounted date matches current UTC day", () => {
    const now = new Date("2026-07-01T15:30:00.000Z");
    expect(isDateSeedStale("2026-07-01", now)).toBe(false);
  });

  it("returns true after UTC midnight crosses into a new day", () => {
    const afterMidnight = new Date("2026-07-02T00:01:00.000Z");
    expect(isDateSeedStale("2026-07-01", afterMidnight)).toBe(true);
  });

  it("returns false just before UTC midnight on the same puzzle day", () => {
    const beforeMidnight = new Date("2026-07-01T23:59:00.000Z");
    expect(isDateSeedStale("2026-07-01", beforeMidnight)).toBe(false);
  });
});
