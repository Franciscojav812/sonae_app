/** Decides which events deserve an interruptive alert. Pure: the UI only displays the result. */
import { shindoIndex } from './quakes.js';
import { isEewActive } from './eew.js';

/**
 * Returns the alerts that should fire now, skipping anything already in `seen`
 * (ids of alerts shown before) and anything from demo data.
 */
export function pendingAlerts({ quakes = [], tsunami, eew, demo = false }, seen, now, rules) {
  if (demo) return [];
  const out = [];

  if (isEewActive(eew, now) && !seen.has(`eew:${eew.id}`)) {
    out.push({ id: `eew:${eew.id}`, kind: 'eew', eew });
  }

  for (const q of quakes) {
    if (now - q.time > rules.maxAgeMs) continue;
    const strong = shindoIndex(q.maxShindo) >= shindoIndex(rules.minShindo) || q.magnitude >= rules.minMagnitude;
    if (strong && !seen.has(`quake:${q.id}`)) out.push({ id: `quake:${q.id}`, kind: 'quake', quake: q });
  }

  if (tsunami?.active && (tsunami.highestGrade === 'Warning' || tsunami.highestGrade === 'MajorWarning')) {
    const id = `tsunami:${tsunami.issuedAt}`;
    if (!seen.has(id)) out.push({ id, kind: 'tsunami', tsunami });
  }
  return out;
}
