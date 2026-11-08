/**
 * Who publishes each piece of information and how authoritative it is.
 * The UI shows this next to every panel, so users can tell an official JMA
 * bulletin from a model forecast at a glance.
 */
export const PROVIDERS = {
  jma: {
    kind: 'official',
    name: { ja: '気象庁', es: 'Agencia Meteorológica de Japón (JMA)', en: 'Japan Meteorological Agency (JMA)' },
    via: { ja: 'P2P地震情報 経由', es: 'vía P2P地震情報', en: 'via P2P地震情報' },
    url: 'https://www.jma.go.jp/bosai/',
  },
  usgs: {
    kind: 'scientific',
    name: { ja: '米国地質調査所 (USGS)', es: 'Servicio Geológico de EE. UU. (USGS)', en: 'U.S. Geological Survey (USGS)' },
    url: 'https://earthquake.usgs.gov/earthquakes/map/',
  },
  openMeteo: {
    kind: 'model',
    name: { ja: 'Open-Meteo（数値予報モデル）', es: 'Open-Meteo (modelos numéricos)', en: 'Open-Meteo (numerical models)' },
    url: 'https://open-meteo.com/',
  },
  gdacs: {
    kind: 'international',
    name: { ja: 'GDACS（国連・欧州委員会）', es: 'GDACS (ONU y Comisión Europea)', en: 'GDACS (UN and European Commission)' },
    url: 'https://www.gdacs.org/',
  },
  cabinet: {
    kind: 'official',
    name: { ja: '内閣官房 国民保護ポータル', es: 'Secretaría del Gabinete (protección civil)', en: 'Cabinet Secretariat (civil protection)' },
    url: 'https://www.kokuminhogo.go.jp/',
  },
};

/** Which providers feed each panel, and where the official version lives. */
export const PANEL_SOURCES = {
  quakes: { providers: ['jma', 'usgs'], official: 'https://www.jma.go.jp/bosai/map.html#contents=earthquake_map', feed: 'quakes' },
  tsunami: { providers: ['jma'], official: 'https://www.jma.go.jp/bosai/map.html#contents=tsunami', feed: 'tsunami' },
  weather: { providers: ['openMeteo'], official: 'https://www.jma.go.jp/bosai/warning/', feed: 'weather' },
  typhoons: { providers: ['gdacs'], official: 'https://www.jma.go.jp/bosai/map.html#contents=typhoon', feed: 'typhoons' },
  missile: { providers: ['cabinet'], official: 'https://www.kokuminhogo.go.jp/', feed: null },
  volcano: { providers: ['jma'], official: 'https://www.jma.go.jp/bosai/map.html#contents=volcano', feed: null },
};
