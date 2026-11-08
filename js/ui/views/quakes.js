import { html, formatJST, relativeTime, pickLang } from '../../lib/format.js';
import { SHINDO_ORDER } from '../../domain/quakes.js';
import { SHINDO_COLORS, SHINDO_DESC } from '../../data/content.js';
import { depthColor, shindoChip, statusBadge, sourceNote } from '../common.js';

/** Magnitude-over-time scatter for the last 7 days; dot size and colour follow the map. */
function magnitudeChart(quakes, ctx) {
  const W = 560, H = 170, pl = 30, pr = 8, pt = 10, pb = 22;
  const t1 = ctx.now, t0 = t1 - 7 * 86_400_000;
  const maxM = Math.max(6, ...quakes.map((q) => Math.ceil(q.magnitude)));
  const minM = Math.min(2, ...quakes.map((q) => Math.floor(q.magnitude)));
  const X = (t) => pl + ((t - t0) / (t1 - t0)) * (W - pl - pr);
  const Y = (m) => pt + ((maxM - m) / (maxM - minM)) * (H - pt - pb);
  const rows = [];
  for (let m = minM; m <= maxM; m++) rows.push(html`<line class="ax" x1="${pl}" x2="${W - pr}" y1="${Y(m)}" y2="${Y(m)}" opacity=".5"/><text class="tx" x="${pl - 6}" y="${Y(m) + 3}" text-anchor="end">${m}</text>`);
  for (let d = 0; d <= 7; d++) {
    const t = t0 + d * 86_400_000;
    rows.push(html`<text class="tx" x="${X(t)}" y="${H - 6}" text-anchor="${d === 0 ? 'start' : d === 7 ? 'end' : 'middle'}">${formatJST(t, ctx.lang, { month: 'numeric', day: 'numeric' })}</text>`);
  }
  const dots = quakes.map((q) => html`<circle cx="${X(q.time).toFixed(1)}" cy="${Y(q.magnitude).toFixed(1)}" r="${Math.max(2, (q.magnitude - 1.5) * 1.6).toFixed(1)}" fill="${depthColor(q.depthKm)}" fill-opacity=".8" stroke="var(--panel)" stroke-width=".8"/>`);
  return html`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${ctx.s.quakes.chart}">${rows}${dots}</svg>`;
}

export function quakesView(ctx) {
  const { state, s, lang, now } = ctx;
  const list = state.quakes.filter((q) => q.magnitude >= state.minMag);
  const items = list.slice(0, 150).map((q) => html`
    <li class="qi${state.selectedQuake === q.id ? ' sel' : ''}" data-quake="${q.id}" tabindex="0">
      <div class="mag">${q.magnitude.toFixed(1)}</div>
      ${shindoChip(q.maxShindo, s.quakes.shindo)}
      <div class="place"><b>${q.place}</b><small>${s.quakes.depth} ${q.depthKm ?? s.quakes.unknownDepth} km · ${formatJST(q.time, lang, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} JST</small></div>
      <div class="when">${relativeTime(q.time, now, lang)}<div class="tags">${q.sources.map((src) => html`<span class="badge">${src}</span>`)}</div></div>
    </li>`);

  const scale = ['0', ...SHINDO_ORDER].map((k) => {
    const [bg, fg] = SHINDO_COLORS[k] ?? ['var(--panel-2)', 'var(--muted)'];
    return html`<button type="button" data-shindo="${k}" style="background:${bg};color:${fg}" aria-describedby="scaleDesc">${k}</button>`;
  });

  return html`
  <div class="card"><h3>${s.quakes.title}<span class="src">${statusBadge(state.sources.quakes, ctx)}</span></h3>
    <div class="qctrl"><label for="minmag">${s.quakes.minMag}</label><input id="minmag" type="range" min="2.5" max="6" step="0.5" value="${state.minMag}"><b class="mono">M${state.minMag.toFixed(1)}+</b><span class="muted">${list.length} ${s.quakes.count}</span></div>
    ${magnitudeChart(list, ctx)}
    <ul class="qlist">${items}</ul>
    ${sourceNote(state.sources.quakes, ctx)}
  </div>
  <div class="card"><h3>${s.quakes.scale}</h3>
    <div class="scale" id="scale">${scale}</div>
    <div class="scale-desc" id="scaleDesc">${pickLang(SHINDO_DESC['5-'], lang)}</div>
  </div>`;
}
