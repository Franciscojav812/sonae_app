/** Tsunami forecasts (P2PQuake code 552). Pure functions. */
import { parseJST } from './quakes.js';

/** JMA grades, weakest to strongest: 津波注意報 < 津波警報 < 大津波警報. */
export const GRADE_RANK = { Watch: 1, Warning: 2, MajorWarning: 3 };

const NONE = Object.freeze({ active: false, issuedAt: null, areas: [], highestGrade: null });

/**
 * Returns the state described by the most recent bulletin. A cancellation,
 * an empty area list or a bulletin older than `maxAgeMs` all mean "no tsunami".
 */
export function normalizeTsunami(items, now, maxAgeMs) {
  if (!Array.isArray(items)) return NONE;
  const bulletins = items
    .filter((it) => it?.code === 552)
    .map((it) => ({ ...it, issuedAt: parseJST(it.issue?.time ?? it.time) }))
    .filter((it) => !Number.isNaN(it.issuedAt))
    .sort((a, b) => b.issuedAt - a.issuedAt);

  const latest = bulletins[0];
  if (!latest || latest.cancelled || now - latest.issuedAt > maxAgeMs) return NONE;

  const areas = (latest.areas ?? [])
    .filter((a) => GRADE_RANK[a.grade])
    .map((a) => ({ grade: a.grade, name: a.name, immediate: Boolean(a.immediate) }))
    .sort((a, b) => GRADE_RANK[b.grade] - GRADE_RANK[a.grade]);

  if (!areas.length) return NONE;
  return { active: true, issuedAt: latest.issuedAt, areas, highestGrade: areas[0].grade };
}
