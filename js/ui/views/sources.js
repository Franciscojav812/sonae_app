/** Sources & method: who provides what, how fresh it is, how levels are computed, what terms mean. */
import { html, relativeTime, pickLang } from '../../lib/format.js';
import { POLL_MS } from '../../config.js';
import { PANEL_SOURCES, PROVIDERS } from '../../data/provenance.js';
import { GLOSSARY, REVIEW } from '../../data/glossary.js';
import { kindBadge, statusBadge } from '../common.js';

const FEEDS = ['quakes', 'tsunami', 'weather', 'typhoons'];

export function sourcesView(ctx) {
  const { state, s, lang, now } = ctx;
  const t = s.trust;
  const minutes = (ms) => (lang === 'ja' ? `${ms / 60_000}分` : `${ms / 60_000} min`);

  const rows = FEEDS.map((feed) => {
    const meta = state.sources[feed];
    const providers = PANEL_SOURCES[feed].providers.map((id) => PROVIDERS[id]);
    return html`<tr>
      <td><b>${t.feeds[feed]}</b></td>
      <td>${providers.map((p, i) => html`${i ? html`<br>` : ''}<a href="${p.url}" target="_blank" rel="noopener">${pickLang(p.name, lang)}</a>`)}</td>
      <td>${providers.map((p, i) => html`${i ? ' ' : ''}${kindBadge(p.kind, s)}`)}</td>
      <td>${statusBadge(meta, ctx)}</td>
      <td class="muted">${minutes(POLL_MS[feed])}${state.socket === 'open' && (feed === 'quakes' || feed === 'tsunami') ? ' + push' : ''}</td>
      <td class="muted">${meta?.fetchedAt ? relativeTime(meta.fetchedAt, now, lang) : t.never}</td>
    </tr>`;
  });

  return html`
  <div class="card"><h3>${t.statusTitle}</h3>
    <div class="tblwrap"><table class="t">
      <thead><tr><th></th><th>${t.provider}</th><th>${t.kind}</th><th>${t.state}</th><th>${t.refresh}</th><th>${t.lastUpdate}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
  </div>
  <div class="card"><h3>${t.howTitle}</h3><ul class="steps">${t.how.map((x) => html`<li>${x}</li>`)}</ul></div>
  <div class="card"><h3>${t.glossaryTitle}
      <span class="src"><span class="badge ${REVIEW.reviewer ? 'official' : 'model'}">${REVIEW.reviewer ? t.reviewedBy(REVIEW.reviewer, REVIEW.date) : t.reviewPending}</span></span></h3>
    <div class="tblwrap"><table class="t gloss">
      <thead><tr><th>日本語</th><th>${lang === 'ja' ? 'English / Español' : lang === 'es' ? 'Español' : 'English'}</th><th></th></tr></thead>
      <tbody>${GLOSSARY.map((g) => html`<tr>
        <td><b lang="ja">${g.ja}</b>${g.kana ? html`<br><small class="muted" lang="ja">${g.kana}</small>` : ''}</td>
        <td>${lang === 'ja' ? html`${g.en}<br><small class="muted">${g.es}</small>` : lang === 'es' ? g.es : g.en}</td>
        <td class="muted">${pickLang(g.def, lang)}</td>
      </tr>`)}</tbody>
    </table></div>
  </div>
  <div class="card"><h3>${t.aboutTitle}</h3><p class="lead">${t.about}</p>
    <p class="note"><a href="https://github.com/Franciscojav812/sonae_app" target="_blank" rel="noopener">${t.code} (MIT) ↗</a></p></div>`;
}
