import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pendingAlerts } from '../js/domain/alerts.js';
import { ALERT } from '../js/config.js';
import { STRINGS, LANGS, detectLang } from '../js/i18n.js';
import { html, raw, escapeHtml } from '../js/lib/format.js';

const NOW = 1_000_000_000;
const quake = (over) => ({ id: 'q1', time: NOW - 60_000, magnitude: 5, maxShindo: '5-', ...over });

test('strong recent quakes alert once', () => {
  const seen = new Set();
  const [a] = pendingAlerts({ quakes: [quake()] }, seen, NOW, ALERT);
  assert.equal(a.kind, 'quake');
  seen.add(a.id);
  assert.deepEqual(pendingAlerts({ quakes: [quake()] }, seen, NOW, ALERT), []);
});

test('weak, old or demo quakes never alert', () => {
  const none = (input) => assert.deepEqual(pendingAlerts(input, new Set(), NOW, ALERT), []);
  none({ quakes: [quake({ maxShindo: '4', magnitude: 5.5 })] });
  none({ quakes: [quake({ time: NOW - 2 * 3_600_000 })] });
  none({ quakes: [quake()], demo: true });
});

test('magnitude alone can trigger an alert for offshore events without shindo', () => {
  assert.equal(pendingAlerts({ quakes: [quake({ maxShindo: null, magnitude: 6.3 })] }, new Set(), NOW, ALERT).length, 1);
});

test('tsunami advisories inform, warnings alert', () => {
  const t = (grade) => ({ active: true, highestGrade: grade, issuedAt: NOW });
  assert.equal(pendingAlerts({ tsunami: t('Watch') }, new Set(), NOW, ALERT).length, 0);
  assert.equal(pendingAlerts({ tsunami: t('Warning') }, new Set(), NOW, ALERT)[0].kind, 'tsunami');
});

test('an active EEW comes first', () => {
  const eew = { id: 'e', issuedAt: NOW - 5000, cancelled: false, test: false };
  const list = pendingAlerts({ quakes: [quake()], eew }, new Set(), NOW, ALERT);
  assert.deepEqual(list.map((a) => a.kind), ['eew', 'quake']);
});

/* ---------- i18n & templating ---------- */
function shape(obj) {
  if (typeof obj === 'function') return 'fn';
  if (Array.isArray(obj)) return `array(${obj.length})`;
  if (obj && typeof obj === 'object') return Object.fromEntries(Object.keys(obj).sort().map((k) => [k, shape(obj[k])]));
  return typeof obj;
}

test('every language defines exactly the same keys', () => {
  const ref = shape(STRINGS.ja);
  for (const lang of LANGS) assert.deepEqual(shape(STRINGS[lang]), ref, `${lang} differs from ja`);
});

test('language detection prefers the saved choice, then the browser, then Japanese', () => {
  assert.equal(detectLang('es', 'en-US'), 'es');
  assert.equal(detectLang(null, 'en-US'), 'en');
  assert.equal(detectLang(null, 'fr-FR'), 'ja');
});

test('html`` escapes untrusted values but keeps nested templates', () => {
  const place = '<img src=x onerror=alert(1)>';
  const out = String(html`<b>${place}</b>${html`<i>${'a&b'}</i>`}${raw('<br>')}${[html`<p>1</p>`, '<x>']}`);
  assert.equal(out, `<b>${escapeHtml(place)}</b><i>a&amp;b</i><br><p>1</p>&lt;x&gt;`);
});
