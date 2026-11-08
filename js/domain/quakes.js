/**
 * Earthquake domain: turns raw JMA (via P2PQuake) and USGS payloads into one
 * normalized, de-duplicated list. Pure functions only — no DOM, no network.
 *
 * Normalized quake:
 * { id, sources: ('JMA'|'USGS')[], time, magnitude, magType, usgsMagnitude,
 *   depthKm, lat, lon, place, maxShindo, tsunami, url? }  (url: USGS event page when known)
 */
import { distanceKm } from '../lib/geo.js';

/** JMA seismic intensity classes, weakest to strongest. */
export const SHINDO_ORDER = ['1', '2', '3', '4', '5-', '5+', '6-', '6+', '7'];

/** P2PQuake encodes shindo as integers (10 = 1 … 70 = 7; 46 = "5弱以上と推定"). */
export const P2P_SCALE = {
  10: '1', 20: '2', 30: '3', 40: '4', 45: '5-', 46: '5-', 50: '5+', 55: '6-', 60: '6+', 70: '7',
};

export const shindoIndex = (s) => (s ? SHINDO_ORDER.indexOf(s) : -1);

/** Parses JMA timestamps ("2026/11/08 10:00:00[.123]", always JST) to epoch ms. */
export function parseJST(text) {
  const m = /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?/.exec(text ?? '');
  if (!m) return Number.NaN;
  const ms = m[7] ? Number(m[7].padEnd(3, '0')) : 0;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 9, +m[5], +m[6], ms);
}

/**
 * JMA publishes several reports per quake (震度速報 → 震源に関する情報 → 各地の震度).
 * Reports sharing an origin time are folded into one event: the hypocenter comes
 * from whichever report has it, the shindo is the highest reported.
 */
export function normalizeP2PQuakes(items) {
  if (!Array.isArray(items)) return [];
  const byOrigin = new Map();

  for (const item of items) {
    const eq = item?.earthquake;
    if (item?.code !== 551 || !eq?.time) continue;
    if (item.issue?.type === 'Foreign') continue;

    const time = parseJST(eq.time);
    if (Number.isNaN(time)) continue;

    const h = eq.hypocenter ?? {};
    const hasHypocenter = h.latitude > -90 && h.longitude > -180 && h.magnitude >= 0;
    const shindo = P2P_SCALE[eq.maxScale] ?? null;

    const prev = byOrigin.get(time);
    const merged = prev ?? {
      id: `jma-${time}`,
      sources: ['JMA'],
      time,
      magnitude: null,
      magType: 'Mj',
      depthKm: null,
      lat: null,
      lon: null,
      place: '',
      maxShindo: null,
      tsunami: 'None',
    };

    if (hasHypocenter) {
      merged.magnitude = h.magnitude;
      merged.depthKm = h.depth >= 0 ? h.depth : null;
      merged.lat = h.latitude;
      merged.lon = h.longitude;
      merged.place = h.name || merged.place;
    }
    if (shindoIndex(shindo) > shindoIndex(merged.maxShindo)) merged.maxShindo = shindo;
    if (eq.domesticTsunami && eq.domesticTsunami !== 'Unknown') merged.tsunami = eq.domesticTsunami;

    byOrigin.set(time, merged);
  }

  // A 震度速報 alone has no location yet; it cannot be placed on the map.
  return [...byOrigin.values()].filter((q) => q.lat !== null && q.magnitude !== null);
}

export function normalizeUSGS(geojson) {
  const features = geojson?.features;
  if (!Array.isArray(features)) return [];
  return features
    .filter((f) => f?.geometry?.type === 'Point' && Number.isFinite(f.properties?.mag))
    .map((f) => {
      const [lon, lat, depth] = f.geometry.coordinates;
      return {
        id: `usgs-${f.id}`,
        sources: ['USGS'],
        time: f.properties.time,
        magnitude: f.properties.mag,
        magType: f.properties.magType ?? null,
        depthKm: Number.isFinite(depth) ? Math.round(depth * 10) / 10 : null,
        lat,
        lon,
        place: (f.properties.place ?? '').replace(/,\s*Japan$/i, ''),
        maxShindo: null,
        tsunami: f.properties.tsunami ? 'Checking' : 'None',
        url: f.properties.url ?? `https://earthquake.usgs.gov/earthquakes/eventpage/${f.id}`,
      };
    });
}

/**
 * Cross-references the two catalogues. JMA is authoritative inside Japan
 * (it adds shindo), USGS fills in offshore events JMA did not report.
 * Each JMA event can absorb at most one USGS event (closest in time).
 */
export function mergeQuakes(jma, usgs, { windowMs, radiusKm }) {
  const result = jma.map((q) => ({ ...q, sources: [...q.sources] }));
  const claimed = new Set();

  for (const u of usgs) {
    let best = -1;
    let bestDt = Infinity;
    result.forEach((q, i) => {
      if (claimed.has(i) || q.sources.includes('USGS')) return;
      const dt = Math.abs(q.time - u.time);
      if (dt <= windowMs && dt < bestDt && distanceKm(q.lat, q.lon, u.lat, u.lon) <= radiusKm) {
        best = i;
        bestDt = dt;
      }
    });

    if (best >= 0) {
      claimed.add(best);
      result[best].sources.push('USGS');
      result[best].usgsMagnitude = u.magnitude;
      result[best].usgsMagType = u.magType;
      result[best].url = u.url;
    } else {
      result.push({ ...u });
    }
  }

  return result.sort((a, b) => b.time - a.time);
}

export const withinWindow = (quakes, now, windowMs) =>
  quakes.filter((q) => q.time >= now - windowMs && q.time <= now + 60_000);

/** The most significant event: strongest shaking first, then magnitude. */
export function mostSignificant(quakes) {
  let top = null;
  for (const q of quakes) {
    if (!top) { top = q; continue; }
    const ds = shindoIndex(q.maxShindo) - shindoIndex(top.maxShindo);
    if (ds > 0 || (ds === 0 && q.magnitude > top.magnitude)) top = q;
  }
  return top;
}

/** Colour bucket by hypocentral depth (shallow quakes are the most damaging). */
export function depthBand(depthKm) {
  const d = depthKm ?? 0;
  if (d < 30) return 1;
  if (d < 70) return 2;
  if (d < 150) return 3;
  if (d < 300) return 4;
  return 5;
}
