/** Hazard overlay drawn on top of the slippy map: quakes, weather, typhoons, volcanoes, EEW. */
import { html, raw, formatJST, pickLang } from '../lib/format.js';
import { pixelsPerKm } from '../lib/mercator.js';
import { ISLANDS, TRENCHES } from '../data/geography.js';
import { VOLCANOES } from '../data/content.js';
import { weatherFlags, weatherGlyph } from '../domain/weather.js';
import { cityName, depthColor, levelColor } from './common.js';

/** Marker radius grows exponentially with magnitude, as released energy does. */
export const quakeRadius = (m, zoom = 5) => Math.max(3, 1.7 ** m * 0.55) * (1 + Math.max(0, zoom - 5) * 0.12);

const pathOf = (project, pts, close = false) =>
  pts.map(([lon, lat], i) => {
    const [x, y] = project(lon, lat);
    return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join('') + (close ? 'Z' : '');

const onScreen = ([x, y], view, margin = 80) => x > -margin && y > -margin && x < view.width + margin && y < view.height + margin;

/** Returns the overlay painter for the current state; the map calls it on every pan or zoom. */
export function overlayPainter(ctx) {
  const { state, lang, now } = ctx;
  const L = state.layers;
  const quakes = L.quakes ? state.quakes.filter((q) => q.magnitude >= state.minMag).sort((a, b) => a.time - b.time) : [];
  const newest = quakes.at(-1);
  const eew = ctx.eewActive ? state.eew : null;

  return (project, view) => {
    const out = [];

    // Without tiles (offline / blocked) draw the coastline so the map is never blank.
    if (view.offline) for (const isl of ISLANDS) out.push(raw(`<path class="m-land" d="${pathOf(project, isl, true)}"/>`));

    if (L.trenches) {
      for (const t of TRENCHES) {
        const mid = project(...t.pts[Math.floor(t.pts.length / 2)]);
        out.push(html`<path class="m-trench" d="${pathOf(project, t.pts)}"/>`);
        if (view.zoom >= 5) out.push(html`<text class="m-label m-trenchlbl" x="${mid[0] + 8}" y="${mid[1]}">${lang === 'ja' ? t.ja : t.en}</text>`);
      }
    }

    if (L.volcanoes) {
      VOLCANOES.forEach((v, i) => {
        const [x, y] = project(v.lon, v.lat);
        if (!onScreen([x, y], view)) return;
        out.push(html`<path class="m-volc" data-volcano="${i}" d="M${x} ${y - 8}L${x + 7} ${y + 5}L${x - 7} ${y + 5}Z"/>`);
      });
    }

    if (L.typhoons) {
      for (const ty of state.typhoons) {
        const [x, y] = project(ty.lon, ty.lat);
        const r = Math.max(14, 300 * pixelsPerKm(ty.lat, view.zoom)); // ~300 km gale radius, indicative
        out.push(html`<circle class="m-ty-area" cx="${x}" cy="${y}" r="${r.toFixed(1)}"/><circle class="m-ty" cx="${x}" cy="${y}" r="7"/><text class="m-label m-tylbl" x="${x + 12}" y="${y + 4}">${ty.name}</text>`);
      }
    }

    if (L.weather) {
      for (const w of state.weather) {
        const p = project(w.city.lon, w.city.lat);
        if (!onScreen(p, view)) continue;
        const flags = weatherFlags(w);
        const lv = flags.length ? Math.max(...flags.map((f) => f.level)) : 0;
        out.push(html`<g class="m-city" data-city="${w.city.id}"><circle cx="${p[0]}" cy="${p[1]}" r="4"/><text class="m-label" x="${p[0] + 7}" y="${p[1] - 4}">${cityName(w.city, lang)}</text><text class="m-label m-temp${lv ? ' warn' : ''}" x="${p[0] + 7}" y="${p[1] + 10}" style="${lv ? `--lv:${levelColor(lv)}` : ''}">${Math.round(w.current.temp)}° ${weatherGlyph(w.current.code)}</text></g>`);
      }
    }

    for (const q of quakes) {
      const p = project(q.lon, q.lat);
      if (!onScreen(p, view)) continue;
      const r = quakeRadius(q.magnitude, view.zoom);
      if (q === newest && now - q.time < 6 * 3_600_000) out.push(html`<circle class="m-pulse" cx="${p[0]}" cy="${p[1]}" r="${r}" stroke="${depthColor(q.depthKm)}"/>`);
      out.push(html`<circle class="m-q${state.selectedQuake === q.id ? ' sel' : ''}" data-quake="${q.id}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r.toFixed(1)}" fill="${depthColor(q.depthKm)}"/>`);
    }

    if (eew?.hypocenter.lat != null) {
      const [x, y] = project(eew.hypocenter.lon, eew.hypocenter.lat);
      const r = 150 * pixelsPerKm(eew.hypocenter.lat, view.zoom);
      out.push(html`<circle class="m-eew" cx="${x}" cy="${y}" r="${r}"/><circle class="m-pulse" cx="${x}" cy="${y}" r="12" stroke="#d40000"/>`);
    }
    return String(html`${out}`);
  };
}

export function legendHtml(s) {
  const bands = ['0–30 km', '30–70', '70–150', '150–300', '300+'];
  return html`<span class="lg-title">${s.quakes.depth}</span>${bands.map((b, i) => html`<span><i style="--c:var(--d${i + 1})"></i>${b}</span>`)}<span>${s.map.size}</span>`;
}

/** Tooltip markup for whichever overlay element the pointer is over. */
export function tooltipFor(el, ctx) {
  const { state, lang, s } = ctx;
  if (el.dataset.quake) {
    const q = state.quakes.find((x) => x.id === el.dataset.quake);
    if (!q) return null;
    return html`<b>M${q.magnitude.toFixed(1)}</b> · ${q.place}<br>${s.quakes.depth} ${q.depthKm ?? '?'} km${q.maxShindo ? html` · ${s.quakes.shindoWord} ${q.maxShindo}` : ''}<br><span class="muted">${formatJST(q.time, lang, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} JST · ${q.sources.join(' + ')}</span>`;
  }
  if (el.dataset.volcano) {
    const v = VOLCANOES[+el.dataset.volcano];
    return html`<b>${lang === 'ja' ? v.ja : v.en}</b><br>${pickLang(v.note, lang)}`;
  }
  const cityEl = el.closest?.('[data-city]');
  if (cityEl) {
    const w = state.weather.find((x) => x.city.id === cityEl.dataset.city);
    if (!w) return null;
    return html`<b>${cityName(w.city, lang)}</b> ${w.current.temp}°C ${weatherGlyph(w.current.code)}<br>${s.weather.wind} ${Math.round(w.current.wind)} km/h · ${s.weather.gust} ${Math.round(w.current.gust)} km/h`;
  }
  return null;
}
