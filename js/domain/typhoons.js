/** Tropical cyclones from GDACS, limited to the NW Pacific around Japan. */
import { distanceKm } from '../lib/geo.js';

export const ALERT_RANK = { green: 1, orange: 2, red: 3 };

export function normalizeGDACS(collection, bbox, origin) {
  const features = collection?.features;
  if (!Array.isArray(features)) return [];
  const seen = new Set();
  const out = [];

  for (const f of features) {
    const p = f?.properties ?? {};
    if (p.eventtype && p.eventtype !== 'TC') continue;
    if (f.geometry?.type !== 'Point') continue;
    if (String(p.iscurrent).toLowerCase() === 'false') continue;
    if (seen.has(p.eventid)) continue;

    const [lon, lat] = f.geometry.coordinates;
    if (lat < bbox.latMin || lat > bbox.latMax || lon < bbox.lonMin || lon > bbox.lonMax) continue;
    seen.add(p.eventid);

    const alert = String(p.alertlevel ?? 'green').toLowerCase();
    out.push({
      id: String(p.eventid ?? `${lat},${lon}`),
      name: p.name || p.eventname || 'TC',
      lat,
      lon,
      alert: ALERT_RANK[alert] ? alert : 'green',
      windKmh: Number.isFinite(p.severitydata?.severity) ? Math.round(p.severitydata.severity) : null,
      distanceKm: Math.round(distanceKm(origin.lat, origin.lon, lat, lon)),
      url: p.url?.report ?? 'https://www.gdacs.org/',
    });
  }
  return out.sort((a, b) => ALERT_RANK[b.alert] - ALERT_RANK[a.alert] || a.distanceKm - b.distanceKm);
}

/** JMA intensity class from 10-min sustained wind (m/s). */
export function jmaIntensity(windKmh) {
  if (windKmh == null) return null;
  const ms = windKmh / 3.6;
  if (ms >= 54) return 'violent';
  if (ms >= 44) return 'veryStrong';
  if (ms >= 33) return 'strong';
  return null;
}
