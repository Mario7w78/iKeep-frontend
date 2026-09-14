import { faseDelDia } from '../dayPhase';

describe('faseDelDia', () => {
  // Las horas de corte son el contrato completo: noche hasta las 4 para
  // madrugar (de madrugada el cielo sigue oscuro), mañana de 5 a 14, tarde
  // de 15 a 19, noche desde las 20.
  it.each([
    [0, 'Night'],
    [4, 'Night'],
    [5, 'Morning'],
    [11, 'Morning'],
    [14, 'Morning'],
    [15, 'Evening'],
    [19, 'Evening'],
    [20, 'Night'],
    [21, 'Night'],
    [23, 'Night'],
  ])('a las %i horas es %s', (hora, esperada) => {
    expect(faseDelDia(hora)).toBe(esperada);
  });
});
