import { describe, expect, it } from "vitest";
import type { DailyProgress } from "@/lib/daily-play";
import { getDateSeed } from "@/lib/daily-seed";
import {
  isSweepDeadEnd,
  sanitizeSweepProgress,
} from "@/lib/sweep-progress";

const DAILY_FRANCE = "france";
const TODAY = getDateSeed();

function progress(overrides: Partial<DailyProgress>): DailyProgress {
  return {
    date: TODAY,
    dailyCountryId: DAILY_FRANCE,
    claimedIds: [],
    phase: "naming",
    targetId: DAILY_FRANCE,
    ...overrides,
  };
}

describe("sanitizeSweepProgress", () => {
  it("resets selecting phase with no claimed countries", () => {
    const sanitized = sanitizeSweepProgress(
      progress({ phase: "selecting", claimedIds: [], targetId: "spain" }),
      DAILY_FRANCE,
    );

    expect(sanitized).toEqual(
      progress({
        phase: "naming",
        claimedIds: [],
        targetId: DAILY_FRANCE,
      }),
    );
  });

  it("moves to selecting when naming a country already claimed", () => {
    const sanitized = sanitizeSweepProgress(
      progress({
        claimedIds: ["france", "spain"],
        phase: "naming",
        targetId: "france",
      }),
      DAILY_FRANCE,
    );

    expect(sanitized.phase).toBe("selecting");
    expect(sanitized.targetId).toBe("spain");
  });

  it("filters unplayable countries from claimed path", () => {
    const sanitized = sanitizeSweepProgress(
      progress({
        claimedIds: ["france", "atlantis", "spain"],
        phase: "selecting",
        targetId: "spain",
      }),
      DAILY_FRANCE,
    );

    expect(sanitized.claimedIds).toEqual(["france", "spain"]);
  });

  it("recovers invalid phase values", () => {
    const sanitized = sanitizeSweepProgress(
      progress({
        phase: "invalid" as DailyProgress["phase"],
        claimedIds: ["france"],
      }),
      DAILY_FRANCE,
    );

    expect(sanitized.phase).toBe("selecting");
    expect(sanitized.claimedIds).toEqual(["france"]);
  });
});

describe("isSweepDeadEnd", () => {
  it("detects selecting with no frontier options", () => {
    expect(isSweepDeadEnd("selecting", ["iceland"], [])).toBe(true);
    expect(isSweepDeadEnd("selecting", ["france"], ["spain"])).toBe(false);
    expect(isSweepDeadEnd("naming", ["france"], [])).toBe(false);
  });
});
