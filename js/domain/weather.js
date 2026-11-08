/** Weather domain: Open-Meteo payloads → per-city snapshot + hazard flags. */

/**
 * Thresholds loosely follow JMA advisory (注意報) / warning (警報) criteria for
 * the Kanto plain; they vary by municipality, so these are indicative only.
 */
export const THRESHOLDS = {
  heat: { advisory: 35, warning: 38 }, // °C (猛暑日 / 酷暑)
  rainHour: { advisory: 8, warning: 20 }, // mm in the current hour
  rainDay: { advisory: 40, warning: 80 }, // mm/day
  gustNow: { advisory: 60, warning: 90 }, // km/h
  gustDay: { advisory: 72, warning: 100 }, // km/h
  snowDay: { advisory: 5, warning: 20 }, // cm/day
};

const THUNDER_CODES = new Set([95, 96, 99]);

export function normalizeOpenMeteo(payload, cities) {
  const list = Array.isArray(payload) ? payload : payload ? [payload] : [];
  return cities
    .map((city, i) => {
      const x = list[i];
      if (!x?.current || !x?.daily) return null;
      const d = x.daily;
      return {
        city,
        current: {
          temp: x.current.temperature_2m,
          feels: x.current.apparent_temperature,
          humidity: x.current.relative_humidity_2m,
          precip: x.current.precipitation ?? 0,
          code: x.current.weather_code,
          wind: x.current.wind_speed_10m,
          gust: x.current.wind_gusts_10m,
        },
        daily: (d.time ?? []).map((date, j) => ({
          date,
          code: d.weather_code?.[j],
          max: d.temperature_2m_max?.[j],
          min: d.temperature_2m_min?.[j],
          precip: d.precipitation_sum?.[j] ?? 0,
          gust: d.wind_gusts_10m_max?.[j] ?? 0,
          snow: d.snowfall_sum?.[j] ?? 0,
        })),
      };
    })
    .filter(Boolean);
}

const level = (value, { advisory, warning }) => (value >= warning ? 2 : value >= advisory ? 1 : 0);

/** Hazard flags for today: [{ kind: 'heat'|'rain'|'wind'|'snow'|'storm', level: 1|2 }]. */
export function weatherFlags(w, t = THRESHOLDS) {
  const c = w.current;
  const today = w.daily[0] ?? {};
  const flags = [
    ['heat', Math.max(level(c.temp, t.heat), level(today.max ?? -Infinity, t.heat))],
    ['rain', Math.max(level(c.precip, t.rainHour), level(today.precip, t.rainDay))],
    ['wind', Math.max(level(c.gust, t.gustNow), level(today.gust, t.gustDay))],
    ['snow', level(today.snow, t.snowDay)],
    ['storm', THUNDER_CODES.has(c.code) ? 1 : 0],
  ];
  return flags.filter(([, lv]) => lv > 0).map(([kind, lv]) => ({ kind, level: lv }));
}

/** WMO weather code → glyph. */
export function weatherGlyph(code) {
  if (code === 0) return '☀';
  if (code <= 2) return '⛅';
  if (code === 3) return '☁';
  if (code <= 48) return '〰';
  if (code <= 57) return '☂';
  if (code <= 67) return '☔';
  if (code <= 77) return '❄';
  if (code <= 82) return '☔';
  if (code <= 86) return '❄';
  return '⚡';
}
