import { describe, expect, it } from "vitest";
import { povForRevealPair } from "@/lib/tap-globe-view";

describe("povForRevealPair", () => {
  it("centers between two nearby points with a close zoom", () => {
    const pov = povForRevealPair(48.8, 2.3, 48.9, 2.4);
    expect(pov.lat).toBeCloseTo(48.85, 1);
    expect(pov.lng).toBeCloseTo(2.35, 1);
    expect(pov.altitude).toBeLessThan(1.8);
  });

  it("zooms out for long-distance reveals", () => {
    const pov = povForRevealPair(40.7, -74, 35.6, 139.6);
    expect(pov.altitude).toBeGreaterThan(2.5);
  });
});
