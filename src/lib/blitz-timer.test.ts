import { describe, expect, it } from "vitest";
import {
  addBlitzBonus,
  BLITZ_BONUS_SECONDS,
  BLITZ_START_SECONDS,
  tickBlitzTimer,
} from "@/lib/blitz-timer";

describe("tickBlitzTimer", () => {
  it("decrements by one", () => {
    expect(tickBlitzTimer(30)).toEqual({ next: 29, expired: false });
  });

  it("expires at one second remaining", () => {
    expect(tickBlitzTimer(1)).toEqual({ next: 0, expired: true });
  });

  it("stays at zero when already empty", () => {
    expect(tickBlitzTimer(0)).toEqual({ next: 0, expired: false });
  });
});

describe("addBlitzBonus", () => {
  it("adds exactly three seconds for blitz bonus", () => {
    expect(addBlitzBonus(12, BLITZ_BONUS_SECONDS)).toBe(15);
  });

  it("starts from thirty seconds", () => {
    expect(BLITZ_START_SECONDS).toBe(30);
  });
});