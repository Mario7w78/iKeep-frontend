import { frogStageDe, TIPO_SAPO_POR_ETAPA } from '../frogStage';

describe('frogStageDe', () => {
  // Los bordes son el contrato: si 2 y 3 no separan bien, la etapa
  // cambia un día de más o de menos y nadie va a saber por qué.
  // Rango 0:  0—2  → bebé
  // Rango 1:  3—9  → niño
  // Rango 2:  10+  → adulto
  it.each([
    [0, 'bebé'],
    [1, 'bebé'],
    [2, 'bebé'],
    [3, 'niño'],
    [5, 'niño'],
    [9, 'niño'],
    [10, 'adulto'],
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
