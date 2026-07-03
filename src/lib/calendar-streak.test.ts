import { describe, expect, it } from "vitest";
import { computeCalendarStreak } from "@/lib/calendar-streak";

describe("computeCalendarStreak", () => {
  it("counts consecutive days including today", () => {
    const result = computeCalendarStreak(
      ["2026-06-30", "2026-06-29", "2026-06-28"],
      "2026-06-30",
    );
    expect(result.current).toBe(3);
    expect(result.playedToday).toBe(true);
  });

  it("continues streak from yesterday if not played today yet", () => {
    const result = computeCalendarStreak(["2026-06-29", "2026-06-28"], "2026-06-30");
    expect(result.current).toBe(2);
    expect(result.playedToday).toBe(false);
  });

  it("returns zero when gap is too large", () => {
    const result = computeCalendarStreak(["2026-06-27"], "2026-06-30");
    expect(result.current).toBe(0);
  });
});
