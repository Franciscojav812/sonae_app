/** Small view helpers shared by several panels. */
import { html, relativeTime } from '../lib/format.js';
import { depthBand } from '../domain/quakes.js';
import { SHINDO_COLORS } from '../data/content.js';

export const levelColor = (level) => `var(--lv${level})`;
export const levelInk = (level) => (level === 1 ? '#1a1405' : '#fff');
export const depthColor = (depthKm) => `var(--d${depthBand(depthKm)})`;
export const cityName = (city, lang) => city[lang] ?? city.en;

/** Badge telling the user how fresh a panel's data is. */
export function statusBadge(meta, ctx) {
  const st = meta?.status ?? 'loading';
  return html`<span class="badge ${st}" title="${meta?.fetchedAt ? relativeTime(meta.fetchedAt, ctx.now, ctx.lang) : ''}">${ctx.s.status[st]}</span>`;
}

/** Explains degraded data (cached, demo or partially unavailable) below a panel. */
export function sourceNote(meta, ctx) {
  if (!meta) return '';
  const notes = [];
  if (meta.status === 'demo') notes.push(ctx.s.demoNote);
  if (meta.status === 'cached') notes.push(ctx.s.cachedNote(relativeTime(meta.fetchedAt, ctx.now, ctx.lang)));
  const down = Object.entries(meta.parts ?? {}).filter(([, v]) => v === 'error').map(([k]) => k);
  if (down.length && meta.status !== 'demo') notes.push(ctx.s.partial(down.join(', ')));
  return notes.map((n) => html`<p class="note">${n}</p>`);
}

export function shindoChip(shindo, title = '') {
  const [bg, fg] = SHINDO_COLORS[shindo] ?? [];
  return html`<div class="shindo" title="${title}" style="${bg ? `background:${bg};color:${fg}` : ''}">${shindo ?? '–'}</div>`;
}
