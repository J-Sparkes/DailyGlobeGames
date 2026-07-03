import { describe, expect, it } from "vitest";
import { getRemainingModeLabels } from "@/lib/trifecta";

describe("trifecta", () => {
  it("lists remaining modes", () => {
    expect(
      getRemainingModeLabels({
        date: "2026-06-30",
        sweep: true,
        tap: false,
        hunt: false,
        completed: 1,
        complete: false,
      }),
    ).toEqual(["Tap", "Hunt"]);
  });
});
