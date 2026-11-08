/**
 * "Never false calm": decides how much the overall level can be trusted, from
 * the freshness of each feed. A calm banner is only shown when the feeds that
 * could contradict it are live.
 */
export const CRITICAL_FEEDS = ['quakes', 'tsunami'];

const OK = new Set(['live']);
const DEGRADED = new Set(['cached']);

/** { level: 'full' | 'partial' | 'none', missing: feed[], degraded: feed[], demo } */
export function assessConfidence(sources, critical = CRITICAL_FEEDS) {
  const feeds = Object.keys(sources);
  const status = (f) => sources[f]?.status ?? 'loading';
  // Example data is the headline only when the critical feeds themselves are examples;
  // a single feed falling back to examples is just a missing feed.
  const demo = critical.every((f) => status(f) === 'demo');
  const missing = feeds.filter((f) => !OK.has(status(f)) && !DEGRADED.has(status(f)));
  const degraded = feeds.filter((f) => DEGRADED.has(status(f)));
  const criticalDown = critical.filter((f) => missing.includes(f));

  let level = 'full';
  if (missing.length || degraded.length) level = 'partial';
  if (criticalDown.length === critical.length) level = 'none';
  return { level, missing, degraded, demo };
}

/**
 * What the alert banner may claim.
 * - Real alerts are always shown, even with partial data (never hide danger).
 * - "Normal" is only shown when every feed is live; otherwise "unconfirmed".
 * - Example data is always labelled as such.
 */
export function bannerState(overall, confidence) {
  if (confidence.demo) return { level: overall, note: 'demo' };
  if (overall > 0) return { level: overall, note: confidence.level === 'full' ? null : 'partial' };
  if (confidence.level === 'full') return { level: 0, note: null };
  return { level: 'unconfirmed', note: confidence.level === 'none' ? 'none' : 'partial' };
}
