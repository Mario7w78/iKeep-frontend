import { frogStageDe, TIPO_SAPO_POR_ETAPA } from '../frogStage';

describe('frogStageDe', () => {
  // Los bordes son el contrato: si 7 y 8 no separan bien, la etapa
  // cambia un día de más o de menos y nadie va a saber por qué.
  // Rango 0:  0—7  → bebé
  // Rango 1:  8—30 → niño
  // Rango 2:  31+  → adulto
  it.each([
    [0, 'bebé'],
    [1, 'bebé'],
    [6, 'bebé'],
    [7, 'bebé'],
    [8, 'niño'],
    [15, 'niño'],
    [29, 'niño'],
    [30, 'niño'],
    [31, 'adulto'],
    [100, 'adulto'],
  ])('con racha %i devuelve %s', (racha, esperada) => {
    expect(frogStageDe(racha)).toBe(esperada);
  });

  it('una racha negativa no rompe: muestra al bebé', () => {
    expect(frogStageDe(-1)).toBe('bebé');
  });

  it('mapea cada etapa a su artboard numérico', () => {
    expect(TIPO_SAPO_POR_ETAPA).toEqual({ bebé: 0, niño: 1, adulto: 2 });
  });
});
