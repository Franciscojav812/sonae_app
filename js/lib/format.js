/** Presentation helpers shared by every view. */

const LOCALES = { ja: 'ja-JP', es: 'es-ES', en: 'en-GB' };

export const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Markup that has already been escaped; nesting html`` results is safe. */
export class SafeHtml {
  constructor(value) { this.value = value; }
  toString() { return this.value; }
}

const interpolate = (v) => {
  if (v instanceof SafeHtml) return v.value;
  if (Array.isArray(v)) return v.map(interpolate).join('');
  if (v === null || v === undefined || v === false) return '';
  return escapeHtml(v);
};

/**
 * Tagged template that escapes every interpolated value (API text such as
 * place names is untrusted). Wrap trusted markup with raw() to opt out.
 */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += interpolate(values[i]) + strings[i + 1];
  return new SafeHtml(out);
}
export const raw = (value) => new SafeHtml(String(value ?? ''));

/** All times are shown in Japan Standard Time: that is what local readers expect. */
export function formatJST(ms, lang, options) {
  return new Intl.DateTimeFormat(LOCALES[lang] ?? 'en-GB', { timeZone: 'Asia/Tokyo', ...options }).format(ms);
}

export function relativeTime(ms, now, lang) {
  const rtf = new Intl.RelativeTimeFormat(LOCALES[lang] ?? 'en-GB', { numeric: 'auto', style: 'short' });
  const s = (ms - now) / 1000;
  const abs = Math.abs(s);
  if (abs < 60) return rtf.format(0, 'second');
  if (abs < 3600) return rtf.format(Math.round(s / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(s / 3600), 'hour');
  return rtf.format(Math.round(s / 86400), 'day');
}

export const pickLang = (obj, lang) => obj?.[lang] ?? obj?.en ?? '';
