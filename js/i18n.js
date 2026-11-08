/** UI strings. Japanese is the reference language; es/en mirror its keys. */
export const LANGS = ['ja', 'es', 'en'];

const ja = {
  tagline: '日本 総合災害モニター',
  overall: '総合警戒レベル',
  levels: ['平常', '注意', '警報', '危険', '緊急'],
  hazards: { quake: '地震', tsunami: '津波', typhoon: '台風', weather: '気象', missile: 'ミサイル', volcano: '火山' },
  tabs: { overview: '概況', quakes: '地震', tsunami: '津波', typhoon: '台風', weather: '気象', missile: 'Jアラート', volcano: '火山', guide: '防災ガイド' },
  map: { title: '日本列島 ハザードマップ', quakes: '地震', weather: '気象', typhoons: '台風', volcanoes: '火山', trenches: '海溝', size: '○ 大きさ＝M' },
  status: { live: 'ライブ', cached: 'キャッシュ', demo: '例データ', error: '取得失敗', loading: '読込中' },
  socket: { open: 'リアルタイム接続中', connecting: '接続中…', closed: '再接続待ち', unsupported: '定期更新モード', stopped: '停止' },
  soundOn: '警報音 ON', soundOff: '警報音 OFF', refresh: '更新', ok: '了解', updated: '更新',
  cachedNote: (age) => `オフラインのため、${age}に取得したデータを表示しています。`,
  demoNote: 'このソースに接続できないため、例データを表示しています（実際の事象ではありません）。',
  partial: (s) => `一部のソースが利用できません: ${s}`,
  overview: { latest: '直近24時間の主な事象', empty: '直近24時間に重要な事象はありません。', stats: '統計', hottest: '最高気温（現在）', maxGust: '最大瞬間風速 km/h' },
  quakes: { title: '地震情報（過去7日）', minMag: '最小M', count: '件', depth: '深さ', shindo: '最大震度', chart: 'マグニチュードの推移', max: '最大M', h24: '24時間', d7: '7日間', scale: '気象庁 震度階級', unknownDepth: '不明', shindoWord: '震度' },
  tsunami: { title: '津波情報', none: '現在、津波警報・注意報は発表されていません。', active: '津波警報・注意報 発表中', rule: '強い揺れを感じたら、警報を待たずに直ちに高台へ避難。', grades: { MajorWarning: '大津波警報', Warning: '津波警報', Watch: '津波注意報' }, levels: '津波警報の区分', grade: '区分', area: '予報区', height: '予想高さ', action: 'とるべき行動', actions: ['直ちに高台・避難ビルへ', '直ちに高台・避難ビルへ', '海から上がり、海岸から離れる'] },
  typhoon: { title: '熱帯低気圧（北西太平洋）', none: '日本周辺に活動中の台風はありません。', wind: '最大風速 km/h', dist: '東京からの距離 km', class: '台風の強さ（気象庁）', classes: { strong: '強い', veryStrong: '非常に強い', violent: '猛烈な' }, classNote: '最大風速（10分平均）による分類。' },
  weather: { title: '主要都市の気象', detail: '7日間予報', feels: '体感', humidity: '湿度', wind: '風速', gust: '最大瞬間', flags: { heat: '高温', rain: '大雨', wind: '暴風', snow: '大雪', storm: '雷雨' } },
  missile: { title: '弾道ミサイル・Jアラート', state: '発表なし', body: 'Jアラートには公開APIがありません。発射情報はスマホの緊急速報メール・テレビ（NHK）・防災行政無線で直接届きます。', portal: '国民保護ポータルサイト（内閣官房）', todo: 'Jアラートが鳴ったら', history: '過去の主なJアラート（ミサイル関連）' },
  volcano: { title: '常時観測火山（主な活動火山）', name: '火山', notes: '概要', note: '噴火警戒レベルは常に変動します。最新値は気象庁の火山情報で確認してください。', levels: '噴火警戒レベル', count: '火山' },
  guide: { emergency: '緊急連絡先' },
  eew: { title: '緊急地震速報（警報）', body: '強い揺れに警戒してください', areas: '強い揺れが予想される地域', orMore: '以上', cancelled: '取り消し' },
  alerts: { quake: '強い地震', tsunami: '津波警報' },
  footer: ['データ: 気象庁（P2P地震情報経由）· USGS · Open-Meteo · GDACS', '本アプリは公式警報の代わりにはなりません。必ず気象庁・自治体の情報に従ってください。'],
};

const es = {
  tagline: 'Monitor multi-riesgo de Japón',
  overall: 'Nivel de alerta global',
  levels: ['Normal', 'Aviso', 'Alerta', 'Peligro', 'Emergencia'],
  hazards: { quake: 'Terremotos', tsunami: 'Tsunami', typhoon: 'Tifones', weather: 'Tiempo', missile: 'Misiles', volcano: 'Volcanes' },
  tabs: { overview: 'Resumen', quakes: 'Terremotos', tsunami: 'Tsunami', typhoon: 'Tifones', weather: 'Tiempo', missile: 'J-Alert', volcano: 'Volcanes', guide: 'Guía' },
  map: { title: 'Mapa de riesgos del archipiélago', quakes: 'Sismos', weather: 'Tiempo', typhoons: 'Tifones', volcanoes: 'Volcanes', trenches: 'Fosas', size: '○ tamaño = M' },
  status: { live: 'En vivo', cached: 'En caché', demo: 'Ejemplo', error: 'Sin datos', loading: 'Cargando' },
  socket: { open: 'Tiempo real conectado', connecting: 'Conectando…', closed: 'Reconectando', unsupported: 'Modo sondeo', stopped: 'Detenido' },
  soundOn: 'Sonido ON', soundOff: 'Sonido OFF', refresh: 'Actualizar', ok: 'Entendido', updated: 'Actualizado',
  cachedNote: (age) => `Sin conexión: se muestran los datos obtenidos ${age}.`,
  demoNote: 'No se pudo conectar con esta fuente; se muestran datos de ejemplo (no son eventos reales).',
  partial: (s) => `Fuentes no disponibles: ${s}`,
  overview: { latest: 'Eventos relevantes (24 h)', empty: 'Sin eventos relevantes en las últimas 24 h.', stats: 'Estadísticas', hottest: 'Temp. máx. ahora', maxGust: 'Racha máx. km/h' },
  quakes: { title: 'Terremotos (últimos 7 días)', minMag: 'M mín.', count: 'eventos', depth: 'Prof.', shindo: 'Shindo máx.', chart: 'Magnitud en el tiempo', max: 'M máx.', h24: '24 h', d7: '7 días', scale: 'Escala Shindo (JMA)', unknownDepth: '¿?', shindoWord: 'Shindo' },
  tsunami: { title: 'Tsunami', none: 'No hay avisos ni alertas de tsunami en vigor.', active: 'Alertas de tsunami en vigor', rule: 'Si sientes un temblor fuerte en la costa, sube a zona alta sin esperar la alerta.', grades: { MajorWarning: 'Alerta mayor de tsunami', Warning: 'Alerta de tsunami', Watch: 'Aviso de tsunami' }, levels: 'Niveles de alerta de tsunami (JMA)', grade: 'Nivel', area: 'Zona', height: 'Altura prevista', action: 'Qué hacer', actions: ['Evacuar ya a zona alta o edificio de evacuación', 'Evacuar ya a zona alta', 'Salir del agua y alejarse de la costa'] },
  typhoon: { title: 'Ciclones tropicales (Pacífico NO)', none: 'No hay tifones activos cerca de Japón.', wind: 'Viento máx. km/h', dist: 'Distancia a Tokio km', class: 'Intensidad de tifones (JMA)', classes: { strong: 'Fuerte', veryStrong: 'Muy fuerte', violent: 'Violento' }, classNote: 'Según el viento sostenido máximo (media de 10 min).' },
  weather: { title: 'Tiempo en ciudades clave', detail: 'Pronóstico 7 días', feels: 'Sensación', humidity: 'Humedad', wind: 'Viento', gust: 'Racha', flags: { heat: 'Calor', rain: 'Lluvia fuerte', wind: 'Viento fuerte', snow: 'Nieve', storm: 'Tormenta' } },
  missile: { title: 'Misiles balísticos · J-Alert', state: 'Sin avisos registrados', body: 'J-Alert no tiene API pública. Los avisos de lanzamiento llegan directamente por alerta de emergencia al móvil, TV (NHK) y megafonía municipal.', portal: 'Portal Kokumin Hogo (Gabinete)', todo: 'Si suena J-Alert', history: 'J-Alert relacionadas con misiles (histórico)' },
  volcano: { title: 'Volcanes activos vigilados', name: 'Volcán', notes: 'Notas', note: 'El nivel de alerta volcánica cambia; consulta el valor actual en la JMA.', levels: 'Niveles de alerta volcánica', count: 'volcanes' },
  guide: { emergency: 'Teléfonos de emergencia' },
  eew: { title: 'Alerta sísmica temprana', body: 'Prepárate para un temblor fuerte', areas: 'Zonas con temblor fuerte previsto', orMore: 'o más', cancelled: 'Cancelada' },
  alerts: { quake: 'Terremoto fuerte', tsunami: 'Alerta de tsunami' },
  footer: ['Datos: JMA (vía P2PQuake) · USGS · Open-Meteo · GDACS', 'Esta app no sustituye a los avisos oficiales. Sigue siempre a la JMA y a las autoridades locales.'],
};

const en = {
  tagline: 'Japan multi-hazard monitor',
  overall: 'Overall alert level',
  levels: ['Normal', 'Advisory', 'Warning', 'Danger', 'Emergency'],
  hazards: { quake: 'Earthquakes', tsunami: 'Tsunami', typhoon: 'Typhoons', weather: 'Weather', missile: 'Missiles', volcano: 'Volcanoes' },
  tabs: { overview: 'Overview', quakes: 'Earthquakes', tsunami: 'Tsunami', typhoon: 'Typhoons', weather: 'Weather', missile: 'J-Alert', volcano: 'Volcanoes', guide: 'Guide' },
  map: { title: 'Archipelago hazard map', quakes: 'Quakes', weather: 'Weather', typhoons: 'Typhoons', volcanoes: 'Volcanoes', trenches: 'Trenches', size: '○ size = M' },
  status: { live: 'Live', cached: 'Cached', demo: 'Example', error: 'No data', loading: 'Loading' },
  socket: { open: 'Real-time connected', connecting: 'Connecting…', closed: 'Reconnecting', unsupported: 'Polling mode', stopped: 'Stopped' },
  soundOn: 'Sound ON', soundOff: 'Sound OFF', refresh: 'Refresh', ok: 'Got it', updated: 'Updated',
  cachedNote: (age) => `Offline: showing data fetched ${age}.`,
  demoNote: 'Could not reach this source; showing example data (not real events).',
  partial: (s) => `Sources unavailable: ${s}`,
  overview: { latest: 'Significant events (24 h)', empty: 'No significant events in the last 24 h.', stats: 'Statistics', hottest: 'Hottest now', maxGust: 'Max gust km/h' },
  quakes: { title: 'Earthquakes (last 7 days)', minMag: 'Min M', count: 'events', depth: 'Depth', shindo: 'Max shindo', chart: 'Magnitude over time', max: 'Max M', h24: '24 h', d7: '7 days', scale: 'JMA Shindo scale', unknownDepth: '?', shindoWord: 'Shindo' },
  tsunami: { title: 'Tsunami', none: 'No tsunami warnings or advisories in effect.', active: 'Tsunami warnings in effect', rule: 'If you feel strong shaking on the coast, move to high ground without waiting for a warning.', grades: { MajorWarning: 'Major tsunami warning', Warning: 'Tsunami warning', Watch: 'Tsunami advisory' }, levels: 'JMA tsunami warning levels', grade: 'Grade', area: 'Area', height: 'Expected height', action: 'Action', actions: ['Evacuate now to high ground or an evacuation building', 'Evacuate now to high ground', 'Leave the water and move away from the shore'] },
  typhoon: { title: 'Tropical cyclones (NW Pacific)', none: 'No active typhoons near Japan.', wind: 'Max wind km/h', dist: 'Distance to Tokyo km', class: 'Typhoon intensity (JMA)', classes: { strong: 'Strong', veryStrong: 'Very strong', violent: 'Violent' }, classNote: 'Based on 10-minute maximum sustained wind.' },
  weather: { title: 'Weather in key cities', detail: '7-day forecast', feels: 'Feels like', humidity: 'Humidity', wind: 'Wind', gust: 'Gust', flags: { heat: 'Heat', rain: 'Heavy rain', wind: 'Strong wind', snow: 'Snow', storm: 'Thunderstorm' } },
  missile: { title: 'Ballistic missiles · J-Alert', state: 'No alert recorded', body: 'J-Alert has no public API. Launch alerts reach you directly via mobile emergency alerts, TV (NHK) and municipal loudspeakers.', portal: 'Kokumin Hogo portal (Cabinet Secretariat)', todo: 'If J-Alert sounds', history: 'Missile-related J-Alerts (history)' },
  volcano: { title: 'Monitored active volcanoes', name: 'Volcano', notes: 'Notes', note: 'Volcanic alert levels change; check the current level with JMA.', levels: 'Volcanic alert levels', count: 'volcanoes' },
  guide: { emergency: 'Emergency numbers' },
  eew: { title: 'Earthquake Early Warning', body: 'Strong shaking expected', areas: 'Areas expecting strong shaking', orMore: 'or more', cancelled: 'Cancelled' },
  alerts: { quake: 'Strong earthquake', tsunami: 'Tsunami warning' },
  footer: ['Data: JMA (via P2PQuake) · USGS · Open-Meteo · GDACS', 'This app does not replace official warnings. Always follow JMA and local authorities.'],
};

export const STRINGS = { ja, es, en };

export function detectLang(saved, navigatorLang = 'ja') {
  if (LANGS.includes(saved)) return saved;
  const n = String(navigatorLang).slice(0, 2);
  return LANGS.includes(n) ? n : 'ja';
}
