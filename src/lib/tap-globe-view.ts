import { haversineKm } from "@/lib/geo-distance";

export const TAP_PIN_SIZE = 0.52;
export const HOLD_CONFIRM_MS = 700;
export const HOLD_MOVE_THRESHOLD_PX = 14;

export interface TapGlobePoint {
  id: string;
  lat: number;
  lng: number;
  color: string;
  size: number;
  altitude: number;
}

export interface TapRevealArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
}

export function expandTapMarkerLayers(
  markers: { id: string; lat: number; lng: number; color: string; size?: number }[],
): TapGlobePoint[] {
  const layers: TapGlobePoint[] = [];

  for (const marker of markers) {
    const size = marker.size ?? TAP_PIN_SIZE;

    layers.push({
      id: `${marker.id}-shadow`,
      lat: marker.lat,
      lng: marker.lng,
      color: "rgba(0, 0, 0, 0.62)",
      size: size * 1.38,
      altitude: 0.016,
    });
    layers.push({
      id: `${marker.id}-ring`,
      lat: marker.lat,
      lng: marker.lng,
      color: "rgba(255, 255, 255, 0.92)",
      size: size * 1.14,
      altitude: 0.021,
    });
    layers.push({
      id: marker.id,
      lat: marker.lat,
      lng: marker.lng,
      color: marker.color,
      size,
      altitude: 0.026,
    });
  }

  return layers;
}

function midpointLng(lng1: number, lng2: number): number {
  const delta = lng2 - lng1;
  if (Math.abs(delta) <= 180) return (lng1 + lng2) / 2;
  return ((lng1 + lng2 + 360) / 2) % 360;
}

export function povForRevealPair(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
): { lat: number; lng: number; altitude: number } {
  const lat = (startLat + endLat) / 2;
  const lng = midpointLng(startLng, endLng);
  const distanceKm = haversineKm(startLat, startLng, endLat, endLng);

  let altitude = 1.45;
  if (distanceKm > 40) altitude = 1.7;
  if (distanceKm > 250) altitude = 2.0;
  if (distanceKm > 1200) altitude = 2.35;
  if (distanceKm > 3500) altitude = 2.65;
  if (distanceKm > 8000) altitude = 2.9;

  return { lat, lng, altitude };
}
