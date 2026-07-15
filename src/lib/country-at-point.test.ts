import { describe, expect, it } from "vitest";
import { findCountryIdAtLatLng } from "@/lib/country-at-point";
import type { CountryFeature } from "@/lib/world-geographies";

function squareFeature(
  countryId: string,
  west: number,
  south: number,
  east: number,
  north: number,
): CountryFeature {
  return {
    type: "Feature",
    properties: { name: countryId, countryId },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [west, south],
          [west, north],
          [east, north],
          [east, south],
          [west, south],
        ],
      ],
    },
  };
}

describe("findCountryIdAtLatLng", () => {
  const features = [
    squareFeature("alpha", 0, 0, 10, 10),
    squareFeature("beta", 20, 20, 30, 30),
  ];

  it("returns the containing country", () => {
    expect(findCountryIdAtLatLng(features, 5, 5)).toBe("alpha");
    expect(findCountryIdAtLatLng(features, 25, 25)).toBe("beta");
  });

  it("returns null over ocean", () => {
    expect(findCountryIdAtLatLng(features, -10, -10)).toBeNull();
  });
});
