/**
 * Web Mercator maths (EPSG:3857), the projection every XYZ tile service uses.
 * Pure functions: world coordinates are pixels at a given zoom, origin top-left.
 */
export const TILE_SIZE = 256;
const MAX_LAT = 85.05112878;

const clampLat = (lat) => Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));
export const worldSize = (zoom) => TILE_SIZE * 2 ** zoom;

export function toWorld(lon, lat, zoom) {
  const size = worldSize(zoom);
  const sin = Math.sin((clampLat(lat) * Math.PI) / 180);
  return [
    ((lon + 180) / 360) * size,
    (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
  ];
}

export function fromWorld(x, y, zoom) {
  const size = worldSize(zoom);
  const lon = (x / size) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / size;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return [lon, lat];
}

/**
 * Tiles covering a viewport of `width`×`height` px centred on `center`.
 * Each tile carries its screen offset; x wraps around the antimeridian,
 * rows outside the world are skipped.
 */
export function visibleTiles(center, zoom, width, height) {
  const [cx, cy] = toWorld(center[0], center[1], zoom);
  const left = cx - width / 2;
  const top = cy - height / 2;
  const n = 2 ** zoom;
  const tiles = [];
  for (let ty = Math.floor(top / TILE_SIZE); ty <= Math.floor((top + height) / TILE_SIZE); ty++) {
    if (ty < 0 || ty >= n) continue;
    for (let tx = Math.floor(left / TILE_SIZE); tx <= Math.floor((left + width) / TILE_SIZE); tx++) {
      tiles.push({
        x: ((tx % n) + n) % n,
        y: ty,
        z: zoom,
        left: Math.round(tx * TILE_SIZE - left),
        top: Math.round(ty * TILE_SIZE - top),
      });
    }
  }
  return tiles;
}

/** Highest integer zoom at which the bounds [[west, south], [east, north]] fit the viewport. */
export function fitBounds(bounds, width, height, minZoom = 0, maxZoom = 18, padding = 0) {
  const [[w, s], [e, n]] = bounds;
  let zoom = minZoom;
  for (let z = maxZoom; z >= minZoom; z--) {
    const [x0, y1] = toWorld(w, s, z);
    const [x1, y0] = toWorld(e, n, z);
    if (x1 - x0 <= width - 2 * padding && y1 - y0 <= height - 2 * padding) { zoom = z; break; }
  }
  const [x0, y1] = toWorld(w, s, zoom);
  const [x1, y0] = toWorld(e, n, zoom);
  return { center: fromWorld((x0 + x1) / 2, (y0 + y1) / 2, zoom), zoom };
}

/** Screen pixels per kilometre at a latitude and zoom (for drawing circles in km). */
export function pixelsPerKm(lat, zoom) {
  const metresPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
  return 1000 / metresPerPixel;
}

/** Fills an XYZ URL template: {z} {x} {y} and {s} (subdomain chosen deterministically). */
export function tileUrl(template, { x, y, z }, subdomains = 'abc') {
  return template
    .replace('{s}', subdomains[(x + y) % subdomains.length])
    .replace('{z}', z)
    .replace('{x}', x)
    .replace('{y}', y);
}
