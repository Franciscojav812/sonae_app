import { html } from '../../lib/format.js';
import { weatherFlags, weatherGlyph } from '../../domain/weather.js';
import { cityName, levelColor, levelInk, statusBadge, sourceNote, provenanceLine } from '../common.js';

function forecast(w, ctx) {
  const { s, lang } = ctx;
  const lo = Math.min(...w.daily.map((d) => d.min));
  const hi = Math.max(...w.daily.map((d) => d.max));
  const span = Math.max(1, hi - lo);
  const weekday = new Intl.DateTimeFormat(lang === 'ja' ? 'ja-JP' : lang, { weekday: 'short', timeZone: 'Asia/Tokyo' });
  return html`
  <div class="card"><h3>${cityName(w.city, lang)} · ${s.weather.detail}</h3>
    <div class="kv">
      <div><b>${w.current.temp}°</b><span>${s.weather.feels} ${w.current.feels}°</span></div>
      <div><b>${w.current.humidity}%</b><span>${s.weather.humidity}</span></div>
      <div><b>${Math.round(w.current.wind)}</b><span>${s.weather.wind} km/h</span></div>
      <div><b>${Math.round(w.current.gust)}</b><span>${s.weather.gust} km/h</span></div>
    </div>
    <div class="days">${w.daily.map((d) => html`
      <div class="day"><span class="muted">${weekday.format(new Date(`${d.date}T12:00:00+09:00`))}</span>
        <span class="ic" aria-hidden="true">${weatherGlyph(d.code)}</span>
        <span class="mono">${Math.round(d.max)}°</span>
        <span class="bar"><i style="top:${(((hi - d.max) / span) * 100).toFixed(0)}%;bottom:${(((d.min - lo) / span) * 100).toFixed(0)}%"></i></span>
        <span class="mono muted">${Math.round(d.min)}°</span>
        <span class="mono rain">${d.precip > 0 ? `${d.precip.toFixed(0)}mm` : '·'}</span></div>`)}
    </div>
  </div>`;
}

export function weatherView(ctx) {
  const { state, s, lang } = ctx;
  const selected = state.weather.find((w) => w.city.id === state.city) ?? state.weather[0];
  const cards = state.weather.map((w) => html`
    <button class="wc" data-city="${w.city.id}" aria-pressed="${w.city.id === selected?.city.id}">
      <span class="c"><b>${cityName(w.city, lang)}</b><span aria-hidden="true">${weatherGlyph(w.current.code)}</span></span>
      <span class="t">${Math.round(w.current.temp)}°</span>
      <span class="m">${s.weather.humidity} ${w.current.humidity}% · ${s.weather.gust} ${Math.round(w.current.gust)}</span>
      <span class="flags">${weatherFlags(w).map((f) => html`<span class="flag" style="background:${levelColor(f.level)};color:${levelInk(f.level)}">${s.weather.flags[f.kind]}</span>`)}</span>
    </button>`);
  return html`
  <div class="card"><h3>${s.weather.title}<span class="src">${statusBadge(state.sources.weather, ctx)}</span></h3>
    <p class="model-note">${s.trust.weatherModel}</p>
    <div class="wgrid">${cards}</div>${sourceNote(state.sources.weather, ctx)}
    ${provenanceLine('weather', ctx)}
  </div>
  ${selected ? forecast(selected, ctx) : ''}`;
}
