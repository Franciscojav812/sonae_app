/** Picks the single most urgent protective-action card for the current situation. */

/** Priority order: the first matching rule wins. */
export function adviceKey(hazards, { eewActive = false } = {}) {
  if (eewActive) return 'eew';
  if (hazards.tsunami.level >= 3) return 'tsunamiEvacuate';
  if (hazards.tsunami.level >= 1) return 'tsunamiAdvisory';
  if (hazards.quake.level >= 2) return 'afterQuake';
  if (hazards.typhoon.level >= 2) return 'typhoon';
  if (hazards.weather.level >= 1) return hazards.weather.kind === 'heat' ? 'heat' : 'storm';
  return 'calm';
}

/** Card colour follows the hazard it answers. */
export function adviceLevel(key, hazards) {
  switch (key) {
    case 'eew': return 3;
    case 'tsunamiEvacuate': case 'tsunamiAdvisory': return hazards.tsunami.level;
    case 'afterQuake': return hazards.quake.level;
    case 'typhoon': return hazards.typhoon.level;
    case 'heat': case 'storm': return hazards.weather.level;
    default: return 0;
  }
}
