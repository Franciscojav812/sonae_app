/**
 * Central configuration: every endpoint, interval and threshold lives here,
 * so behaviour can be tuned without touching domain or UI code.
 */
import { CITIES } from './data/cities.js';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const ENDPOINTS = {
  /** USGS FDSN event service, limited to a box around the Japanese archipelago. */
  usgs: (sinceIso) =>
    'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson' +
    `&starttime=${sinceIso}&minlatitude=20&maxlatitude=50&minlongitude=120&maxlongitude=156` +
    '&minmagnitude=2.5&orderby=time&limit=400',
  /** JMA earthquake reports (code 551) relayed by the P2P地震情報 project. */
  p2pQuakes: 'https://api.p2pquake.net/v2/history?codes=551&limit=100',
  /** JMA tsunami forecasts (code 552). */
  p2pTsunami: 'https://api.p2pquake.net/v2/history?codes=552&limit=5',
  /** Push channel: 551 quakes, 552 tsunami, 556 Earthquake Early Warning (緊急地震速報). */
  p2pSocket: 'wss://api.p2pquake.net/v2/ws',
  openMeteo: (cities = CITIES) =>
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${cities.map((c) => c.lat).join(',')}` +
    `&longitude=${cities.map((c) => c.lon).join(',')}` +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max,snowfall_sum' +
    '&timezone=Asia%2FTokyo&forecast_days=7',
  gdacs: (fromDate, toDate) =>
    'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=TC' +
    `&fromdate=${fromDate}&todate=${toDate}&alertlevel=green;orange;red`,
};

/** Each source refreshes at the pace its data actually changes. */
export const POLL_MS = {
  quakes: 1 * MINUTE,
  tsunami: 1 * MINUTE,
  weather: 10 * MINUTE,
  typhoons: 30 * MINUTE,
};

/** How old a cached response may be and still be shown (flagged as "cached"). */
export const MAX_STALE_MS = {
  quakes: 6 * HOUR,
  tsunami: 1 * HOUR,
  weather: 12 * HOUR,
  typhoons: 24 * HOUR,
};

export const HTTP = { timeoutMs: 9000, retries: 2, backoffMs: 800 };

export const QUAKE_WINDOW_MS = 7 * DAY;

/** A USGS event is the same quake as a JMA report when both are this close. */
export const MERGE = { windowMs: 2 * MINUTE, radiusKm: 120 };

export const TOKYO = { lat: 35.68, lon: 139.69 };

export const TYPHOON_BBOX = { latMin: 5, latMax: 50, lonMin: 110, lonMax: 165 };

/** Pop-up alert rules. */
export const ALERT = {
  minShindo: '5-',
  minMagnitude: 6,
  maxAgeMs: 30 * MINUTE,
};

/** Reconnect policy for the push channel. */
export const SOCKET = { baseDelayMs: 1000, maxDelayMs: 60_000 };

export const TIME = { MINUTE, HOUR, DAY };

/**
 * Base maps: free XYZ tiles that need no API key, each with its required attribution.
 * "physical" switches provider by zoom: Esri's atlas-style relief for the country
 * view, OpenTopoMap for detail.
 */
export const BASEMAPS = {
  physical: {
    label: { ja: '地形', es: 'Físico', en: 'Physical' },
    layers: [
      { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}', maxZoom: 8 },
      { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', minZoom: 9, maxZoom: 17 },
    ],
    attribution: 'Tiles © Esri — US National Park Service · © <a href="https://opentopomap.org" target="_blank" rel="noopener">OpenTopoMap</a> (CC-BY-SA), © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  },
  satellite: {
    label: { ja: '衛星', es: 'Satélite', en: 'Satellite' },
    layers: [{ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', maxZoom: 18 }],
    attribution: 'Tiles © Esri — Maxar, Earthstar Geographics, and the GIS User Community',
  },
  gsi: {
    label: { ja: '地理院地図', es: 'GSI (oficial)', en: 'GSI (official)' },
    layers: [{ url: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', minZoom: 2, maxZoom: 18 }],
    attribution: '出典: <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">国土地理院</a> (GSI Japan)',
  },
  offlineAttribution: 'Offline · simplified coastline',
};

/** Initial view: the whole archipelago, Hokkaido to Yaeyama. */
export const MAP_BOUNDS = [[123, 24], [146.5, 45.6]];

/** Timestamp the fixtures are generated around (scripts/make-fixtures.mjs). */
export const DEMO_ANCHOR = Date.UTC(2026, 10, 8, 0, 0, 0);
