import { faseDelDia } from '../dayPhase';

describe('faseDelDia', () => {
  // Las horas de corte son el contrato completo: mañana hasta las 11,
  // tarde de 12 a 19, noche desde las 20.
  it.each([
    [0, 'Morning'],
    [11, 'Morning'],
    [12, 'Evening'],
    [15, 'Evening'],
    [19, 'Evening'],
    [20, 'Night'],
    [21, 'Night'],
    [23, 'Night'],
  ])('a las %i horas es %s', (hora, esperada) => {
    expect(faseDelDia(hora)).toBe(esperada);
  });
});
