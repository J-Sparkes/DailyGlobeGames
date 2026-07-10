const EARTH_RADIUS_KM = 6371;

const DIRECTIONAL_ARROWS = ["⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️"];

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians) {
  return (radians * 180) / Math.PI;
}

function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function initialBearingDegrees(lat1, lng1, lat2, lng2) {
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δλ = toRadians(lng2 - lng1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

/**
 * @param {{ lat: number, lng: number }} guessCoords
 * @param {{ lat: number, lng: number }} targetCoords
 * @returns {number} Distance in kilometers, rounded to the nearest whole number.
 */
export function calculateDistance(guessCoords, targetCoords) {
  const distanceKm = haversineDistanceKm(
    guessCoords.lat,
    guessCoords.lng,
    targetCoords.lat,
    targetCoords.lng,
  );

  return Math.round(distanceKm);
}

/**
 * @param {{ lat: number, lng: number }} guessCoords
 * @param {{ lat: number, lng: number }} targetCoords
 * @returns {string} Arrow indicating direction from guess to target.
 */
export function getDirectionalHint(guessCoords, targetCoords) {
  const bearing = initialBearingDegrees(
    guessCoords.lat,
    guessCoords.lng,
    targetCoords.lat,
    targetCoords.lng,
  );

  const arrowIndex = Math.round(bearing / 45) % DIRECTIONAL_ARROWS.length;
  return DIRECTIONAL_ARROWS[arrowIndex];
}
