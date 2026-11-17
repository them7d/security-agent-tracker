import type { LatLng } from "./types";

/**
 * Parse a JSON-encoded geofence string into an array of {lat,lng}.
 * Returns [] on any error.
 */
export function parseGeofence(raw: string | null | undefined): LatLng[] {
  try {
    const parsed = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is LatLng =>
        p &&
        typeof p.lat === "number" &&
        typeof p.lng === "number",
    );
  } catch {
    return [];
  }
}

/**
 * Point-in-polygon test using the ray-casting algorithm.
 * Returns true if `point` is strictly inside the polygon defined by `polygon`.
 * A point exactly on the boundary is treated as inside.
 */
export function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  if (!polygon || polygon.length < 3) return true; // no geofence = always "inside"

  const { lat: x, lng: y } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Haversine distance in meters between two lat/lng points.
 */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Centroid of a polygon — used for centering the map on a geofence.
 */
export function polygonCentroid(polygon: LatLng[]): LatLng {
  if (!polygon.length) return { lat: 0, lng: 0 };
  const sum = polygon.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: sum.lat / polygon.length, lng: sum.lng / polygon.length };
}

/**
 * Random walk step: returns a new lat/lng nudged by up to `metersMax`
 * in a random direction. Used by the GPS simulator.
 */
export function randomWalk(prev: LatLng, metersMax = 25): LatLng {
  // ~1 meter ~ 0.000009 degrees of latitude
  const metersToDegLat = 1 / 111320;
  const metersToDegLng = 1 / (111320 * Math.cos((prev.lat * Math.PI) / 180));

  const stepMeters = Math.random() * metersMax;
  const bearing = Math.random() * 2 * Math.PI;

  const dLatMeters = stepMeters * Math.cos(bearing);
  const dLngMeters = stepMeters * Math.sin(bearing);

  return {
    lat: prev.lat + dLatMeters * metersToDegLat,
    lng: prev.lng + dLngMeters * metersToDegLng,
  };
}

/**
 * For the simulator: occasionally nudge the agent toward outside the geofence
 * so supervisors actually see exit events in the demo. Returns a candidate
 * step that may be biased away from the geofence centroid.
 */
export function biasAwayFromCentroid(
  prev: LatLng,
  centroid: LatLng,
  metersStep = 30,
): LatLng {
  const metersToDegLat = 1 / 111320;
  const metersToDegLng = 1 / (111320 * Math.cos((prev.lat * Math.PI) / 180));

  const dLat = prev.lat - centroid.lat;
  const dLng = prev.lng - centroid.lng;
  const mag = Math.hypot(dLat, dLng) || 1;
  const dirLat = dLat / mag;
  const dirLng = dLng / mag;

  return {
    lat: prev.lat + dirLat * metersStep * metersToDegLat,
    lng: prev.lng + dirLng * metersStep * metersToDegLng,
  };
}
