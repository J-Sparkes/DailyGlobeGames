import { describe, expect, it } from "vitest";
import {
  altitudeForBoundsSpan,
  POV_COOLDOWN_MS,
  povForCountryFeature,
  shouldTriggerPovRefocus,
} from "@/lib/globe-pov";
import type { CountryFeature } from "@/lib/world-geographies";

const franceLike: CountryFeature = {
  type: "Feature",
  properties: { name: "France", countryId: "france" },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [2, 48],
        [8, 48],
        [8, 43],
        [2, 43],
        [2, 48],
      ],
    ],
  },
};

describe("povForCountryFeature", () => {
  it("centers on the feature centroid with span-based altitude", () => {
    const pov = povForCountryFeature(franceLike);
    expect(pov.lat).toBeCloseTo(45.5, 1);
    expect(pov.lng).toBeCloseTo(5, 1);
    expect(pov.altitude).toBeGreaterThan(1);
    expect(pov.altitude).toBeLessThan(3);
  });
});

describe("altitudeForBoundsSpan", () => {
  it("uses a closer zoom for small countries", () => {
    expect(altitudeForBoundsSpan(5)).toBeLessThan(altitudeForBoundsSpan(80));
  });
});

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
