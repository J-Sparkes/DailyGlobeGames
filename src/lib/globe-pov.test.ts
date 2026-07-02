import { describe, expect, it } from "vitest";
import { POV_COOLDOWN_MS, shouldTriggerPovRefocus } from "@/lib/globe-pov";

describe("shouldTriggerPovRefocus (BUG-06 POV after drag)", () => {
  it("does not refocus while the user is still interacting", () => {
    expect(shouldTriggerPovRefocus(1000, 1200, true)).toBe(false);
  });

  it("does not refocus until the cooldown elapses after drag ends", () => {
    const dragEnd = 1000;
    expect(shouldTriggerPovRefocus(dragEnd, dragEnd + 100, false)).toBe(false);
    expect(
      shouldTriggerPovRefocus(dragEnd, dragEnd + POV_COOLDOWN_MS, false),
    ).toBe(true);
  });
});
