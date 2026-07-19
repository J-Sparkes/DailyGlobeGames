import type { CountryFeature } from "@/lib/world-geographies";

/** Drop near-duplicate ring points. Tuned for Sweep WebGL remesh cost. */
export const SWEEP_SIMPLIFY_MIN_DIST_DEG = 0.65;

function simplifyRing(
  ring: number[][],
  minDist: number,
): number[][] {
  if (ring.length <= 4) return ring;

  const minDistSq = minDist * minDist;
  const out: number[][] = [ring[0]];
  let last = ring[0];

  for (let i = 1; i < ring.length - 1; i++) {
    const point = ring[i];
    const dx = point[0] - last[0];
    const dy = point[1] - last[1];
    if (dx * dx + dy * dy >= minDistSq) {
      out.push(point);
      last = point;
    }
  }

  out.push(ring[ring.length - 1]);

  // Degenerate rings break triangulation — keep the original.
  if (out.length < 4) return ring;
  return out;
}

function simplifyCoords(coords: unknown, minDist: number): unknown {
  if (!Array.isArray(coords) || coords.length === 0) return coords;

  if (typeof coords[0]?.[0] === "number") {
    return simplifyRing(coords as number[][], minDist);
  }

  return (coords as unknown[]).map((part) => simplifyCoords(part, minDist));
}

export function simplifyCountryFeature(
  feature: CountryFeature,
  minDist: number = SWEEP_SIMPLIFY_MIN_DIST_DEG,
): CountryFeature {
  if (!feature.geometry || feature.geometry.type === "GeometryCollection") {
    return feature;
  }

  return {
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: simplifyCoords(
        feature.geometry.coordinates,
        minDist,
      ) as typeof feature.geometry.coordinates,
    },
  };
}

export function simplifyCountryFeatures(
  features: CountryFeature[],
  minDist: number = SWEEP_SIMPLIFY_MIN_DIST_DEG,
): CountryFeature[] {
  return features.map((feature) => simplifyCountryFeature(feature, minDist));
}
