/** Reference content in ja / es / en. Kept apart from UI strings because it is data, not labels. */

export const SHINDO_COLORS = {
  '1': ['#e8f2ff', '#0b1a33'], '2': ['#9fd4ff', '#0b1a33'], '3': ['#3c9cff', '#ffffff'],
  '4': ['#fff000', '#1a1405'], '5-': ['#ffd000', '#1a1405'], '5+': ['#ff9900', '#1a1405'],
  '6-': ['#ff2800', '#ffffff'], '6+': ['#b40068', '#ffffff'], '7': ['#6a005a', '#ffffff'],
};

export const SHINDO_DESC = {
  '0': { ja: '人は揺れを感じない。', es: 'No se percibe.', en: 'Not felt.' },
  '1': { ja: '屋内で静かにしている人の中には、揺れをわずかに感じる人がいる。', es: 'Algunas personas en reposo dentro de casa lo notan levemente.', en: 'Felt slightly by some people at rest indoors.' },
  '2': { ja: '屋内で静かにしている人の大半が揺れを感じる。', es: 'La mayoría de personas en reposo lo nota.', en: 'Felt by most people at rest indoors.' },
  '3': { ja: '屋内にいる人のほとんどが揺れを感じる。食器が音を立てることがある。', es: 'Casi todos lo notan en interiores; la vajilla tintinea.', en: 'Felt by nearly everyone indoors; dishes rattle.' },
  '4': { ja: 'ほとんどの人が驚く。吊り下げ物は大きく揺れ、座りの悪い置物が倒れることがある。', es: 'Sobresalto general; las lámparas oscilan y caen objetos inestables.', en: 'Most people startled; hanging objects swing, unstable items fall.' },
  '5-': { ja: '大半の人が恐怖を覚え、物につかまりたいと感じる。棚の食器や本が落ちることがある。', es: 'Miedo; la gente busca agarrarse. Caen libros y vajilla.', en: 'Fear; people hold on. Books and dishes fall from shelves.' },
  '5+': { ja: '物につかまらないと歩くことが難しい。固定していない家具が倒れることがある。', es: 'Difícil caminar sin apoyo; los muebles sin fijar pueden volcar.', en: 'Hard to walk without support; unsecured furniture may topple.' },
  '6-': { ja: '立っていることが困難。耐震性の低い木造建物は瓦が落下し、傾くことがある。', es: 'Difícil mantenerse en pie; casas de madera antiguas pueden inclinarse.', en: 'Hard to stand; older wooden houses may tilt, roof tiles fall.' },
  '6+': { ja: '這わないと動けない。耐震性の低い木造建物は倒れるものが多くなる。', es: 'Solo se puede gatear; muchos edificios débiles colapsan.', en: 'Can only crawl; many weak wooden buildings collapse.' },
  '7': { ja: '耐震性の高い建物でも傾くことがある。', es: 'Incluso edificios resistentes pueden inclinarse.', en: 'Even quake-resistant buildings may tilt.' },
};

export const VOLCANOES = [
  { ja: '桜島', en: 'Sakurajima', lat: 31.58, lon: 130.66, note: { ja: '日本で最も活発な火山の一つ。爆発的噴火が頻発。', es: 'Uno de los más activos de Japón; explosiones frecuentes.', en: "One of Japan's most active; frequent explosive eruptions." } },
  { ja: '阿蘇山', en: 'Aso', lat: 32.88, lon: 131.1, note: { ja: '世界有数のカルデラ。中岳第一火口が活動中心。', es: 'Gran caldera; actividad en el cráter Nakadake.', en: 'Major caldera; activity centred on Nakadake crater.' } },
  { ja: '霧島山（新燃岳）', en: 'Kirishima (Shinmoedake)', lat: 31.91, lon: 130.88, note: { ja: '2011年・2018年に噴火。', es: 'Erupciones en 2011 y 2018.', en: 'Erupted in 2011 and 2018.' } },
  { ja: '雲仙岳', en: 'Unzen', lat: 32.76, lon: 130.3, note: { ja: '1991年の火砕流で多数の犠牲者。', es: 'Flujo piroclástico mortal en 1991.', en: 'Deadly pyroclastic flow in 1991.' } },
  { ja: '諏訪之瀬島', en: 'Suwanosejima', lat: 29.64, lon: 129.71, note: { ja: 'ほぼ常時噴火を繰り返す。', es: 'Erupciones casi continuas.', en: 'Near-continuous eruptions.' } },
  { ja: '口永良部島', en: 'Kuchinoerabujima', lat: 30.44, lon: 130.22, note: { ja: '2015年に全島避難。', es: 'Evacuación total de la isla en 2015.', en: 'Whole island evacuated in 2015.' } },
  { ja: '浅間山', en: 'Asama', lat: 36.4, lon: 138.52, note: { ja: '本州で最も活発な火山の一つ。', es: 'Uno de los más activos de Honshu.', en: "One of Honshu's most active." } },
  { ja: '御嶽山', en: 'Ontake', lat: 35.89, lon: 137.48, note: { ja: '2014年の水蒸気噴火で登山者63人が犠牲。', es: 'Erupción freática de 2014: 63 víctimas entre excursionistas.', en: '2014 phreatic eruption killed 63 hikers.' } },
  { ja: '富士山', en: 'Fuji', lat: 35.36, lon: 138.73, note: { ja: '最後の噴火は1707年（宝永噴火）。', es: 'Última erupción en 1707 (Hōei).', en: 'Last erupted in 1707 (Hōei).' } },
  { ja: '箱根山', en: 'Hakone', lat: 35.23, lon: 139.02, note: { ja: '大涌谷で噴気活動。', es: 'Fumarolas en Ōwakudani.', en: 'Fumaroles at Owakudani.' } },
  { ja: '草津白根山', en: 'Kusatsu-Shirane', lat: 36.62, lon: 138.53, note: { ja: '2018年本白根山で噴火。', es: 'Erupción del Motoshirane en 2018.', en: 'Motoshirane erupted in 2018.' } },
  { ja: '伊豆大島', en: 'Izu-Oshima', lat: 34.73, lon: 139.39, note: { ja: '1986年噴火で全島民避難。', es: 'Evacuación total tras la erupción de 1986.', en: 'Full evacuation after the 1986 eruption.' } },
  { ja: '三宅島', en: 'Miyakejima', lat: 34.08, lon: 139.53, note: { ja: '2000年噴火で約4年半の全島避難。', es: 'Erupción de 2000: 4,5 años de evacuación.', en: '2000 eruption: 4.5-year evacuation.' } },
  { ja: '西之島', en: 'Nishinoshima', lat: 27.25, lon: 140.88, note: { ja: '2013年以降、噴火で島が拡大。', es: 'Isla en crecimiento por erupciones desde 2013.', en: 'Island growing from eruptions since 2013.' } },
  { ja: '有珠山', en: 'Usu', lat: 42.54, lon: 140.84, note: { ja: '2000年噴火は事前避難で人的被害ゼロ。', es: 'En 2000, la evacuación previa evitó víctimas.', en: '2000 eruption: pre-emptive evacuation, no casualties.' } },
  { ja: '十勝岳', en: 'Tokachidake', lat: 43.42, lon: 142.68, note: { ja: '1926年の泥流で144人が犠牲。', es: 'Lahar de 1926 con 144 víctimas.', en: '1926 lahar killed 144.' } },
];

export const VOLCANO_LEVELS = [
  [5, { ja: '避難', es: 'Evacuar', en: 'Evacuate' }],
  [4, { ja: '高齢者等避難', es: 'Preparar evacuación', en: 'Prepare to evacuate' }],
  [3, { ja: '入山規制', es: 'Prohibido acercarse', en: 'Do not approach' }],
  [2, { ja: '火口周辺規制', es: 'Restricción alrededor del cráter', en: 'Crater area restricted' }],
  [1, { ja: '活火山であることに留意', es: 'Volcán activo (precaución)', en: 'Potential for increased activity' }],
];

export const MISSILE_HISTORY = [
  { date: '2023-11-21', ja: '「衛星」名目の発射。沖縄県にJアラート。', es: 'Lanzamiento de «satélite». J-Alert en Okinawa.', en: '"Satellite" launch. J-Alert for Okinawa.' },
  { date: '2023-05-31', ja: '「衛星」名目の発射。沖縄県にJアラート。', es: 'Lanzamiento de «satélite». J-Alert en Okinawa.', en: '"Satellite" launch. J-Alert for Okinawa.' },
  { date: '2023-04-13', ja: 'ICBM級。北海道にJアラート、後に落下の可能性なしと訂正。', es: 'Clase ICBM. J-Alert en Hokkaido, corregida después (sin riesgo de impacto).', en: 'ICBM-class. J-Alert for Hokkaido, later corrected (no impact risk).' },
  { date: '2022-11-03', ja: 'ICBMの可能性。宮城・山形・新潟にJアラート、上空通過せずと訂正。', es: 'Posible ICBM. J-Alert en Miyagi, Yamagata y Niigata; luego se corrigió que no sobrevoló.', en: 'Possible ICBM. J-Alert for Miyagi, Yamagata, Niigata; later corrected (no overflight).' },
  { date: '2022-10-04', ja: 'IRBMが青森県上空を通過し太平洋に落下。北海道・青森にJアラート。', es: 'Un IRBM sobrevoló Aomori y cayó en el Pacífico. J-Alert en Hokkaido y Aomori.', en: 'IRBM overflew Aomori into the Pacific. J-Alert for Hokkaido and Aomori.' },
  { date: '2017-09-15', ja: '北海道上空を通過。12道県にJアラート。', es: 'Sobrevoló Hokkaido. J-Alert en 12 prefecturas.', en: 'Overflew Hokkaido. J-Alert in 12 prefectures.' },
  { date: '2017-08-29', ja: '襟裳岬上空を通過。12道県にJアラート。', es: 'Sobrevoló el cabo Erimo (Hokkaido). J-Alert en 12 prefecturas.', en: 'Overflew Cape Erimo (Hokkaido). J-Alert in 12 prefectures.' },
];

export const MISSILE_STEPS = {
  ja: ['屋外：近くの頑丈な建物や地下へ避難。なければ物陰に身を隠すか、地面に伏せて頭部を守る。', '屋内：窓から離れ、できれば窓のない部屋へ移動。', '車内：車を止め、頑丈な建物や地下へ。困難な場合は車外で物陰に隠れるか地面に伏せる。', '近くに落下した場合：口と鼻をハンカチで覆い、風上へ離れる。屋内では換気扇を止め、窓を閉める。'],
  es: ['En el exterior: refúgiate en un edificio sólido o subterráneo. Si no hay, ponte a cubierto o túmbate y protégete la cabeza.', 'En el interior: aléjate de las ventanas, mejor en una habitación sin ellas.', 'En el coche: detente y busca un edificio sólido o subterráneo; si no es posible, ponte a cubierto fuera del coche.', 'Si cae cerca: cubre boca y nariz y aléjate en sentido contrario al viento; en interior, apaga la ventilación y cierra las ventanas.'],
  en: ['Outdoors: shelter in a sturdy building or underground. If none, take cover or lie flat and protect your head.', 'Indoors: move away from windows, ideally into a windowless room.', 'In a car: stop and shelter in a sturdy building or underground; if not possible, take cover outside the car.', 'If one lands nearby: cover mouth and nose and move upwind; indoors, turn off ventilation and close windows.'],
};

export const GUIDE = {
  ja: [['地震', 'まず低く、頭を守り、動かない。揺れが収まったら火の始末と出口の確保。家具は事前に固定。'], ['津波', '「揺れたら逃げる」。より遠くより、より高く。第一波より後の波が高いことがある。'], ['台風・大雨', 'ハザードマップで自宅のリスクを確認。警戒レベル4で危険な場所から全員避難。'], ['猛暑', '暑さ指数（WBGT）を確認。こまめな水分・塩分補給と冷房の使用。'], ['火山', '登山前に噴火警戒レベルを確認し、ヘルメットを携行。'], ['備蓄', '水は1人1日3L×最低3日分、非常食、モバイルバッテリー、常備薬。']],
  es: [['Terremoto', 'Agáchate, cúbrete la cabeza y agárrate. Al parar: corta el gas y asegura la salida. Fija los muebles de antemano.'], ['Tsunami', 'Si tiembla fuerte, huye. Mejor más alto que más lejos. Las olas posteriores pueden superar a la primera.'], ['Tifón y lluvias', 'Revisa el mapa de riesgos de tu barrio. Con el nivel de alerta 4, todos evacúan las zonas peligrosas.'], ['Calor extremo', 'Consulta el índice WBGT. Bebe agua y sales a menudo y usa el aire acondicionado.'], ['Volcanes', 'Antes de subir, consulta el nivel de alerta y lleva casco.'], ['Reservas', 'Agua: 3 L por persona y día durante al menos 3 días; comida, batería externa y medicinas.']],
  en: [['Earthquake', 'Drop, cover, hold on. When it stops: turn off gas, secure an exit. Anchor furniture beforehand.'], ['Tsunami', 'If it shakes hard, run. Higher beats farther. Later waves can be bigger than the first.'], ['Typhoon and rain', 'Check your local hazard map. At alert level 4, everyone evacuates dangerous areas.'], ['Extreme heat', 'Check the WBGT heat index. Drink water and salts often; use air conditioning.'], ['Volcanoes', 'Check the alert level before hiking and carry a helmet.'], ['Supplies', 'Water: 3 L per person per day for at least 3 days, food, power bank, medicines.']],
};

export const EMERGENCY_NUMBERS = [
  ['110', { ja: '警察', es: 'Policía', en: 'Police' }],
  ['119', { ja: '消防・救急', es: 'Bomberos y ambulancia', en: 'Fire and ambulance' }],
  ['171', { ja: '災害用伝言ダイヤル', es: 'Buzón de mensajes de desastre', en: 'Disaster message dial' }],
  ['118', { ja: '海上保安庁', es: 'Guardacostas', en: 'Coast Guard' }],
];
