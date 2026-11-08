/**
 * Closed glossary of official Japanese disaster terms. The UI uses these
 * renderings everywhere, so a term never changes meaning between screens —
 * e.g. 避難指示 is always an evacuation ORDER, never a suggestion.
 * English follows the terms JMA and the Cabinet Office use in English.
 *
 * Set `REVIEW` once a native speaker has checked every entry; until then the
 * UI says the human review is pending.
 */
export const REVIEW = { reviewer: null, date: null };

export const GLOSSARY = [
  {
    ja: '緊急地震速報', kana: 'きんきゅうじしんそくほう',
    es: 'Alerta sísmica temprana', en: 'Earthquake Early Warning',
    def: { ja: '強い揺れが来る数秒〜数十秒前に気象庁が発表する。', es: 'La emite la JMA segundos antes de que llegue el temblor fuerte.', en: 'Issued by JMA seconds before strong shaking arrives.' },
  },
  {
    ja: '震度', kana: 'しんど',
    es: 'Intensidad sísmica (shindo)', en: 'Seismic intensity (shindo)',
    def: { ja: 'その場所での揺れの強さ（0〜7、5と6は弱・強）。場所ごとに異なる。', es: 'Lo fuerte que tiembla en cada lugar (0–7; el 5 y el 6 se dividen en «−» y «+»). Varía según el sitio.', en: 'How strongly the ground shakes at a place (0–7; 5 and 6 split into lower/upper). Varies by location.' },
  },
  {
    ja: 'マグニチュード', kana: '',
    es: 'Magnitud', en: 'Magnitude',
    def: { ja: '地震そのものの規模。1つの地震に1つの値。', es: 'El tamaño del terremoto en sí. Un solo valor por terremoto.', en: 'The size of the earthquake itself. One value per quake.' },
  },
  {
    ja: '大津波警報', kana: 'おおつなみけいほう',
    es: 'Alerta mayor de tsunami', en: 'Major Tsunami Warning',
    def: { ja: '3mを超える津波が予想される。直ちに避難。', es: 'Se esperan olas de más de 3 m. Evacuar de inmediato.', en: 'Waves over 3 m expected. Evacuate immediately.' },
  },
  {
    ja: '津波警報', kana: 'つなみけいほう',
    es: 'Alerta de tsunami', en: 'Tsunami Warning',
    def: { ja: '1〜3mの津波が予想される。直ちに避難。', es: 'Se esperan olas de 1 a 3 m. Evacuar de inmediato.', en: 'Waves of 1–3 m expected. Evacuate immediately.' },
  },
  {
    ja: '津波注意報', kana: 'つなみちゅういほう',
    es: 'Aviso de tsunami', en: 'Tsunami Advisory',
    def: { ja: '0.2〜1mの津波が予想される。海から離れる。', es: 'Se esperan olas de 0,2 a 1 m. Salir del agua y alejarse de la costa.', en: 'Waves of 0.2–1 m expected. Leave the water and the shore.' },
  },
  {
    ja: '特別警報', kana: 'とくべつけいほう',
    es: 'Alerta de emergencia', en: 'Emergency Warning',
    def: { ja: '数十年に一度の重大な災害の危険が著しく高い。', es: 'Peligro extraordinario de un desastre grave, de los que ocurren una vez cada varias décadas.', en: 'Exceptional danger of a severe disaster of a kind seen once in decades.' },
  },
  {
    ja: '警報', kana: 'けいほう',
    es: 'Alerta', en: 'Warning',
    def: { ja: '重大な災害が起こるおそれがある。', es: 'Puede producirse un desastre grave.', en: 'A serious disaster may occur.' },
  },
  {
    ja: '注意報', kana: 'ちゅういほう',
    es: 'Aviso', en: 'Advisory',
    def: { ja: '災害が起こるおそれがある。', es: 'Puede producirse un desastre.', en: 'A disaster may occur.' },
  },
  {
    ja: '警戒レベル', kana: 'けいかいレベル',
    es: 'Nivel de alerta (1–5)', en: 'Alert level (1–5)',
    def: { ja: '避難行動を5段階で示す。レベル4までに全員避難。', es: 'Indica qué hacer en 5 niveles. Con el nivel 4, todo el mundo debe haber evacuado.', en: 'Five steps telling people what to do. Everyone must have evacuated by level 4.' },
  },
  {
    ja: '高齢者等避難', kana: 'こうれいしゃとうひなん',
    es: 'Evacuación de personas mayores y vulnerables (nivel 3)', en: 'Evacuation of the elderly and others (level 3)',
    def: { ja: '避難に時間がかかる人は避難を始める。', es: 'Quien necesite más tiempo para evacuar debe empezar ya.', en: 'People who need more time to evacuate should start now.' },
  },
  {
    ja: '避難指示', kana: 'ひなんしじ',
    es: 'Orden de evacuación (nivel 4)', en: 'Evacuation Order (level 4)',
    def: { ja: '危険な場所から全員避難。', es: 'Todos deben salir de las zonas peligrosas.', en: 'Everyone must leave dangerous areas.' },
  },
  {
    ja: '緊急安全確保', kana: 'きんきゅうあんぜんかくほ',
    es: 'Medidas de seguridad de emergencia (nivel 5)', en: 'Emergency Safety Measures (level 5)',
    def: { ja: '災害が発生または切迫。命を守る行動を直ちにとる。', es: 'El desastre ya ocurre o es inminente: protege tu vida ahora mismo.', en: 'A disaster is happening or imminent: act now to save your life.' },
  },
  {
    ja: '指定緊急避難場所', kana: 'していきんきゅうひなんばしょ',
    es: 'Lugar de evacuación de emergencia designado', en: 'Designated emergency evacuation site',
    def: { ja: '危険から逃れるための場所（災害の種類ごとに指定）。', es: 'Sitio al que huir del peligro inmediato; cada uno sirve para tipos de desastre concretos.', en: 'Place to escape immediate danger; each is designated for specific hazards.' },
  },
  {
    ja: '指定避難所', kana: 'していひなんじょ',
    es: 'Refugio de evacuación designado', en: 'Designated evacuation shelter',
    def: { ja: '自宅に戻れない人が一定期間滞在する施設。', es: 'Lugar para quedarse un tiempo si no puedes volver a casa.', en: 'Facility to stay in for a while if you cannot return home.' },
  },
  {
    ja: '噴火警戒レベル', kana: 'ふんかけいかいレベル',
    es: 'Nivel de alerta volcánica', en: 'Volcanic Alert Level',
    def: { ja: '火山活動の状況と必要な行動を5段階で示す。', es: 'Actividad del volcán y qué hacer, en 5 niveles.', en: 'Volcanic activity and required action, in 5 levels.' },
  },
  {
    ja: 'Jアラート（全国瞬時警報システム）', kana: 'ぜんこくしゅんじけいほうシステム',
    es: 'J-Alert (Sistema Nacional de Alerta Instantánea)', en: 'J-Alert (National Instant Alert System)',
    def: { ja: 'ミサイル発射や大規模災害を国が瞬時に伝えるシステム。', es: 'Sistema del Estado para avisar al instante de misiles o grandes desastres.', en: 'Government system for instant alerts on missiles or major disasters.' },
  },
  {
    ja: '台風', kana: 'たいふう',
    es: 'Tifón', en: 'Typhoon',
    def: { ja: '北西太平洋の熱帯低気圧のうち、最大風速が17.2m/s以上のもの。', es: 'Ciclón tropical del Pacífico noroeste con viento sostenido máximo de 17,2 m/s o más.', en: 'NW Pacific tropical cyclone with maximum sustained wind of 17.2 m/s or more.' },
  },
];
