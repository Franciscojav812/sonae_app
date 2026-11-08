/**
 * Earthquake Early Warning (緊急地震速報・警報), P2PQuake code 556.
 * Pushed over WebSocket seconds after a quake starts, before strong shaking arrives.
 */
import { P2P_SCALE, parseJST } from './quakes.js';

/** scaleTo = 99 means "this class or stronger" (程度以上). */
const scale = (v) => (v === 99 ? null : P2P_SCALE[v] ?? null);

export function normalizeEEW(msg) {
  if (msg?.code !== 556) return null;
  const eq = msg.earthquake ?? {};
  const h = eq.hypocenter ?? {};
  return {
    id: String(msg._id ?? msg.id ?? msg.time),
    issuedAt: parseJST(msg.issue?.time ?? msg.time),
    cancelled: Boolean(msg.cancelled),
    test: Boolean(msg.test),
    origin: parseJST(eq.originTime ?? ''),
    hypocenter: {
      name: h.name ?? '',
      lat: h.latitude > -90 ? h.latitude : null,
      lon: h.longitude > -180 ? h.longitude : null,
      magnitude: h.magnitude >= 0 ? h.magnitude : null,
      depthKm: h.depth >= 0 ? h.depth : null,
    },
    areas: (msg.areas ?? []).map((a) => ({
      pref: a.pref ?? '',
      name: a.name ?? '',
      shindoFrom: scale(a.scaleFrom),
      shindoTo: scale(a.scaleTo),
      orMore: a.scaleTo === 99,
    })),
  };
}

/** An EEW stays on screen for a few minutes unless it was cancelled or is a drill. */
export const isEewActive = (eew, now, ttlMs = 3 * 60_000) =>
  Boolean(eew && !eew.cancelled && !eew.test && now - eew.issuedAt <= ttlMs);
