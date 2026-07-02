import { describe, expect, it } from "vitest";
import { canSelectFrontierCountry } from "@/lib/sweep-select";

describe("canSelectFrontierCountry (BUG-05 double-click guard)", () => {
  it("allows selection during selecting phase when unlocked", () => {
    expect(canSelectFrontierCountry("selecting", false)).toBe(true);
  });

  it("blocks selection after the first click locks selection", () => {
    expect(canSelectFrontierCountry("selecting", true)).toBe(false);
  });

  it("blocks selection during naming phase", () => {
    expect(canSelectFrontierCountry("naming", false)).toBe(false);
  });
});
