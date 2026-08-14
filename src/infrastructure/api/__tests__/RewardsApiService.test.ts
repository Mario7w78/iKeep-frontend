/**
 * El cliente de logros.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(), getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(), clear: jest.fn(),
}));

const mockBackendRequest = jest.fn();
jest.mock('../backendClient', () => ({
  backendRequest: (...a: any[]) => mockBackendRequest(...a),
}));

import { obtenerResumen } from '../RewardsApiService';

const RESPUESTA = {
  racha: { actual: 3, mejor: 5, en_riesgo: false },
  progreso: { completadas: 1, total: 3, fraccion: 0.33, terminado: false, completados_ids: [] },
  dias_completados: [],
};

describe('obtenerResumen', () => {
  beforeEach(() => {
    mockBackendRequest.mockReset().mockResolvedValue(RESPUESTA);
  });

  it('manda el desfase del reloj', async () => {
    // La racha cuenta dias del usuario, y el servidor no conoce su huso.
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(300);

    await obtenerResumen('2026-08-11');

    expect(mockBackendRequest.mock.calls[0][0]).toContain('desfase_utc_minutos=-300');
  });

  it('traduce la racha al dominio', async () => {
    const r = await obtenerResumen('2026-08-11');

    expect(r.racha).toEqual({ actual: 3, mejor: 5, enRiesgo: false });
  });
});
