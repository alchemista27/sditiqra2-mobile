// src/utils/gps.ts
// GPS distance calculation & mock GPS detection utilities

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in meters
 */
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if coordinates are within radius
 */
export function isWithinRadius(
  lat: number, lng: number,
  schoolLat: number, schoolLng: number,
  radiusMeters: number
): { isWithin: boolean; distance: number } {
  const distance = calculateDistance(lat, lng, schoolLat, schoolLng);
  return {
    isWithin: distance <= radiusMeters,
    distance: Math.round(distance),
  };
}
