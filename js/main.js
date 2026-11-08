/**
 * Composition root: wires storage, data sources, the scheduler, the real-time
 * channel, the store and the views. No business rules live here.
 */
import { ALERT, BASEMAPS, ENDPOINTS, MAP_BOUNDS, POLL_MS, SOCKET } from './config.js';
import { STRINGS, detectLang } from './i18n.js';
import { createStorage } from './lib/storage.js';
import { formatJST, pickLang } from './lib/format.js';
import { createStore } from './store.js';
import { createSources } from './services/sources.js';
import { createScheduler } from './services/scheduler.js';
import { createRealtimeChannel } from './services/realtime.js';
import { computeHazards } from './domain/hazards.js';
import { assessConfidence, bannerState } from './domain/confidence.js';
import { normalizeP2PQuakes } from './domain/quakes.js';
import { normalizeTsunami } from './domain/tsunami.js';
import { normalizeEEW, isEewActive } from './domain/eew.js';
import { pendingAlerts } from './domain/alerts.js';
import { SHINDO_DESC } from './data/content.js';
import { overlayPainter, legendHtml, tooltipFor } from './ui/map.js';
import { createSlippyMap } from './ui/slippymap.js';
import { renderBand, renderTabs, TABS } from './ui/header.js';
import { createAlerter } from './ui/alerts.js';
import { overviewView } from './ui/views/overview.js';
import { quakesView } from './ui/views/quakes.js';
import { weatherView } from './ui/views/weather.js';
import { tsunamiView, typhoonView, missileView, volcanoView, guideView } from './ui/views/hazards.js';
import { sourcesView } from './ui/views/sources.js';

const VIEWS = {
  overview: overviewView, quakes: quakesView, tsunami: tsunamiView, typhoon: typhoonView,
  weather: weatherView, missile: missileView, volcano: volcanoView, guide: guideView, sources: sourcesView,
};

const $ = (sel) => document.querySelector(sel);
const storage = createStorage();
const forceDemo = new URLSearchParams(location.search).has('demo');
const prefs = storage.get('prefs', {});

const store = createStore({
  lang: detectLang(prefs.lang, navigator.language),
  tab: TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'overview',
  minMag: prefs.minMag ?? 3,
  city: prefs.city ?? 'tokyo',
  base: BASEMAPS[prefs.base] ? prefs.base : 'physical',
  layers: { quakes: true, weather: true, typhoons: true, volcanoes: false, trenches: true, ...prefs.layers },
  sound: false, // browsers only allow audio after a user gesture
  selectedQuake: null,
  socket: forceDemo ? 'demo' : 'connecting',
  sources: { quakes: null, tsunami: null, weather: null, typhoons: null },
  quakes: [],
  tsunami: { active: false, areas: [], issuedAt: null, highestGrade: null },
  weather: [],
  typhoons: [],
  eew: null,
  tick: 0,
});

const savePrefs = () => {
  const { lang, minMag, city, layers, base } = store.get();
  storage.set('prefs', { lang, minMag, city, layers, base });
};

/* ------------------------------------------------------------------ data */

const sources = createSources({ storage, forceDemo });
const meta = ({ status, fetchedAt, parts }) => ({ status, fetchedAt, parts });

const scheduler = createScheduler()
  .every('quakes', POLL_MS.quakes, async () => {
    const r = await sources.quakes();
    store.set((st) => ({ quakes: r.data, sources: { ...st.sources, quakes: meta(r) } }));
  })
  .every('tsunami', POLL_MS.tsunami, async () => {
    const r = await sources.tsunami();
    store.set((st) => ({ tsunami: r.data, sources: { ...st.sources, tsunami: meta(r) } }));
  })
  .every('weather', POLL_MS.weather, async () => {
    const r = await sources.weather();
    store.set((st) => ({ weather: r.data, sources: { ...st.sources, weather: meta(r) } }));
  })
  .every('typhoons', POLL_MS.typhoons, async () => {
    const r = await sources.typhoons();
    store.set((st) => ({ typhoons: r.data, sources: { ...st.sources, typhoons: meta(r) } }));
  });

/** Pushed quake: show it immediately, then re-sync both catalogues shortly after. */
let resyncTimer = null;
function onPushedQuake(msg) {
  const [q] = normalizeP2PQuakes([msg]);
  if (!q) return;
  store.set((st) => {
    const i = st.quakes.findIndex((x) => x.id === q.id);
    const quakes = i >= 0 ? st.quakes.map((x, j) => (j === i ? { ...x, ...q, sources: x.sources } : x)) : [q, ...st.quakes];
    return { quakes };
  });
  clearTimeout(resyncTimer);
  resyncTimer = setTimeout(() => scheduler.runNow('quakes'), 8000);
}

const channel = createRealtimeChannel({
  url: ENDPOINTS.p2pSocket,
  ...SOCKET,
  onStatus: ({ state }) => store.set({ socket: state }),
  onMessage(msg) {
    if (msg.code === 551) onPushedQuake(msg);
    if (msg.code === 552) store.set({ tsunami: normalizeTsunami([msg], Date.now(), 36 * 3_600_000) });
    if (msg.code === 556) {
      const eew = normalizeEEW(msg);
      if (eew && !eew.test) {
        store.set({ eew });
        setTimeout(() => store.set((st) => ({ tick: st.tick + 1 })), 3 * 60_000 + 500); // expire banner
      }
    }
  },
});

/* ---------------------------------------------------------------- alerts */

const alerter = createAlerter({
  banner: $('#alert'), title: $('#alertTitle'), body: $('#alertBody'),
  isSoundOn: () => store.get().sound,
});
const seenAlerts = new Set(storage.get('seenAlerts', []));

function fireAlerts(state, s, now) {
  const demo = state.sources.quakes?.status === 'demo';
  const [next] = pendingAlerts({ ...state, demo }, seenAlerts, now, ALERT);
  if (!next) return;
  seenAlerts.add(next.id);
  storage.set('seenAlerts', [...seenAlerts].slice(-100));

  if (next.kind === 'eew') {
    const h = next.eew.hypocenter;
    const areas = next.eew.areas.slice(0, 6).map((a) => a.name).join('・');
    alerter.show({ kind: 'eew', heading: s.eew.title, detail: `${h.name}${h.magnitude ? ` M${h.magnitude}` : ''} — ${s.eew.body}${areas ? ` (${areas})` : ''}` });
  } else if (next.kind === 'quake') {
    const q = next.quake;
    alerter.show({ kind: 'quake', heading: `${s.alerts.quake} M${q.magnitude.toFixed(1)}`, detail: `${q.place}${q.maxShindo ? ` · ${s.quakes.shindoWord} ${q.maxShindo}` : ''}` });
  } else {
    alerter.show({ kind: 'tsunami', heading: s.tsunami.grades[next.tsunami.highestGrade], detail: next.tsunami.areas.slice(0, 5).map((a) => a.name).join('、') });
  }
}

/* ---------------------------------------------------------------- render */

const lookup = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);

function render(state) {
  const now = Date.now();
  const s = STRINGS[state.lang];
  const eewActive = isEewActive(state.eew, now);
  const hazards = computeHazards(state, now);
  const confidence = assessConfidence(state.sources);
  const banner = bannerState(hazards.overall, confidence);
  const ctx = { state, s, lang: state.lang, now, hazards, eewActive, confidence, banner };

  document.documentElement.lang = state.lang;
  for (const el of document.querySelectorAll('[data-i]')) el.textContent = lookup(s, el.dataset.i) ?? '';
  for (const b of document.querySelectorAll('[data-lang]')) b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang));
  $('#sound').textContent = state.sound ? s.soundOn : s.soundOff;
  $('#sound').setAttribute('aria-pressed', String(state.sound));
  $('#refresh').textContent = `↻ ${s.refresh}`;
  $('#net').dataset.state = state.socket;
  $('#netLabel').textContent = state.socket === 'demo' ? s.status.demo : s.socket[state.socket] ?? '';

  const band = renderBand(ctx);
  $('#level').dataset.level = String(band.overall);
  $('#overallVal').textContent = band.label;
  $('#overallSub').textContent = band.sub;
  $('#chips').innerHTML = String(band.chips);
  $('#tabs').innerHTML = String(renderTabs(ctx));

  painter = overlayPainter(ctx);
  map.redraw();
  $('#legend').innerHTML = String(legendHtml(s));
  for (const b of document.querySelectorAll('[data-base]')) {
    b.textContent = BASEMAPS[b.dataset.base].label[state.lang];
    b.setAttribute('aria-pressed', String(b.dataset.base === state.base));
  }
  for (const b of document.querySelectorAll('[data-layer]')) b.setAttribute('aria-pressed', String(state.layers[b.dataset.layer]));

  const focused = document.activeElement?.id;
  const panel = $('#panel');
  panel.setAttribute('aria-labelledby', `tab-${state.tab}`);
  panel.innerHTML = String(VIEWS[state.tab](ctx));
  if (focused === 'minmag') $('#minmag')?.focus();

  fireAlerts(state, s, now);
}

/* ------------------------------------------------------------------- map */

let painter = () => '';
const map = createSlippyMap($('#map'), {
  basemaps: BASEMAPS,
  base: store.get().base,
  bounds: MAP_BOUNDS,
  drawOverlay: (project, view) => painter(project, view),
});

store.subscribe(render);

/* ---------------------------------------------------------------- events */

function selectTab(tab) {
  if (!TABS.includes(tab)) return;
  history.replaceState(null, '', `#${tab}`);
  store.set({ tab });
}

document.addEventListener('click', (e) => {
  const t = e.target;
  const lang = t.closest('[data-lang]');
  if (lang) { store.set({ lang: lang.dataset.lang }); savePrefs(); return; }

  const tab = t.closest('[data-tab]');
  if (tab) { selectTab(tab.dataset.tab); return; }

  const layer = t.closest('[data-layer]');
  if (layer) {
    store.set((st) => ({ layers: { ...st.layers, [layer.dataset.layer]: !st.layers[layer.dataset.layer] } }));
    savePrefs();
    return;
  }

  const base = t.closest('[data-base]');
  if (base) { map.setBase(base.dataset.base); store.set({ base: base.dataset.base }); savePrefs(); return; }

  const quake = t.closest('[data-quake]');
  if (quake) {
    const id = quake.dataset.quake;
    const q = store.get().quakes.find((x) => x.id === id);
    store.set((st) => ({ selectedQuake: st.selectedQuake === id ? null : id, tab: 'quakes' }));
    history.replaceState(null, '', '#quakes');
    if (t.closest('#map')) requestAnimationFrame(() => document.querySelector(`.qi[data-quake="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest' }));
    else if (q) map.flyTo([q.lon, q.lat], 7);
    return;
  }

  const city = t.closest('[data-city]');
  if (city) { store.set({ city: city.dataset.city, tab: 'weather' }); history.replaceState(null, '', '#weather'); savePrefs(); return; }

  if (t.closest('#sound')) {
    const on = !store.get().sound;
    store.set({ sound: on });
    if (on) { alerter.enableSound(); alerter.test(); }
    return;
  }
  if (t.closest('#refresh')) { scheduler.runNow(); return; }
  if (t.closest('#alertOk')) alerter.dismiss();
});

document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.qi')) { e.preventDefault(); e.target.click(); }
  if (e.key === 'Escape') alerter.dismiss();
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'minmag') { store.set({ minMag: Number(e.target.value) }); savePrefs(); }
});

const describeShindo = (e) => {
  const b = e.target.closest?.('[data-shindo]');
  if (b) $('#scaleDesc').textContent = pickLang(SHINDO_DESC[b.dataset.shindo], store.get().lang);
};
document.addEventListener('mouseover', describeShindo);
document.addEventListener('focusin', describeShindo);

const tip = $('#tip');
const mapWrap = $('.mapwrap');
$('#map').addEventListener('mousemove', (e) => {
  const el = e.target.closest('[data-quake],[data-volcano],[data-city]');
  if (e.buttons) { tip.hidden = true; return; }
  const state = store.get();
  const content = el && tooltipFor(el, { state, s: STRINGS[state.lang], lang: state.lang });
  if (!content) { tip.hidden = true; return; }
  tip.innerHTML = String(content);
  tip.hidden = false;
  const r = mapWrap.getBoundingClientRect();
  let x = e.clientX - r.left + 14;
  if (x + 250 > r.width) x -= 270;
  tip.style.left = `${Math.max(4, x)}px`;
  tip.style.top = `${e.clientY - r.top + 14}px`;
});
$('#map').addEventListener('mouseleave', () => { tip.hidden = true; });
addEventListener('hashchange', () => selectTab(location.hash.slice(1)));

/* ----------------------------------------------------------------- clock */

function tickClock() {
  const { lang } = store.get();
  const n = Date.now();
  $('#jst').textContent = formatJST(n, lang, { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  $('#jstdate').textContent = `${formatJST(n, lang, { month: 'short', day: 'numeric', weekday: 'short' })} · JST`;
}
setInterval(tickClock, 1000);
tickClock();
// Relative times ("5 min ago") drift: refresh them twice a minute.
setInterval(() => store.set((st) => ({ tick: st.tick + 1 })), 30_000);

/* ------------------------------------------------------------------ boot */

render(store.get());
scheduler.start();
if (!forceDemo) channel.start();

// Offline app shell. Skipped where service workers are unavailable (file://, sandboxed previews).
if ('serviceWorker' in navigator && window.isSecureContext) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
