/**
 * La puerta del backend para Google Calendar.
 */

const mockBackendRequest = jest.fn();
jest.mock('../backendClient', () => ({
  backendRequest: (...a: any[]) => mockBackendRequest(...a),
}));

import {
  cargarEventos,
  consultarEstado,
  desconectar,
  iniciarConexion,
} from '../GoogleCalendarApiService';

describe('GoogleCalendarApiService', () => {
  beforeEach(() => {
    mockBackendRequest.mockReset().mockResolvedValue({});
  });

  describe('iniciarConexion', () => {
    it('pide el inicio y devuelve la url de consentimiento', async () => {
      mockBackendRequest.mockResolvedValue({ auth_url: 'https://accounts.google.com/o/oauth2/auth?x=1' });

      const url = await iniciarConexion();

      expect(url).toBe('https://accounts.google.com/o/oauth2/auth?x=1');
      expect(mockBackendRequest.mock.calls[0][0]).toBe('/api/v1/google/oauth/inicio');
    });
  });

  describe('consultarEstado', () => {
    it('traduce conectado true', async () => {
      mockBackendRequest.mockResolvedValue({ conectado: true });

      expect(await consultarEstado()).toBe(true);
      expect(mockBackendRequest.mock.calls[0][0]).toBe('/api/v1/google/estado');
    });

    it('traduce desconectado false sin inventar eventos', async () => {
      mockBackendRequest.mockResolvedValue({ conectado: false });

      expect(await consultarEstado()).toBe(false);
    });
  });

  describe('cargarEventos', () => {
    it('pide el rango con desde y hasta', async () => {
      mockBackendRequest.mockResolvedValue({ conectado: false });

      await cargarEventos('2026-07-27', '2026-09-06');

      expect(mockBackendRequest.mock.calls[0][0]).toBe(
        '/api/v1/calendario/google?desde=2026-07-27&hasta=2026-09-06'
      );
    });

    it('mapea el contrato snake_case a camelCase', async () => {
      mockBackendRequest.mockResolvedValue({
        conectado: true,
        eventos: [
          { id: 'ev-1', titulo: 'Dentista', inicio: '2026-08-11T10:00:00Z', fin: '2026-08-11T11:00:00Z', todo_el_dia: false },
          { id: 'ev-2', titulo: 'Viaje', inicio: '2026-08-14T00:00:00Z', fin: '2026-08-16T23:59:59Z', todo_el_dia: true },
        ],
        dias: { 'ev-1': ['2026-08-11'], 'ev-2': ['2026-08-14', '2026-08-15'] },
      });

      const ventana = await cargarEventos('2026-08-01', '2026-08-31');

      expect(ventana.conectado).toBe(true);
      expect(ventana.eventos[1]).toEqual({
        id: 'ev-2',
        titulo: 'Viaje',
        inicio: '2026-08-14T00:00:00Z',
        fin: '2026-08-16T23:59:59Z',
        todoElDia: true,
      });
      expect(ventana.diasPorEvento['ev-2']).toEqual(['2026-08-14', '2026-08-15']);
    });

    it('desconectado es un estado normal, no un error', async () => {
      // El backend responde SOLO {conectado:false}: la ventana queda vacia.
      mockBackendRequest.mockResolvedValue({ conectado: false });

      const ventana = await cargarEventos('2026-08-01', '2026-08-31');

      expect(ventana).toEqual({ conectado: false, eventos: [], diasPorEvento: {} });
    });
  });

  describe('desconectar', () => {
    it('borra con DELETE y no espera cuerpo', async () => {
      mockBackendRequest.mockResolvedValue(undefined);

      await desconectar();

      expect(mockBackendRequest).toHaveBeenCalledWith('/api/v1/google/oauth', {
        method: 'DELETE',
      });
    });
  });
});
