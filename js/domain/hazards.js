/**
 * Threat model: reduces every source to a 0–4 level that mirrors JMA's colour
 * code — 0 normal, 1 advisory (黄), 2 warning (赤), 3 danger (紫), 4 emergency (黒).
 */
import { mostSignificant, shindoIndex } from './quakes.js';
import { weatherFlags } from './weather.js';
import { isEewActive } from './eew.js';

export const LEVELS = ['normal', 'advisory', 'warning', 'danger', 'emergency'];

export function quakeLevel(quakes, now, eew = null) {
  const recent = quakes.filter((q) => now - q.time <= 86_400_000);
  const top = mostSignificant(recent);
  let level = 0;
  if (top) {
    const s = shindoIndex(top.maxShindo);
    if (s >= shindoIndex('7')) level = 4;
    else if (s >= shindoIndex('6-')) level = 3;
    else if (s >= shindoIndex('5+')) level = 2;
    else if (s >= shindoIndex('5-') || top.magnitude >= 6) level = 1;
  }
  if (isEewActive(eew, now)) level = Math.max(level, 3);
  return { level, top, recentCount: recent.length };
}

export function tsunamiLevel(tsunami) {
  const level = { MajorWarning: 4, Warning: 3, Watch: 1 }[tsunami?.highestGrade] ?? 0;
  return { level, grade: tsunami?.highestGrade ?? null };
}

export function typhoonLevel(typhoons, nearKm = 1500) {
  const top = typhoons[0] ?? null;
  if (!top) return { level: 0, top };
  const level = top.alert === 'red' ? 3 : top.alert === 'orange' ? 2 : top.distanceKm <= nearKm ? 1 : 0;
  return { level, top };
}

export function weatherLevel(weather) {
  let worst = { level: 0, city: null, kind: null };
  for (const w of weather) {
    for (const f of weatherFlags(w)) {
      if (f.level > worst.level) worst = { level: f.level, city: w.city, kind: f.kind };
    }
  }
  return worst;
}

export function computeHazards({ quakes = [], tsunami, typhoons = [], weather = [], eew = null }, now) {
  const h = {
    quake: quakeLevel(quakes, now, eew),
    tsunami: tsunamiLevel(tsunami),
    typhoon: typhoonLevel(typhoons),
    weather: weatherLevel(weather),
    // No public feed exists for J-Alert or volcanic alert levels: reported as informational.
    missile: { level: 0 },
    volcano: { level: 0 },
  };
  h.overall = Math.max(...Object.values(h).map((x) => x.level));
  return h;
}
