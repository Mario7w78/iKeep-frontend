/**
 * "Hoy" es una afirmacion sobre el dia del usuario.
 *
 * Con medianoche UTC, alguien en Lima que reporta a las 20:00 del lunes
 * quedaba contado como martes.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const mockBackendRequest = jest.fn();
jest.mock('../../api/backendClient', () => ({
  backendRequest: (...a: any[]) => mockBackendRequest(...a),
}));

import { ApiEnergyRepository } from '../ApiEnergyRepository';

describe('reportedToday', () => {
  beforeEach(() => {
    mockBackendRequest.mockReset().mockResolvedValue({ reportado: false });
  });

  it('manda el desfase del reloj del dispositivo', async () => {
    // getTimezoneOffset devuelve el signo invertido: Lima da 300.
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(300);

    await new ApiEnergyRepository().reportedToday();

    expect(mockBackendRequest.mock.calls[0][0]).toContain('desfase_utc_minutos=-300');
  });

  it('un huso adelantado va con signo positivo', async () => {
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-540);

    await new ApiEnergyRepository().reportedToday();

    expect(mockBackendRequest.mock.calls[0][0]).toContain('desfase_utc_minutos=540');
  });

  it('una respuesta sin cuerpo no rompe', async () => {
    mockBackendRequest.mockResolvedValue(undefined);

    await expect(new ApiEnergyRepository().reportedToday()).resolves.toBe(false);
  });
});
