import { geoContains } from "d3-geo";
import type { CountryFeature } from "@/lib/world-geographies";

/**
 * Resolve which country contains a lat/lng point.
 * Prefer smaller overlays (recent guesses) via optional preferredIds.
 */
export function findCountryIdAtLatLng(
  features: CountryFeature[],
  lat: number,
  lng: number,
  preferredIds?: Set<string>,
): string | null {
  const point: [number, number] = [lng, lat];

  if (preferredIds && preferredIds.size > 0) {
    for (const feature of features) {
      if (!preferredIds.has(feature.properties.countryId)) continue;
      if (geoContains(feature, point)) {
        return feature.properties.countryId;
      }
    }
  }

  for (const feature of features) {
    if (preferredIds?.has(feature.properties.countryId)) continue;
    if (geoContains(feature, point)) {
      return feature.properties.countryId;
    }
  }

  return null;
}
