import { geoBounds } from "d3-geo";
import { getFeatureCentroid } from "@/lib/geo-centroid";
import type { CountryFeature } from "@/lib/world-geographies";

export const POV_COOLDOWN_MS = 500;

export const SWEEP_FALLBACK_POV = { lat: 48, lng: 10, altitude: 2.5 };

export interface GlobePov {
  lat: number;
  lng: number;
  altitude: number;
}

/** Zoom altitude from geographic span so small countries fill the frame. */
export function altitudeForBoundsSpan(spanDegrees: number): number {
  if (spanDegrees <= 8) return 1.35;
  if (spanDegrees <= 15) return 1.55;
  if (spanDegrees <= 30) return 1.85;
  if (spanDegrees <= 60) return 2.15;
  if (spanDegrees <= 100) return 2.45;
  return 2.75;
}

export function povForCountryFeature(feature: CountryFeature): GlobePov {
  const { lat, lng } = getFeatureCentroid(feature);
  const [[west, south], [east, north]] = geoBounds(feature);
  const span = Math.max(Math.abs(north - south), Math.abs(east - west));

  return {
    lat,
    lng,
    altitude: altitudeForBoundsSpan(span),
  };
}

export function shouldTriggerPovRefocus(
  lastInteractionMs: number,
  nowMs: number,
  isInteracting: boolean,
): boolean {
  if (isInteracting) return false;
  return nowMs - lastInteractionMs >= POV_COOLDOWN_MS;
}
