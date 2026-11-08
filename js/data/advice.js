/**
 * "What to do now" — protective actions for the most urgent situation, based on
 * guidance from JMA, the Cabinet Office (内閣府 防災) and the Fire and Disaster
 * Management Agency. Three steps each: in an emergency nobody reads more.
 */
export const ADVICE = {
  eew: {
    ja: { title: '今すぐ身を守ってください', steps: ['頭を守り、丈夫な机の下などに身を隠す。', '揺れが収まるまで動かない。', '屋外ではブロック塀や自動販売機、ガラスから離れる。運転中はハザードランプを点けてゆっくり減速。'] },
    es: { title: 'Protégete ahora', steps: ['Protégete la cabeza y ponte bajo una mesa resistente.', 'No te muevas hasta que pare el temblor.', 'En la calle, aléjate de muros, máquinas expendedoras y cristales. Si conduces, pon los intermitentes de emergencia y frena poco a poco.'] },
    en: { title: 'Protect yourself now', steps: ['Protect your head and get under a sturdy table.', 'Do not move until the shaking stops.', 'Outdoors, keep away from walls, vending machines and glass. If driving, turn on hazard lights and slow down gradually.'] },
  },
  tsunamiEvacuate: {
    ja: { title: '直ちに高台へ避難してください', steps: ['海岸や川から離れ、高台か津波避難ビルへ。', '原則として車ではなく徒歩で避難する。', '警報が解除されるまで戻らない。第2波以降が高くなることがある。'] },
    es: { title: 'Evacúa ya a una zona alta', steps: ['Aléjate de la costa y de los ríos; sube a una zona alta o a un edificio de evacuación de tsunami.', 'Ve a pie, no en coche, salvo que sea imprescindible.', 'No vuelvas hasta que se levante la alerta: las olas siguientes pueden ser mayores.'] },
    en: { title: 'Evacuate to high ground now', steps: ['Leave the coast and rivers; go to high ground or a tsunami evacuation building.', 'Go on foot, not by car, unless unavoidable.', 'Do not return until the warning is lifted: later waves can be higher.'] },
  },
  tsunamiAdvisory: {
    ja: { title: '海から離れてください', steps: ['海の中にいる人はすぐに上がる。', '海岸に近づかない。釣りや海水浴をしない。', '注意報が解除されるまで戻らない。'] },
    es: { title: 'Aléjate del mar', steps: ['Si estás en el agua, sal de inmediato.', 'No te acerques a la costa ni pesques o te bañes.', 'No vuelvas hasta que se levante el aviso.'] },
    en: { title: 'Stay away from the sea', steps: ['If you are in the water, get out immediately.', 'Keep away from the shore; do not fish or swim.', 'Do not return until the advisory is lifted.'] },
  },
  afterQuake: {
    ja: { title: '強い揺れの後にすること', steps: ['けがと火の元を確認し、ガスの元栓を閉める。', '余震に備えて靴を履き、倒れやすい物から離れる。', '海岸付近にいる場合は津波情報を確認する。家族の安否確認は災害用伝言ダイヤル171。'] },
    es: { title: 'Después de un terremoto fuerte', steps: ['Revisa si hay heridos y fuego; cierra la llave del gas.', 'Ponte calzado y aléjate de lo que pueda caer por las réplicas.', 'Si estás cerca de la costa, consulta la alerta de tsunami. Para localizar a tu familia: buzón de desastres 171.'] },
    en: { title: 'After strong shaking', steps: ['Check for injuries and fire; shut off the gas.', 'Put on shoes and keep away from things that may fall in aftershocks.', 'Near the coast, check tsunami information. To reach family: disaster message dial 171.'] },
  },
  typhoon: {
    ja: { title: '台風に備えてください', steps: ['不要不急の外出を控え、窓から離れる。', '停電・断水に備えて水と充電を確保する。', '自治体の避難情報を確認。警戒レベル4（避難指示）で危険な場所から全員避難。'] },
    es: { title: 'Prepárate para el tifón', steps: ['Evita salir y mantente lejos de las ventanas.', 'Guarda agua y carga el móvil por si hay cortes de luz o agua.', 'Consulta los avisos del ayuntamiento: con nivel de alerta 4 (orden de evacuación), todos salen de las zonas peligrosas.'] },
    en: { title: 'Prepare for the typhoon', steps: ['Avoid going out and stay away from windows.', 'Store water and charge your phone in case of power or water cuts.', 'Check municipal evacuation information: at alert level 4 (evacuation order), everyone leaves dangerous areas.'] },
  },
  heat: {
    ja: { title: '熱中症に注意してください', steps: ['こまめに水分と塩分をとる。', '日中の外出を避け、冷房を使う。', 'めまい・吐き気・けいれんは熱中症の疑い。意識がおかしければ119。'] },
    es: { title: 'Cuidado con el golpe de calor', steps: ['Bebe agua y toma sales a menudo.', 'Evita salir en las horas centrales y usa el aire acondicionado.', 'Mareo, náuseas o calambres pueden ser golpe de calor. Si la persona está confusa, llama al 119.'] },
    en: { title: 'Beware of heatstroke', steps: ['Drink water and take salts often.', 'Avoid going out at midday and use air conditioning.', 'Dizziness, nausea or cramps may be heatstroke. If someone is confused, call 119.'] },
  },
  storm: {
    ja: { title: '荒天に注意してください', steps: ['不要不急の外出を控える。', '川、崖、用水路、地下道に近づかない。', '気象庁の警報と自治体の避難情報を確認する。'] },
    es: { title: 'Precaución por mal tiempo', steps: ['Evita los desplazamientos que no sean necesarios.', 'No te acerques a ríos, laderas, canales ni pasos subterráneos.', 'Consulta las alertas de la JMA y los avisos de evacuación del ayuntamiento.'] },
    en: { title: 'Take care in severe weather', steps: ['Avoid unnecessary trips.', 'Stay away from rivers, slopes, canals and underpasses.', 'Check JMA warnings and municipal evacuation information.'] },
  },
  calm: {
    ja: { title: '発表中の主な警報はありません', steps: ['滞在先や自宅の近くの避難場所を確認しておく。', '水・充電器・常備薬など持ち出せる準備をしておく。', '緊急番号：警察110、消防・救急119、災害用伝言ダイヤル171。'] },
    es: { title: 'No hay alertas importantes en vigor', steps: ['Localiza el lugar de evacuación más cercano a tu alojamiento o casa.', 'Ten a mano agua, cargador y tus medicinas.', 'Emergencias: policía 110, bomberos y ambulancia 119, buzón de desastres 171.'] },
    en: { title: 'No major warnings in effect', steps: ['Find the evacuation site nearest to where you are staying.', 'Keep water, a charger and your medicines ready to go.', 'Emergency numbers: police 110, fire and ambulance 119, disaster message dial 171.'] },
  },
};
