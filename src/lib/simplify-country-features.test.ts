import { describe, expect, it } from "vitest";
import { simplifyCountryFeature } from "@/lib/simplify-country-features";
import type { CountryFeature } from "@/lib/world-geographies";

function squareFeature(step = 0.05): CountryFeature {
  const ring: number[][] = [];
  for (let x = 0; x <= 1; x += step) ring.push([x, 0]);
  for (let y = step; y <= 1; y += step) ring.push([1, y]);
  for (let x = 1 - step; x >= 0; x -= step) ring.push([x, 1]);
  for (let y = 1 - step; y >= 0; y -= step) ring.push([0, y]);
  ring.push([0, 0]);

  return {
    type: "Feature",
    properties: { name: "Square", countryId: "square" },
    geometry: {
      type: "Polygon",
      coordinates: [ring],
    },
  };
}

describe("simplifyCountryFeature", () => {
  it("reduces dense ring vertices while keeping a valid polygon", () => {
    const original = squareFeature(0.02);
    const simplified = simplifyCountryFeature(original, 0.25);
    const originalCount = original.geometry.coordinates[0].length;
    const simplifiedCount = simplified.geometry.coordinates[0].length;

    expect(simplifiedCount).toBeLessThan(originalCount);
    expect(simplifiedCount).toBeGreaterThanOrEqual(4);
  });
});
