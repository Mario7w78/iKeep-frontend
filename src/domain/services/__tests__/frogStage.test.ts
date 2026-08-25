import { frogStageDe } from '../frogStage';

describe('frogStageDe', () => {
  // Los bordes son el contrato: si 6 y 7 no separan bien, la etapa
  // cambia un día de más o de menos y nadie va a saber por qué.
  it.each([
    [0, 'bebé'],
    [1, 'bebé'],
    [6, 'bebé'],
    [7, 'niño'],
    [15, 'niño'],
    [29, 'niño'],
    [30, 'adulto'],
    [100, 'adulto'],
  ])('con racha %i devuelve %s', (racha, esperada) => {
    expect(frogStageDe(racha)).toBe(esperada);
  });

  it('una racha negativa no rompe: muestra al bebé', () => {
    expect(frogStageDe(-1)).toBe('bebé');
  });
});
