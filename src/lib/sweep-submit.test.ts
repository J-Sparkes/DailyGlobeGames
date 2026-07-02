import { describe, expect, it } from "vitest";
import { shouldAcceptSweepSubmit } from "@/lib/sweep-submit";

describe("shouldAcceptSweepSubmit (BUG-01 whitespace guard)", () => {
  it("rejects empty and whitespace-only guesses", () => {
    expect(shouldAcceptSweepSubmit("", "naming", false)).toBe(false);
    expect(shouldAcceptSweepSubmit("   ", "naming", false)).toBe(false);
    expect(shouldAcceptSweepSubmit("\n\t", "naming", false)).toBe(false);
  });

  it("accepts valid guesses during naming when not pending game over", () => {
    expect(shouldAcceptSweepSubmit("France", "naming", false)).toBe(true);
  });

  it("blocks submit while pending game over or wrong phase", () => {
    expect(shouldAcceptSweepSubmit("France", "naming", true)).toBe(false);
    expect(shouldAcceptSweepSubmit("France", "selecting", false)).toBe(false);
  });
});
