import { TRANSPARENT_POLYGON, type PolygonStyle } from "@/lib/globe-polygon-styles";
import type { CountryFeature } from "@/lib/world-geographies";

export type StyledCountryFeature = CountryFeature & {
  capColor: string;
  strokeColor: string;
  polygonAltitude: number;
};

export function applyPolygonStyles(
  features: CountryFeature[],
  styles: Map<string, PolygonStyle>,
): StyledCountryFeature[] {
  return features
    .filter((feature) => styles.has(feature.properties.countryId))
    .map((feature) => {
      const style = styles.get(feature.properties.countryId) ?? TRANSPARENT_POLYGON;
      return {
        ...feature,
        capColor: style.capColor,
        strokeColor: style.strokeColor,
        polygonAltitude: style.altitude,
      };
    });
}
