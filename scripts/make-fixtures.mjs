// Generates example payloads in the exact shape each real API returns.
// They power demo mode (?demo, or when every network source fails) and the unit tests,
// so both exercise the same normalizers as live data. Output is deterministic (seeded RNG).
import { writeFileSync, mkdirSync } from 'node:fs';
import { CITIES } from '../js/data/cities.js';

const BASE = Date.UTC(2026, 10, 8, 0, 0, 0); // 2026-11-08 09:00 JST, newest event anchor
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

let seed = 20261108;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

function jst(ms) {
  const d = new Date(ms + 9 * HOUR);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}/${p(d.getUTCMonth() + 1)}/${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

// [lon, lat, spread°, name, depth range km]
const ZONES = [
  [142.6, 38.6, 1.2, '宮城県沖', [20, 60]],
  [141.9, 36.3, 0.6, '茨城県沖', [30, 60]],
  [143.0, 41.8, 1.0, '十勝沖', [30, 70]],
  [140.1, 35.8, 0.4, '千葉県北西部', [40, 80]],
  [137.1, 37.4, 0.3, '能登半島沖', [5, 15]],
  [129.4, 29.3, 0.4, 'トカラ列島近海', [10, 25]],
  [137.6, 35.9, 0.4, '長野県中部', [5, 15]],
  [131.9, 32.2, 0.5, '日向灘', [20, 40]],
  [139.4, 29.9, 0.8, '鳥島近海', [300, 450]],
  [124.8, 24.2, 0.6, '石垣島近海', [20, 50]],
  [142.2, 44.0, 0.4, '上川地方北部', [10, 20]],
];
const SCALES = [10, 20, 30, 40, 45, 50, 55];

const quakes = [];
for (let i = 0; i < 48; i++) {
  const [lon, lat, spread, name, [d0, d1]] = pick(ZONES);
  const big = rnd() < 0.1;
  const mag = round(big ? 4.6 + rnd() * 1.2 : 2.6 + rnd() * 1.9);
  const depth = Math.round(d0 + rnd() * (d1 - d0));
  const s = Math.max(0, Math.min(6, Math.round((mag - 2.2) * 1.35 - (depth > 100 ? 2 : 0))));
  quakes.push({
    time: BASE - Math.round(rnd() * 7 * DAY),
    lat: round(lat + (rnd() - 0.5) * spread, 2),
    lon: round(lon + (rnd() - 0.5) * spread, 2),
    mag, depth, name, scale: SCALES[s],
  });
}
// The headline event: offshore Sanriku, felt across Tohoku.
quakes.push({ time: BASE - 15 * 60_000, lat: 38.9, lon: 142.3, mag: 5.8, depth: 44, name: '三陸沖', scale: 40 });

const p2p = [];
for (const q of quakes.sort((a, b) => b.time - a.time)) {
  const id = Math.floor(rnd() * 1e12).toString(16);
  p2p.push({
    _id: id, code: 551, time: jst(q.time + 3 * 60_000),
    issue: { source: '気象庁', time: jst(q.time + 3 * 60_000), type: 'DetailScale', correct: 'None' },
    earthquake: {
      time: jst(q.time), maxScale: q.scale,
      domesticTsunami: q.mag >= 5.5 ? 'NonEffective' : 'None', foreignTsunami: 'Unknown',
      hypocenter: { name: q.name, latitude: q.lat, longitude: q.lon, depth: q.depth, magnitude: q.mag },
    },
    points: [],
  });
  if (q.scale >= 30) {
    // 震度速報 issued ~1 minute after origin: shaking known, hypocenter not yet.
    p2p.push({
      _id: id + 'p', code: 551, time: jst(q.time + 60_000),
      issue: { source: '気象庁', time: jst(q.time + 60_000), type: 'ScalePrompt', correct: 'None' },
      earthquake: {
        time: jst(q.time), maxScale: q.scale, domesticTsunami: 'Checking', foreignTsunami: 'Unknown',
        hypocenter: { name: '', latitude: -200, longitude: -200, depth: -1, magnitude: -1 },
      },
      points: [],
    });
  }
}

const usgsFeatures = [];
for (const q of quakes) {
  if (q.mag < 3.6 || rnd() < 0.25) continue;
  usgsFeatures.push({
    type: 'Feature', id: 'us7000' + Math.floor(rnd() * 1e6).toString(36),
    properties: {
      mag: round(q.mag + (rnd() - 0.6) * 0.4), place: `${Math.round(20 + rnd() * 80)} km E of somewhere, Japan`,
      time: q.time + Math.round((rnd() - 0.5) * 8000), magType: pick(['mb', 'mww', 'm']), tsunami: 0,
    },
    geometry: { type: 'Point', coordinates: [round(q.lon + (rnd() - 0.5) * 0.3, 3), round(q.lat + (rnd() - 0.5) * 0.3, 3), q.depth + round(rnd() * 6 - 3)] },
  });
}
// Offshore events outside JMA's report list.
for (const [lon, lat, place] of [[146.9, 43.6, 'Kuril Islands'], [142.1, 30.1, 'Izu Islands, Japan region'], [145.2, 40.4, 'off the east coast of Honshu, Japan']]) {
  usgsFeatures.push({
    type: 'Feature', id: 'us7000' + Math.floor(rnd() * 1e6).toString(36),
    properties: { mag: round(4.3 + rnd() * 0.8), place, time: BASE - Math.round(rnd() * 6 * DAY), magType: 'mb', tsunami: 0 },
    geometry: { type: 'Point', coordinates: [lon, lat, round(10 + rnd() * 40)] },
  });
}
const usgs = { type: 'FeatureCollection', metadata: { title: 'USGS Earthquakes (fixture)' }, features: usgsFeatures };

const BASE_TEMP = { sapporo: 7, sendai: 11, niigata: 12, tokyo: 16, kanazawa: 13, nagoya: 16, osaka: 17, hiroshima: 16, kochi: 18, fukuoka: 17, kagoshima: 19, naha: 24 };
const openMeteo = CITIES.map((c) => {
  const b = BASE_TEMP[c.id];
  const days = [...Array(7)].map((_, j) => new Date(BASE + 9 * HOUR + j * DAY).toISOString().slice(0, 10));
  const codes = days.map((_, j) => (c.id === 'naha' && j === 0 ? 95 : c.id === 'sapporo' && j === 3 ? 71 : pick([0, 1, 2, 3, 3, 61, 80])));
  const gustToday = c.id === 'naha' ? 78 : Math.round(15 + rnd() * 30);
  return {
    latitude: c.lat, longitude: c.lon, timezone: 'Asia/Tokyo',
    current: {
      time: new Date(BASE + 9 * HOUR).toISOString().slice(0, 16),
      temperature_2m: round(b + rnd() * 3), apparent_temperature: round(b - 1 + rnd() * 2),
      relative_humidity_2m: Math.round(55 + rnd() * 30), precipitation: c.id === 'naha' ? 9.4 : 0,
      weather_code: codes[0], wind_speed_10m: round(6 + rnd() * 18), wind_gusts_10m: gustToday,
    },
    daily: {
      time: days, weather_code: codes,
      temperature_2m_max: days.map(() => round(b + 4 + rnd() * 3)),
      temperature_2m_min: days.map(() => round(b - 4 - rnd() * 3)),
      precipitation_sum: codes.map((k, j) => (c.id === 'naha' && j === 0 ? 46.5 : k >= 60 ? round(rnd() * 25) : 0)),
      wind_gusts_10m_max: codes.map((_, j) => (j === 0 ? gustToday + 6 : Math.round(20 + rnd() * 35))),
      snowfall_sum: codes.map((k) => (k === 71 ? 6.3 : 0)),
    },
  };
});

const gdacs = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [131.2, 21.4] },
      properties: {
        eventtype: 'TC', eventid: 1001234, name: 'EXAMPLE-26', alertlevel: 'Orange', iscurrent: 'true',
        fromdate: new Date(BASE - 3 * DAY).toISOString(), todate: new Date(BASE).toISOString(),
        severitydata: { severity: 148, severitytext: 'Typhoon (maximum wind speed of 148 km/h)', severityunit: 'km/h' },
        url: { report: 'https://www.gdacs.org/report.aspx?eventtype=TC&eventid=1001234' },
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-75.0, 25.0] },
      properties: { eventtype: 'TC', eventid: 1009999, name: 'ATLANTIC-STORM', alertlevel: 'Green', iscurrent: 'true', severitydata: { severity: 90, severityunit: 'km/h' } },
    },
  ],
};

mkdirSync('fixtures', { recursive: true });
const write = (name, data) => writeFileSync(`fixtures/${name}`, JSON.stringify(data, null, 1) + '\n');
write('p2p-551.json', p2p);
write('p2p-552.json', []);
write('usgs.json', usgs);
write('open-meteo.json', openMeteo);
write('gdacs.json', gdacs);
console.log(`fixtures: ${p2p.length} JMA reports, ${usgsFeatures.length} USGS events, ${openMeteo.length} cities, ${gdacs.features.length} cyclones`);
