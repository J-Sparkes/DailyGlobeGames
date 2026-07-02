import { describe, expect, it } from "vitest";
import { shouldFinishSweepSuccess } from "@/lib/sweep-finish";

describe("shouldFinishSweepSuccess (BUG-02 unlimited dead-end guard)", () => {
  it("allows the first success finish", () => {
    expect(shouldFinishSweepSuccess(false)).toBe(true);
  });

  it("blocks duplicate success finishes", () => {
    expect(shouldFinishSweepSuccess(true)).toBe(false);
  });
});
