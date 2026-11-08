import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeTsunami } from '../js/domain/tsunami.js';
import { normalizeOpenMeteo, weatherFlags } from '../js/domain/weather.js';
import { normalizeGDACS, jmaIntensity } from '../js/domain/typhoons.js';
import { normalizeEEW, isEewActive } from '../js/domain/eew.js';
import { computeHazards, quakeLevel, tsunamiLevel } from '../js/domain/hazards.js';
import { CITIES } from '../js/data/cities.js';
import { TYPHOON_BBOX, TOKYO } from '../js/config.js';

const fixture = (name) => JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url)));
const NOW = Date.UTC(2026, 10, 8, 0, 0, 0);
const HOUR = 3_600_000;

/* ---------- tsunami ---------- */
const bulletin = (over = {}) => ({
  code: 552, cancelled: false, issue: { time: '2026/11/08 08:50:00' },
  areas: [{ grade: 'Watch', name: '岩手県', immediate: false }, { grade: 'Warning', name: '宮城県', immediate: true }],
  ...over,
});

test('tsunami: latest bulletin wins and areas are sorted by severity', () => {
  const t = normalizeTsunami([bulletin()], NOW, 36 * HOUR);
  assert.equal(t.active, true);
  assert.equal(t.highestGrade, 'Warning');
  assert.equal(t.areas[0].name, '宮城県');
});

test('tsunami: a cancellation clears the state even if an older warning exists', () => {
  const cancel = bulletin({ cancelled: true, issue: { time: '2026/11/08 08:55:00' } });
  assert.equal(normalizeTsunami([bulletin(), cancel], NOW, 36 * HOUR).active, false);
});

test('tsunami: stale bulletins and empty payloads mean no tsunami', () => {
  assert.equal(normalizeTsunami([bulletin()], NOW + 48 * HOUR, 36 * HOUR).active, false);
  assert.equal(normalizeTsunami(fixture('p2p-552.json'), NOW, 36 * HOUR).active, false);
  assert.equal(normalizeTsunami(null, NOW, 1).active, false);
});

/* ---------- weather ---------- */
test('weather: fixture normalizes all cities with 7 days each', () => {
  const w = normalizeOpenMeteo(fixture('open-meteo.json'), CITIES);
  assert.equal(w.length, CITIES.length);
  assert.ok(w.every((x) => x.daily.length === 7));
});

test('weather: flags follow advisory/warning thresholds', () => {
  const base = { current: { temp: 20, precip: 0, gust: 10, code: 1 }, daily: [{ max: 25, precip: 0, gust: 20, snow: 0 }] };
  assert.deepEqual(weatherFlags(base), []);
  const hot = structuredClone(base); hot.daily[0].max = 36;
  assert.deepEqual(weatherFlags(hot), [{ kind: 'heat', level: 1 }]);
  const storm = structuredClone(base); storm.current.gust = 95; storm.current.code = 95;
  assert.deepEqual(weatherFlags(storm), [{ kind: 'wind', level: 2 }, { kind: 'storm', level: 1 }]);
  const rain = structuredClone(base); rain.daily[0].precip = 85;
  assert.deepEqual(weatherFlags(rain), [{ kind: 'rain', level: 2 }]);
});

test('weather: a missing city in the payload is skipped, not crashed on', () => {
  const payload = fixture('open-meteo.json').slice(0, 3);
  assert.equal(normalizeOpenMeteo(payload, CITIES).length, 3);
  assert.equal(normalizeOpenMeteo(undefined, CITIES).length, 0);
});

/* ---------- typhoons ---------- */
test('typhoons: keeps NW Pacific storms only and measures distance to Tokyo', () => {
  const list = normalizeGDACS(fixture('gdacs.json'), TYPHOON_BBOX, TOKYO);
  assert.equal(list.length, 1);
  assert.equal(list[0].alert, 'orange');
  assert.ok(list[0].distanceKm > 1500 && list[0].distanceKm < 2000);
  assert.equal(jmaIntensity(list[0].windKmh), 'strong');
  assert.equal(jmaIntensity(200), 'violent');
  assert.equal(jmaIntensity(80), null);
});

/* ---------- EEW ---------- */
test('EEW: normalizes code 556 and expires after the TTL', () => {
  const e = normalizeEEW({
    code: 556, _id: 'abc', time: '2026/11/08 08:59:58', cancelled: false, test: false,
    earthquake: { originTime: '2026/11/08 08:59:50', hypocenter: { name: '三陸沖', latitude: 38.9, longitude: 142.3, depth: 40, magnitude: 6.4 } },
    areas: [{ pref: '宮城県', name: '宮城県北部', scaleFrom: 50, scaleTo: 99 }],
  });
  assert.equal(e.areas[0].shindoFrom, '5+');
  assert.equal(e.areas[0].orMore, true);
  assert.equal(isEewActive(e, NOW), true);
  assert.equal(isEewActive(e, NOW + 10 * 60_000), false);
  assert.equal(isEewActive({ ...e, test: true }, NOW), false);
  assert.equal(normalizeEEW({ code: 551 }), null);
});

/* ---------- threat model ---------- */
test('quake level maps shindo to JMA colour levels', () => {
  const q = (maxShindo, magnitude = 5) => [{ time: NOW - HOUR, maxShindo, magnitude }];
  assert.equal(quakeLevel(q('3'), NOW).level, 0);
  assert.equal(quakeLevel(q('5-'), NOW).level, 1);
  assert.equal(quakeLevel(q(null, 6.2), NOW).level, 1);
  assert.equal(quakeLevel(q('5+'), NOW).level, 2);
  assert.equal(quakeLevel(q('6+'), NOW).level, 3);
  assert.equal(quakeLevel(q('7'), NOW).level, 4);
  assert.equal(quakeLevel([{ time: NOW - 30 * HOUR, maxShindo: '7', magnitude: 7 }], NOW).level, 0, 'older than 24 h');
});

test('an active EEW raises the quake level to danger', () => {
  const eew = { issuedAt: NOW - 10_000, cancelled: false, test: false };
  assert.equal(quakeLevel([], NOW, eew).level, 3);
});

test('tsunami grades map to levels; overall takes the max', () => {
  assert.equal(tsunamiLevel({ highestGrade: 'MajorWarning' }).level, 4);
  const h = computeHazards({ quakes: [], tsunami: { highestGrade: 'Watch' }, typhoons: [{ alert: 'orange', distanceKm: 900 }], weather: [] }, NOW);
  assert.equal(h.tsunami.level, 1);
  assert.equal(h.typhoon.level, 2);
  assert.equal(h.overall, 2);
});
