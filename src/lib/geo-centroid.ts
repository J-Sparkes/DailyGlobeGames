import { geoCentroid } from "d3-geo";
import type { CountryFeature } from "@/lib/world-geographies";

export function getFeatureCentroid(feature: CountryFeature): {
  lat: number;
  lng: number;
} {
  const [lng, lat] = geoCentroid(feature);
  return { lat, lng };
}
