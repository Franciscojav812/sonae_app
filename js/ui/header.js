/** Threat band (overall level + one chip per hazard) and the tab bar. */
import { html, formatJST } from '../lib/format.js';
import { cityName, levelColor } from './common.js';

export const TABS = ['overview', 'quakes', 'tsunami', 'typhoon', 'weather', 'missile', 'volcano', 'guide', 'sources'];
const HAZARD_TAB = { quake: 'quakes', tsunami: 'tsunami', typhoon: 'typhoon', weather: 'weather', missile: 'missile', volcano: 'volcano' };
/** Feed behind each hazard chip, to flag chips whose data is not live. */
const HAZARD_FEED = { quake: 'quakes', tsunami: 'tsunami', typhoon: 'typhoons', weather: 'weather' };

function chipText(key, h, ctx) {
  const { s, lang } = ctx;
  const feedStatus = ctx.state.sources[HAZARD_FEED[key]]?.status;
  // Never show a reassuring "normal" for a feed we could not read.
  if (HAZARD_FEED[key] && h[key].level === 0 && feedStatus && feedStatus !== 'live' && feedStatus !== 'cached') return s.status[feedStatus];
  switch (key) {
    case 'quake': {
      const q = h.quake.top;
      if (ctx.eewActive) return s.eew.title;
      return q ? `M${q.magnitude.toFixed(1)}${q.maxShindo ? ` · ${s.quakes.shindoWord} ${q.maxShindo}` : ''}` : '—';
    }
    case 'tsunami': return h.tsunami.grade ? s.tsunami.grades[h.tsunami.grade] : s.levels[0];
    case 'typhoon': return h.typhoon.top ? `${h.typhoon.top.name} · ${h.typhoon.top.distanceKm.toLocaleString()} km` : '—';
    case 'weather': return h.weather.city ? `${cityName(h.weather.city, lang)} · ${s.weather.flags[h.weather.kind]}` : s.levels[0];
    case 'missile': return s.missile.state;
    case 'volcano': return `16 ${s.volcano.count}`;
    default: return '';
  }
}

export function renderBand(ctx) {
  const { s, hazards: h, state, banner, confidence } = ctx;
  const keys = Object.keys(HAZARD_TAB);
  const updated = Math.max(0, ...Object.values(state.sources).map((m) => m?.fetchedAt ?? 0));
  const offline = [...confidence.missing, ...confidence.degraded].map((f) => s.trust.feeds[f]).join('、');
  const notes = { demo: s.trust.demoNote, partial: s.trust.partialNote(offline), none: s.trust.noneNote };
  const loading = !updated;
  return {
    overall: loading ? 'unconfirmed' : banner.level,
    label: loading ? s.status.loading : banner.level === 'unconfirmed' ? s.trust.unconfirmed : s.levels[banner.level],
    sub: loading ? '' : notes[banner.note] ?? `${s.updated} ${formatJST(updated, ctx.lang, { hour: '2-digit', minute: '2-digit' })} JST`,
    chips: html`${keys.map((k) => {
      const lv = h[k].level;
      return html`<button class="chip" data-tab="${HAZARD_TAB[k]}" style="--c:${levelColor(lv)}"><span class="h">${s.hazards[k]} · ${s.levels[lv]}</span><span class="s">${chipText(k, h, ctx)}</span></button>`;
    })}`,
  };
}

export function renderTabs(ctx) {
  const { s, hazards: h, state } = ctx;
  const levelOf = Object.fromEntries(Object.entries(HAZARD_TAB).map(([k, t]) => [t, h[k].level]));
  return html`${TABS.map((t) => {
    const lv = levelOf[t] ?? 0;
    return html`<button class="tab" role="tab" id="tab-${t}" aria-controls="panel" aria-selected="${state.tab === t}" data-tab="${t}">${s.tabs[t]}${lv > 0 ? html`<span class="dot" style="--c:${levelColor(lv)}"></span>` : ''}</button>`;
  })}`;
}
