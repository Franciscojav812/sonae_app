/** Small view helpers shared by several panels. */
import { html, relativeTime, pickLang } from '../lib/format.js';
import { depthBand } from '../domain/quakes.js';
import { SHINDO_COLORS } from '../data/content.js';
import { PANEL_SOURCES, PROVIDERS } from '../data/provenance.js';

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

export const kindBadge = (kind, s) => html`<span class="badge ${kind === 'official' ? 'official' : 'model'}">${s.trust.kinds[kind]}</span>`;

/** "Source: JMA (via P2P地震情報) [Official] · See official information ↗" under a panel. */
export function provenanceLine(panel, ctx) {
  const p = PANEL_SOURCES[panel];
  const { s, lang } = ctx;
  const items = p.providers.map((id) => {
    const pr = PROVIDERS[id];
    return html`<span class="prov-item">${pickLang(pr.name, lang)}${pr.via ? html` <span class="muted">(${pickLang(pr.via, lang)})</span>` : ''} ${kindBadge(pr.kind, s)}</span>`;
  });
  return html`<p class="prov"><span class="prov-lbl">${s.trust.source}</span>${items}<a href="${p.official}" target="_blank" rel="noopener">${s.trust.viewOfficial} ↗</a></p>`;
}
