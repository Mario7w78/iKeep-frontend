let fuente: number | null = null;
try {
  fuente = require('../../../../../assets/mascot/sapo_animations.riv');
} catch {
  fuente = null;
}

export const FUENTE_SAPO = fuente;
