import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessConfidence, bannerState } from '../js/domain/confidence.js';
import { adviceKey, adviceLevel } from '../js/domain/advice.js';
import { ADVICE } from '../js/data/advice.js';
import { GLOSSARY } from '../js/data/glossary.js';
import { PANEL_SOURCES, PROVIDERS } from '../js/data/provenance.js';
import { STRINGS, LANGS } from '../js/i18n.js';
import { mergeQuakes, normalizeUSGS } from '../js/domain/quakes.js';

const src = (quakes, tsunami = 'live', weather = 'live', typhoons = 'live') =>
  Object.fromEntries(Object.entries({ quakes, tsunami, weather, typhoons }).map(([k, v]) => [k, v && { status: v }]));

/* ---------- never false calm ---------- */
test('confidence is full only when every feed is live', () => {
  assert.equal(assessConfidence(src('live')).level, 'full');
  assert.equal(assessConfidence(src('cached')).level, 'partial');
  const c = assessConfidence(src('live', 'live', 'error'));
  assert.equal(c.level, 'partial');
  assert.deepEqual(c.missing, ['weather']);
  assert.equal(assessConfidence(src('error', 'error')).level, 'none', 'both critical feeds down');
  assert.equal(assessConfidence(src(null)).level, 'partial', 'still loading is not confirmed');
});

test('banner says "normal" only with full confidence', () => {
  assert.deepEqual(bannerState(0, assessConfidence(src('live'))), { level: 0, note: null });
  assert.deepEqual(bannerState(0, assessConfidence(src('live', 'live', 'error'))), { level: 'unconfirmed', note: 'partial' });
  assert.deepEqual(bannerState(0, assessConfidence(src('error', 'error'))), { level: 'unconfirmed', note: 'none' });
});

test('a real alert is never hidden by missing feeds', () => {
  assert.deepEqual(bannerState(3, assessConfidence(src('live', 'error'))), { level: 3, note: 'partial' });
});

test('example data is labelled when the critical feeds are examples', () => {
  assert.equal(bannerState(2, assessConfidence(src('demo', 'demo', 'demo', 'demo'))).note, 'demo');
  assert.deepEqual(bannerState(0, assessConfidence(src('live', 'live', 'demo'))), { level: 'unconfirmed', note: 'partial' }, 'one example feed is just a missing feed');
});

/* ---------- what to do now ---------- */
const H = (over = {}) => ({
  quake: { level: 0 }, tsunami: { level: 0 }, typhoon: { level: 0 }, weather: { level: 0, kind: null }, ...over,
});

test('advice follows urgency: EEW > tsunami > quake > typhoon > weather', () => {
  assert.equal(adviceKey(H({ tsunami: { level: 3 }, quake: { level: 3 } }), { eewActive: true }), 'eew');
  assert.equal(adviceKey(H({ tsunami: { level: 3 }, quake: { level: 3 } })), 'tsunamiEvacuate');
  assert.equal(adviceKey(H({ tsunami: { level: 1 } })), 'tsunamiAdvisory');
  assert.equal(adviceKey(H({ quake: { level: 2 }, typhoon: { level: 3 } })), 'afterQuake');
  assert.equal(adviceKey(H({ typhoon: { level: 2 } })), 'typhoon');
  assert.equal(adviceKey(H({ weather: { level: 1, kind: 'heat' } })), 'heat');
  assert.equal(adviceKey(H({ weather: { level: 2, kind: 'rain' } })), 'storm');
  assert.equal(adviceKey(H()), 'calm');
  assert.equal(adviceLevel('tsunamiEvacuate', H({ tsunami: { level: 4 } })), 4);
});

test('every advice card has a title and three steps in every language', () => {
  for (const [key, byLang] of Object.entries(ADVICE)) {
    for (const lang of LANGS) {
      assert.ok(byLang[lang]?.title, `${key}.${lang} title`);
      assert.equal(byLang[lang].steps.length, 3, `${key}.${lang} steps`);
    }
  }
});

/* ---------- provenance & glossary ---------- */
test('every panel cites known providers and an official https link', () => {
  for (const [panel, p] of Object.entries(PANEL_SOURCES)) {
    assert.ok(p.official.startsWith('https://'), panel);
    for (const id of p.providers) assert.ok(PROVIDERS[id], `${panel} → ${id}`);
  }
  for (const p of Object.values(PROVIDERS)) for (const lang of LANGS) assert.ok(p.name[lang]);
  for (const kind of new Set(Object.values(PROVIDERS).map((p) => p.kind))) {
    for (const lang of LANGS) assert.ok(STRINGS[lang].trust.kinds[kind], `${lang} label for ${kind}`);
  }
});

test('glossary entries are complete and unique', () => {
  const seen = new Set();
  for (const g of GLOSSARY) {
    assert.ok(g.ja && g.es && g.en, g.ja);
    for (const lang of LANGS) assert.ok(g.def[lang], `${g.ja} def.${lang}`);
    assert.ok(!seen.has(g.ja), `duplicate ${g.ja}`);
    seen.add(g.ja);
  }
});

test('UI wording matches the glossary for official terms', () => {
  const term = (ja) => GLOSSARY.find((g) => g.ja === ja);
  for (const lang of ['es', 'en']) {
    assert.equal(STRINGS[lang].tsunami.grades.Warning, lang === 'es' ? 'Alerta de tsunami' : 'Tsunami warning');
    assert.equal(STRINGS[lang].tsunami.grades.Warning.toLowerCase(), term('津波警報')[lang].toLowerCase());
    assert.equal(STRINGS[lang].tsunami.grades.Watch.toLowerCase(), term('津波注意報')[lang].toLowerCase());
    assert.equal(STRINGS[lang].eew.title.toLowerCase(), term('緊急地震速報')[lang].toLowerCase());
  }
});

test('merged quakes keep a link to the USGS event page', () => {
  const usgs = normalizeUSGS({ features: [{ id: 'us7000abc', geometry: { type: 'Point', coordinates: [142, 38, 10] }, properties: { mag: 5, time: 1000 } }] });
  const jma = [{ id: 'jma-1', sources: ['JMA'], time: 2000, lat: 38, lon: 142, magnitude: 5 }];
  const [q] = mergeQuakes(jma, usgs, { windowMs: 60_000, radiusKm: 50 });
  assert.equal(q.url, 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000abc');
});
