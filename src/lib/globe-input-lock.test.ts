import { describe, expect, it } from "vitest";
import {
  acquireGlobeInputLock,
  releaseGlobeInputLock,
} from "@/lib/globe-input-lock";

describe("globe input lock (BUG-03 / BUG-08 rapid tap)", () => {
  it("allows the first tap and blocks the second until released", () => {
    const lock = { current: false };

    expect(acquireGlobeInputLock(lock)).toBe(true);
    expect(acquireGlobeInputLock(lock)).toBe(false);

    releaseGlobeInputLock(lock);
    expect(acquireGlobeInputLock(lock)).toBe(true);
  });
});
