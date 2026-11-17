import type { LatLng } from "./types";

/**
 * Parse a JSON-encoded geofence string into an array of {lat,lng}.
 */
export function parseGeofence(raw: string | null | undefined): LatLng[] {
  try {
    const parsed = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is LatLng =>
        p && typeof p.lat === "number" && typeof p.lng === "number",
    );
  } catch {
    return [];
  }
}

/**
 * Point-in-polygon test using the ray-casting algorithm.
 */
export function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  if (!polygon || polygon.length < 3) return true;
  const { lat: x, lng: y } = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

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

export function polygonCentroid(polygon: LatLng[]): LatLng {
  if (!polygon.length) return { lat: 0, lng: 0 };
  const sum = polygon.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: sum.lat / polygon.length, lng: sum.lng / polygon.length };
}

export function randomWalk(prev: LatLng, metersMax = 25): LatLng {
  const metersToDegLat = 1 / 111320;
  const metersToDegLng = 1 / (111320 * Math.cos((prev.lat * Math.PI) / 180));
  const stepMeters = Math.random() * metersMax;
  const bearing = Math.random() * 2 * Math.PI;
  return {
    lat: prev.lat + stepMeters * Math.cos(bearing) * metersToDegLat,
    lng: prev.lng + stepMeters * Math.sin(bearing) * metersToDegLng,
  };
}

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
  return {
    lat: prev.lat + (dLat / mag) * metersStep * metersToDegLat,
    lng: prev.lng + (dLng / mag) * metersStep * metersToDegLng,
  };
}
