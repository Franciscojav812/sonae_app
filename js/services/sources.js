/**
 * Data sources. Each loader resolves to
 *   { data, status: 'live' | 'cached' | 'demo', fetchedAt, parts? }
 * and never rejects: when the network and the cache both fail it falls back
 * to the bundled fixtures, clearly flagged as demo data.
 */
import { ENDPOINTS, HTTP, MAX_STALE_MS, MERGE, QUAKE_WINDOW_MS, TOKYO, TYPHOON_BBOX, DEMO_ANCHOR } from '../config.js';
import { fetchWithCache } from '../lib/http.js';
import { normalizeP2PQuakes, normalizeUSGS, mergeQuakes, withinWindow } from '../domain/quakes.js';
import { normalizeTsunami } from '../domain/tsunami.js';
import { normalizeOpenMeteo } from '../domain/weather.js';
import { normalizeGDACS } from '../domain/typhoons.js';
import { CITIES } from '../data/cities.js';

const defaultFixtureLoader = (name) =>
  fetch(new URL(`../../fixtures/${name}`, import.meta.url)).then((r) => r.json());

/** Moves fixture timestamps so the example data always looks recent. */
const shiftTime = (offset) => (x) => ({ ...x, time: x.time + offset });

function isoDay(ms) {
  return new Date(ms + 9 * 3_600_000).toISOString().slice(0, 10); // calendar day in JST
}

export function createSources({
  storage,
  forceDemo = false,
  now = Date.now,
  loadFixture = defaultFixtureLoader,
  http = HTTP,
}) {
  const cached = (key, url) => fetchWithCache(key, url, { storage, maxStaleMs: MAX_STALE_MS[key.split(':')[0]], now, ...http });
  const demo = (data) => ({ data, status: 'demo', fetchedAt: now() });

  async function demoQuakes() {
    const [jma, usgs] = await Promise.all([loadFixture('p2p-551.json'), loadFixture('usgs.json')]);
    const merged = mergeQuakes(normalizeP2PQuakes(jma), normalizeUSGS(usgs), MERGE);
    return merged.map(shiftTime(now() - DEMO_ANCHOR));
  }

  async function quakes() {
    if (forceDemo) return demo(await demoQuakes());
    const since = new Date(now() - QUAKE_WINDOW_MS).toISOString().slice(0, 19);
    const [jma, usgs] = await Promise.allSettled([
      cached('quakes:jma', ENDPOINTS.p2pQuakes),
      cached('quakes:usgs', ENDPOINTS.usgs(since)),
    ]);
    if (jma.status === 'rejected' && usgs.status === 'rejected') return demo(await demoQuakes());

    const ok = (r) => (r.status === 'fulfilled' ? r.value : null);
    const parts = {
      JMA: ok(jma)?.status ?? 'error',
      USGS: ok(usgs)?.status ?? 'error',
    };
    const merged = mergeQuakes(normalizeP2PQuakes(ok(jma)?.data), normalizeUSGS(ok(usgs)?.data), MERGE);
    const statuses = Object.values(parts);
    return {
      data: withinWindow(merged, now(), QUAKE_WINDOW_MS),
      status: statuses.includes('live') ? 'live' : 'cached',
      fetchedAt: Math.min(...[ok(jma), ok(usgs)].filter(Boolean).map((r) => r.fetchedAt)),
      parts,
    };
  }

  async function tsunami() {
    const maxAge = 36 * 3_600_000;
    if (forceDemo) return demo(normalizeTsunami(await loadFixture('p2p-552.json'), now(), maxAge));
    try {
      const r = await cached('tsunami', ENDPOINTS.p2pTsunami);
      return { ...r, data: normalizeTsunami(r.data, now(), maxAge) };
    } catch {
      return demo(normalizeTsunami(await loadFixture('p2p-552.json'), now(), maxAge));
    }
  }

  async function demoWeather() {
    const list = normalizeOpenMeteo(await loadFixture('open-meteo.json'), CITIES);
    return list.map((w) => ({
      ...w,
      daily: w.daily.map((d, j) => ({ ...d, date: isoDay(now() + j * 86_400_000) })),
    }));
  }

  async function weather() {
    if (forceDemo) return demo(await demoWeather());
    try {
      const r = await cached('weather', ENDPOINTS.openMeteo(CITIES));
      const data = normalizeOpenMeteo(r.data, CITIES);
      if (!data.length) throw new Error('empty weather payload');
      return { ...r, data };
    } catch {
      return demo(await demoWeather());
    }
  }

  async function typhoons() {
    const parse = (raw) => normalizeGDACS(raw, TYPHOON_BBOX, TOKYO);
    if (forceDemo) return demo(parse(await loadFixture('gdacs.json')));
    const to = isoDay(now());
    const from = isoDay(now() - 10 * 86_400_000);
    try {
      const r = await cached('typhoons', ENDPOINTS.gdacs(from, to));
      return { ...r, data: parse(r.data) };
    } catch {
      return demo(parse(await loadFixture('gdacs.json')));
    }
  }

  return { quakes, tsunami, weather, typhoons };
}
