import type { PolygonStyle } from "@/lib/globe-polygon-styles";
import type { CountryFeature } from "@/lib/world-geographies";

export type StyledCountryFeature = CountryFeature & {
  capColor: string;
  strokeColor: string;
  polygonAltitude: number;
};

const DEFAULT_STYLE: PolygonStyle = {
  capColor: "rgba(0, 0, 0, 0)",
  strokeColor: "rgba(0, 0, 0, 0)",
  altitude: 0.001,
};

export function applyPolygonStyles(
  features: CountryFeature[],
  styles: Map<string, PolygonStyle>,
): StyledCountryFeature[] {
  return features.map((feature) => {
    const style = styles.get(feature.properties.countryId) ?? DEFAULT_STYLE;
    return {
      ...feature,
      capColor: style.capColor,
      strokeColor: style.strokeColor,
      polygonAltitude: style.altitude,
    };
  });
}
