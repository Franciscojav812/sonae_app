const EARTH_RADIUS_KM = 6371;
const RAD = Math.PI / 180;

/** Great-circle distance in km (haversine). */
export function distanceKm(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * RAD;
  const dLon = (lon2 - lon1) * RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/**
 * Equirectangular projection tuned for the archipelago (lon 121–152°E, lat 22.5–46.5°N).
 * The x scale is compressed by ≈cos(35°) so shapes keep their proportions at mid-latitudes.
 */
export const VIEWBOX = { width: 762, height: 720, lon0: 121, lat0: 46.5, kx: 24.6, ky: 30 };

export function project(lon, lat, vb = VIEWBOX) {
  return [(lon - vb.lon0) * vb.kx, (vb.lat0 - lat) * vb.ky];
}
