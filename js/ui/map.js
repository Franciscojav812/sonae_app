/** Schematic SVG map: coastlines, trenches, quakes, weather, typhoons, volcanoes, EEW. */
import { html, raw, formatJST, pickLang } from '../lib/format.js';
import { project, VIEWBOX } from '../lib/geo.js';
import { ISLANDS, TRENCHES } from '../data/geography.js';
import { VOLCANOES } from '../data/content.js';
import { weatherFlags, weatherGlyph } from '../domain/weather.js';
import { cityName, depthColor, levelColor } from './common.js';

const pathOf = (pts, close = false) =>
  pts.map(([lon, lat], i) => {
    const [x, y] = project(lon, lat);
    return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join('') + (close ? 'Z' : '');

/** Marker radius grows exponentially with magnitude, as energy does. */
export const quakeRadius = (m) => Math.max(2.5, 1.75 ** m * 0.55);

// The coastline never changes: build it once.
const BASE = (() => {
  const g = [];
  for (let lon = 125; lon <= 150; lon += 5) {
    const [x] = project(lon, 0);
    g.push(`<line class="grat" x1="${x}" y1="0" x2="${x}" y2="${VIEWBOX.height}"/><text class="gratlbl" x="${x + 3}" y="${VIEWBOX.height - 6}">${lon}°E</text>`);
  }
  for (let lat = 25; lat <= 45; lat += 5) {
    const [, y] = project(0, lat);
    g.push(`<line class="grat" x1="0" y1="${y}" x2="${VIEWBOX.width}" y2="${y}"/><text class="gratlbl" x="4" y="${y - 3}">${lat}°N</text>`);
  }
  return g.join('');
})();
const LAND = ISLANDS.map((isl) => `<path class="land" d="${pathOf(isl, true)}"/>`).join('');

export function renderMap(ctx) {
  const { state, lang, s } = ctx;
  const L = state.layers;
  const parts = [raw(BASE)];

  if (L.trenches) {
    for (const t of TRENCHES) {
      const [x, y] = project(...t.pts[Math.floor(t.pts.length / 2)]);
      parts.push(html`<path class="trench" d="${pathOf(t.pts)}"/><text class="trenchlbl" x="${x + 8}" y="${y}">${lang === 'ja' ? t.ja : t.en}</text>`);
    }
  }
  parts.push(raw(LAND));

  if (L.volcanoes) {
    VOLCANOES.forEach((v, i) => {
      const [x, y] = project(v.lon, v.lat);
      parts.push(html`<path class="volc" data-volcano="${i}" tabindex="-1" d="M${x} ${y - 7}L${x + 6} ${y + 4}L${x - 6} ${y + 4}Z"/>`);
    });
  }

  if (L.typhoons) {
    for (const ty of state.typhoons) {
      const [x, y] = project(ty.lon, ty.lat);
      parts.push(html`<circle class="ty" cx="${x}" cy="${y}" r="16"/><circle class="ty" cx="${x}" cy="${y}" r="5" style="fill:var(--lv3)"/><text class="tylbl" x="${x + 20}" y="${y + 4}">${ty.name}</text>`);
    }
  }

  if (L.weather) {
    for (const w of state.weather) {
      const [x, y] = project(w.city.lon, w.city.lat);
      const flags = weatherFlags(w);
      const color = flags.length ? levelColor(Math.max(...flags.map((f) => f.level))) : 'var(--d4)';
      parts.push(html`<circle class="city" data-city="${w.city.id}" cx="${x}" cy="${y}" r="3.5"/><text class="citylbl" x="${x + 6}" y="${y - 5}">${cityName(w.city, lang)}</text><text class="temp" x="${x + 6}" y="${y + 9}" fill="${color}">${Math.round(w.current.temp)}° ${weatherGlyph(w.current.code)}</text>`);
    }
  }

  if (L.quakes) {
    const visible = state.quakes.filter((q) => q.magnitude >= state.minMag).sort((a, b) => a.time - b.time);
    const newest = visible.at(-1);
    for (const q of visible) {
      const [x, y] = project(q.lon, q.lat);
      const r = quakeRadius(q.magnitude);
      if (q === newest && ctx.now - q.time < 6 * 3_600_000) {
        parts.push(html`<circle class="pulse" cx="${x}" cy="${y}" r="${r}" stroke="${depthColor(q.depthKm)}"/>`);
      }
      parts.push(html`<circle class="q${state.selectedQuake === q.id ? ' sel' : ''}" data-quake="${q.id}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${depthColor(q.depthKm)}"/>`);
    }
  }

  const eew = ctx.eewActive ? state.eew : null;
  if (eew?.hypocenter.lat != null) {
    const [x, y] = project(eew.hypocenter.lon, eew.hypocenter.lat);
    parts.push(html`<circle class="eew" cx="${x}" cy="${y}" r="60"/><circle class="pulse" cx="${x}" cy="${y}" r="14" stroke="var(--lv2)"/>`);
  }

  const legend = html`${[1, 2, 3, 4, 5].map((b, i) => html`<span><i style="--c:var(--d${b})"></i>${['0–30 km', '30–70', '70–150', '150–300', '300+'][i]}</span>`)}<span>${s.map.size}</span>`;
  return { svg: html`${parts}`, legend };
}

/** Tooltip markup for whichever map element the pointer is over. */
export function tooltipFor(el, ctx) {
  const { state, lang, s } = ctx;
  if (el.dataset.quake) {
    const q = state.quakes.find((x) => x.id === el.dataset.quake);
    if (!q) return null;
    return html`<b class="mono">M${q.magnitude.toFixed(1)}</b> · ${q.place}<br>${s.quakes.depth} ${q.depthKm ?? '?'} km${q.maxShindo ? html` · ${s.quakes.shindoWord} ${q.maxShindo}` : ''}<br><span class="muted">${formatJST(q.time, lang, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} JST · ${q.sources.join('+')}</span>`;
  }
  if (el.dataset.volcano) {
    const v = VOLCANOES[+el.dataset.volcano];
    return html`<b>${lang === 'ja' ? v.ja : v.en}</b><br>${pickLang(v.note, lang)}`;
  }
  if (el.dataset.city) {
    const w = state.weather.find((x) => x.city.id === el.dataset.city);
    if (!w) return null;
    return html`<b>${cityName(w.city, lang)}</b> ${w.current.temp}°C ${weatherGlyph(w.current.code)}<br>${s.weather.wind} ${Math.round(w.current.wind)} · ${s.weather.gust} ${Math.round(w.current.gust)} km/h`;
  }
  return null;
}
