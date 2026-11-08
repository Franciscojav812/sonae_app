/** Tsunami, typhoon, J-Alert, volcano and guide panels. */
import { html, pickLang } from '../../lib/format.js';
import { jmaIntensity } from '../../domain/typhoons.js';
import { EMERGENCY_NUMBERS, GUIDE, MISSILE_HISTORY, MISSILE_STEPS, VOLCANOES, VOLCANO_LEVELS } from '../../data/content.js';
import { statusBadge, sourceNote } from '../common.js';

export function tsunamiView(ctx) {
  const { state, s } = ctx;
  const t = state.tsunami;
  const gradeColor = (g) => (g === 'MajorWarning' ? 'var(--lv3)' : g === 'Warning' ? 'var(--lv2)' : '#c9a400');
  return html`
  <div class="card"><h3>${s.tsunami.title}<span class="src">${statusBadge(state.sources.tsunami, ctx)}</span></h3>
    ${t.active
      ? html`<p class="big" style="color:${gradeColor(t.highestGrade)}">${s.tsunami.grades[t.highestGrade]}</p>
        <div class="tblwrap"><table class="t"><thead><tr><th>${s.tsunami.grade}</th><th>${s.tsunami.area}</th></tr></thead><tbody>
        ${t.areas.map((a) => html`<tr><td><b style="color:${gradeColor(a.grade)}">${s.tsunami.grades[a.grade]}</b></td><td>${a.name}${a.immediate ? ' ⚠' : ''}</td></tr>`)}
        </tbody></table></div>`
      : html`<p class="big" style="color:var(--lv0)">${s.levels[0]}</p><p class="lead">${s.tsunami.none}</p>`}
    <p class="note">${s.tsunami.rule}</p>${sourceNote(state.sources.tsunami, ctx)}
  </div>
  <div class="card"><h3>${s.tsunami.levels}</h3><div class="tblwrap"><table class="t">
    <thead><tr><th></th><th>${s.tsunami.height}</th><th>${s.tsunami.action}</th></tr></thead><tbody>
    ${[['MajorWarning', '> 3 m'], ['Warning', '1 – 3 m'], ['Watch', '0.2 – 1 m']].map(([g, h], i) => html`<tr><td><b style="color:${gradeColor(g)}">${s.tsunami.grades[g]}</b></td><td class="mono">${h}</td><td>${s.tsunami.actions[i]}</td></tr>`)}
  </tbody></table></div></div>`;
}

export function typhoonView(ctx) {
  const { state, s } = ctx;
  const alertColor = { red: 'var(--lv2)', orange: 'var(--d2)', green: 'var(--lv0)' };
  return html`
  <div class="card"><h3>${s.typhoon.title}<span class="src">${statusBadge(state.sources.typhoons, ctx)}</span></h3>
    ${state.typhoons.length
      ? state.typhoons.map((t) => {
        const cls = jmaIntensity(t.windKmh);
        return html`<div class="row" style="margin-bottom:8px"><b style="font-size:18px">${t.name}</b>
          <span class="badge" style="color:${alertColor[t.alert]};border-color:currentColor">GDACS ${t.alert}</span>
          ${cls ? html`<span class="badge">${s.typhoon.classes[cls]}</span>` : ''}</div>
          <div class="kv"><div><b>${t.windKmh ?? '–'}</b><span>${s.typhoon.wind}</span></div><div><b>${t.distanceKm.toLocaleString()}</b><span>${s.typhoon.dist}</span></div><div><b>${t.lat.toFixed(1)}°N</b><span>${t.lon.toFixed(1)}°E</span></div></div>
          <p class="note"><a href="${t.url}" target="_blank" rel="noopener">GDACS ↗</a> · <a href="https://www.jma.go.jp/bosai/map.html#contents=typhoon" target="_blank" rel="noopener">JMA ↗</a></p>`;
      })
      : html`<p class="lead">${s.typhoon.none}</p>`}
    ${sourceNote(state.sources.typhoons, ctx)}
  </div>
  <div class="card"><h3>${s.typhoon.class}</h3><div class="tblwrap"><table class="t"><tbody>
    <tr><td>${s.typhoon.classes.strong}</td><td class="mono">33 – 44 m/s</td></tr>
    <tr><td>${s.typhoon.classes.veryStrong}</td><td class="mono">44 – 54 m/s</td></tr>
    <tr><td><b>${s.typhoon.classes.violent}</b></td><td class="mono">≥ 54 m/s</td></tr>
  </tbody></table></div><p class="note">${s.typhoon.classNote}</p></div>`;
}

export function missileView(ctx) {
  const { s, lang } = ctx;
  return html`
  <div class="card"><h3>${s.missile.title}<span class="src"><span class="badge">J-ALERT</span></span></h3>
    <p class="big" style="color:var(--lv0)">${s.missile.state}</p>
    <p class="lead">${s.missile.body}</p>
    <p class="note"><a href="https://www.kokuminhogo.go.jp/" target="_blank" rel="noopener">${s.missile.portal} ↗</a></p>
  </div>
  <div class="card"><h3>${s.missile.todo}</h3><ol class="steps">${MISSILE_STEPS[lang].map((x) => html`<li>${x}</li>`)}</ol></div>
  <div class="card"><h3>${s.missile.history}</h3><ul class="feed">
    ${MISSILE_HISTORY.map((m) => html`<li><span class="k" style="--c:var(--lv2)"></span><div>${pickLang(m, lang)}</div><time class="mono">${m.date}</time></li>`)}
  </ul></div>`;
}

export function volcanoView(ctx) {
  const { s, lang } = ctx;
  const color = (n) => (n >= 4 ? 'var(--lv3)' : n === 3 ? 'var(--lv2)' : n === 2 ? '#c9a400' : 'var(--muted)');
  return html`
  <div class="card"><h3>${s.volcano.title}</h3><div class="tblwrap"><table class="t">
    <thead><tr><th>${s.volcano.name}</th><th>${s.volcano.notes}</th></tr></thead><tbody>
    ${VOLCANOES.map((v) => html`<tr><td><b>${lang === 'ja' ? v.ja : v.en}</b><br><span class="muted mono" style="font-size:11px">${v.lat.toFixed(2)}N ${v.lon.toFixed(2)}E</span></td><td>${pickLang(v.note, lang)}</td></tr>`)}
  </tbody></table></div>
  <p class="note">${s.volcano.note} <a href="https://www.jma.go.jp/bosai/map.html#contents=volcano" target="_blank" rel="noopener">JMA ↗</a></p></div>
  <div class="card"><h3>${s.volcano.levels}</h3><div class="tblwrap"><table class="t"><tbody>
    ${VOLCANO_LEVELS.map(([n, label]) => html`<tr><td class="mono"><b style="color:${color(n)}">Lv ${n}</b></td><td>${pickLang(label, lang)}</td></tr>`)}
  </tbody></table></div></div>`;
}

export function guideView(ctx) {
  const { s, lang } = ctx;
  return html`
  <div class="guidegrid">${GUIDE[lang].map(([h, b]) => html`<div class="card"><h4>${h}</h4><p style="margin:0">${b}</p></div>`)}</div>
  <div class="card"><h3>${s.guide.emergency}</h3>
    <div class="kv">${EMERGENCY_NUMBERS.map(([n, label]) => html`<div><b>${n}</b><span>${pickLang(label, lang)}</span></div>`)}</div>
    <p class="note"><a href="https://www.jnto.go.jp/safety-tips/" target="_blank" rel="noopener">Safety tips (JNTO) ↗</a> · <a href="https://www.jma.go.jp/bosai/" target="_blank" rel="noopener">JMA ↗</a></p>
  </div>`;
}
