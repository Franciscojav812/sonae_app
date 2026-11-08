import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  parseJST, normalizeP2PQuakes, normalizeUSGS, mergeQuakes, mostSignificant,
  shindoIndex, withinWindow, depthBand,
} from '../js/domain/quakes.js';

const fixture = (name) => JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url)));
const MERGE = { windowMs: 120_000, radiusKm: 120 };

const report = (over = {}) => ({
  code: 551,
  issue: { type: 'DetailScale' },
  earthquake: {
    time: '2026/11/08 09:00:00',
    maxScale: 30,
    domesticTsunami: 'None',
    hypocenter: { name: '宮城県沖', latitude: 38.5, longitude: 142.0, depth: 40, magnitude: 4.8 },
    ...over,
  },
});

test('parseJST converts JMA local time to UTC epoch', () => {
  assert.equal(parseJST('2026/11/08 09:00:00'), Date.UTC(2026, 10, 8, 0, 0, 0));
  assert.equal(parseJST('2026/01/01 03:30:00.5'), Date.UTC(2025, 11, 31, 18, 30, 0, 500));
  assert.ok(Number.isNaN(parseJST('garbage')));
});

test('folds the 震度速報 and the detailed report of the same quake into one event', () => {
  const prompt = report({ maxScale: 40, hypocenter: { latitude: -200, longitude: -200, depth: -1, magnitude: -1 } });
  const detail = report({ maxScale: 30 });
  const [q, ...rest] = normalizeP2PQuakes([prompt, detail]);
  assert.equal(rest.length, 0);
  assert.equal(q.maxShindo, '4', 'keeps the highest shindo seen across reports');
  assert.equal(q.magnitude, 4.8, 'takes the hypocenter from the report that has it');
  assert.equal(q.place, '宮城県沖');
});

test('drops reports that cannot be placed on a map, foreign quakes and other codes', () => {
  const onlyPrompt = report({ hypocenter: { latitude: -200, longitude: -200, depth: -1, magnitude: -1 } });
  const foreign = { ...report(), issue: { type: 'Foreign' } };
  const tsunami = { code: 552 };
  assert.deepEqual(normalizeP2PQuakes([onlyPrompt, foreign, tsunami, null]), []);
  assert.deepEqual(normalizeP2PQuakes(undefined), []);
});

test('depth -1 (unknown) becomes null, depth 0 (ごく浅い) is kept', () => {
  const [a] = normalizeP2PQuakes([report({ hypocenter: { name: 'x', latitude: 35, longitude: 139, depth: -1, magnitude: 3 } })]);
  const [b] = normalizeP2PQuakes([report({ hypocenter: { name: 'x', latitude: 35, longitude: 139, depth: 0, magnitude: 3 } })]);
  assert.equal(a.depthKm, null);
  assert.equal(b.depthKm, 0);
});

test('normalizeUSGS strips the country suffix and ignores events without magnitude', () => {
  const list = normalizeUSGS({
    features: [
      { id: 'a', geometry: { type: 'Point', coordinates: [142, 38, 35.27] }, properties: { mag: 5.1, time: 1, place: '80 km E of Ishinomaki, Japan', magType: 'mww' } },
      { id: 'b', geometry: { type: 'Point', coordinates: [142, 38, 10] }, properties: { mag: null, time: 2 } },
    ],
  });
  assert.equal(list.length, 1);
  assert.equal(list[0].place, '80 km E of Ishinomaki');
  assert.equal(list[0].depthKm, 35.3);
});

test('mergeQuakes links a USGS event to the JMA report of the same quake', () => {
  const [jma] = normalizeP2PQuakes([report()]);
  const usgs = normalizeUSGS({
    features: [
      // same quake: 5 s later, ~20 km away
      { id: 'same', geometry: { type: 'Point', coordinates: [142.2, 38.55, 38] }, properties: { mag: 5.0, time: jma.time + 5000, magType: 'mb' } },
      // different quake: same time but 600 km away
      { id: 'far', geometry: { type: 'Point', coordinates: [148, 40, 20] }, properties: { mag: 4.5, time: jma.time + 2000, magType: 'mb' } },
    ],
  });
  const merged = mergeQuakes([jma], usgs, MERGE);
  assert.equal(merged.length, 2);
  const linked = merged.find((q) => q.id === jma.id);
  assert.deepEqual(linked.sources, ['JMA', 'USGS']);
  assert.equal(linked.usgsMagnitude, 5.0);
  assert.equal(linked.magnitude, 4.8, 'JMA magnitude stays the primary value');
  assert.equal(jma.sources.length, 1, 'inputs are not mutated');
});

test('a JMA event absorbs at most one USGS event', () => {
  const [jma] = normalizeP2PQuakes([report()]);
  const f = (id, dt) => ({ id, geometry: { type: 'Point', coordinates: [142, 38.5, 40] }, properties: { mag: 4.9, time: jma.time + dt } });
  const merged = mergeQuakes([jma], normalizeUSGS({ features: [f('x', 30_000), f('y', 2_000)] }), MERGE);
  assert.equal(merged.length, 2);
});

test('full fixtures: merge keeps every JMA event and sorts newest first', () => {
  const jma = normalizeP2PQuakes(fixture('p2p-551.json'));
  const usgs = normalizeUSGS(fixture('usgs.json'));
  const merged = mergeQuakes(jma, usgs, MERGE);
  assert.ok(jma.length > 30);
  assert.ok(merged.length < jma.length + usgs.length, 'some events were matched');
  assert.ok(merged.filter((q) => q.sources.length === 2).length > 5);
  for (let i = 1; i < merged.length; i++) assert.ok(merged[i - 1].time >= merged[i].time);
});

test('mostSignificant ranks by shindo first, then magnitude', () => {
  const a = { maxShindo: '4', magnitude: 4.5 };
  const b = { maxShindo: null, magnitude: 6.1 };
  const c = { maxShindo: '4', magnitude: 5.0 };
  assert.equal(mostSignificant([a, b, c]), c);
  assert.equal(mostSignificant([]), null);
});

test('helpers', () => {
  assert.equal(shindoIndex('5+'), 5);
  assert.equal(shindoIndex(null), -1);
  assert.deepEqual([5, 45, 100, 200, 400].map(depthBand), [1, 2, 3, 4, 5]);
  const now = 10_000_000;
  assert.equal(withinWindow([{ time: now - 10 }, { time: now - 2_000_000 }], now, 1_000_000).length, 1);
});
