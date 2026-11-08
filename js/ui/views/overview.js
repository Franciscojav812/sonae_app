import { html, relativeTime } from '../../lib/format.js';
import { shindoIndex } from '../../domain/quakes.js';
import { weatherFlags } from '../../domain/weather.js';
import { cityName, depthColor, levelColor, statusBadge, sourceNote } from '../common.js';

/** Merges every source into one 24-hour feed of what matters. */
function significantEvents(ctx) {
  const { state, s, lang, now } = ctx;
  const events = [];
  for (const q of state.quakes) {
    if (now - q.time > 86_400_000) continue;
    if (q.magnitude < 4 && shindoIndex(q.maxShindo) < shindoIndex('3')) continue;
    events.push({ time: q.time, color: depthColor(q.depthKm), title: `${s.hazards.quake} M${q.magnitude.toFixed(1)} · ${q.place}`, sub: q.maxShindo ? `${s.quakes.shindo} ${q.maxShindo}` : `${s.quakes.depth} ${q.depthKm ?? '?'} km` });
  }
  if (state.tsunami.active) {
    events.push({ time: state.tsunami.issuedAt, color: 'var(--lv2)', title: s.tsunami.active, sub: state.tsunami.areas.slice(0, 3).map((a) => a.name).join('、') });
  }
  for (const ty of state.typhoons) {
    events.push({ time: state.sources.typhoons?.fetchedAt ?? now, color: 'var(--lv3)', title: `${s.hazards.typhoon} ${ty.name}`, sub: ty.windKmh ? `${ty.windKmh} km/h · ${ty.distanceKm.toLocaleString()} km` : '' });
  }
  for (const w of state.weather) {
    for (const f of weatherFlags(w)) {
      events.push({ time: state.sources.weather?.fetchedAt ?? now, color: levelColor(f.level), title: `${cityName(w.city, lang)} · ${s.weather.flags[f.kind]}`, sub: `${w.current.temp}°C · ${s.weather.gust} ${Math.round(w.current.gust)} km/h` });
    }
  }
  return events.sort((a, b) => b.time - a.time);
}

export function overviewView(ctx) {
  const { state, s, lang, now } = ctx;
  const events = significantEvents(ctx);
  const day = state.quakes.filter((q) => now - q.time <= 86_400_000);
  const felt = state.quakes.filter((q) => q.maxShindo);
  const topShindo = felt.reduce((a, b) => (shindoIndex(b.maxShindo) > shindoIndex(a?.maxShindo) ? b : a), null)?.maxShindo;
  const w = state.weather;

  return html`
  <div class="card"><h3>${s.overview.latest}<span class="src">${statusBadge(state.sources.quakes, ctx)}${statusBadge(state.sources.weather, ctx)}</span></h3>
    ${events.length
      ? html`<ul class="feed">${events.slice(0, 8).map((e) => html`<li><span class="k" style="--c:${e.color}"></span><div><b>${e.title}</b><br><small>${e.sub}</small></div><time>${relativeTime(e.time, now, lang)}</time></li>`)}</ul>`
      : html`<p class="lead muted">${s.overview.empty}</p>`}
  </div>
  <div class="card"><h3>${s.overview.stats}</h3><div class="kv">
    <div><b>${day.length}</b><span>${s.hazards.quake} · ${s.quakes.h24}</span></div>
    <div><b>${state.quakes.length}</b><span>${s.hazards.quake} · ${s.quakes.d7}</span></div>
    <div><b>${state.quakes.length ? Math.max(...state.quakes.map((q) => q.magnitude)).toFixed(1) : '–'}</b><span>${s.quakes.max} · ${s.quakes.d7}</span></div>
    <div><b>${topShindo ?? '–'}</b><span>${s.quakes.shindo} · ${s.quakes.d7}</span></div>
    <div><b>${w.length ? `${Math.round(Math.max(...w.map((x) => x.current.temp)))}°` : '–'}</b><span>${s.overview.hottest}</span></div>
    <div><b>${w.length ? Math.round(Math.max(...w.map((x) => x.current.gust))) : '–'}</b><span>${s.overview.maxGust}</span></div>
  </div></div>
  <div class="card"><h3>${s.tsunami.title}<span class="src">${statusBadge(state.sources.tsunami, ctx)}</span></h3>
    <p class="lead">${state.tsunami.active ? html`<b style="color:var(--lv2)">${s.tsunami.active}</b>` : s.tsunami.none}</p>
    <p class="note">${s.tsunami.rule}</p>${sourceNote(state.sources.tsunami, ctx)}
  </div>`;
}
