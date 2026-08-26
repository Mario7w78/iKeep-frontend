/**
 * El recuerdo de Google, aparte del calendario propio (D7).
 */

jest.mock('../../api/GoogleCalendarApiService', () => ({
  cargarEventos: (...a: any[]) => mockCargarEventos(...a),
  consultarEstado: (...a: any[]) => mockConsultarEstado(...a),
  desconectar: (...a: any[]) => mockDesconectar(...a),
}));

const mockCargarEventos = jest.fn();
const mockConsultarEstado = jest.fn();
const mockDesconectar = jest.fn();

jest.mock('../../api/backendClient', () => ({
  BackendError: class BackendError extends Error {
    status: number | null;
    constructor(message: string, status: number | null = null) {
      super(message);
      this.status = status;
    }
    get isAuthError() {
      return this.status === 401;
    }
  },
}));

import { useGoogleCalendarStore } from '../useGoogleCalendarStore';
import { BackendError } from '../../api/backendClient';

const EVENTO = {
  id: 'ev-1',
  titulo: 'Dentista',
  inicio: '2026-08-11T13:00:00Z',
  fin: '2026-08-11T14:00:00Z',
  todoElDia: false,
};

function resetStore(overrides: Record<string, unknown> = {}) {
  useGoogleCalendarStore.setState({
    estado: 'desconectado',
    porDia: {},
    cargando: false,
    error: null,
    verificado: false,
    ...overrides,
  });
}

describe('useGoogleCalendarStore', () => {
  beforeEach(() => {
    mockCargarEventos.mockReset().mockResolvedValue({ conectado: true, eventos: [], diasPorEvento: {} });
    mockConsultarEstado.mockReset().mockResolvedValue(false);
    mockDesconectar.mockReset().mockResolvedValue(undefined);
    resetStore();
  });

  describe('verificarEstado', () => {
    it('traduce conectado y desconectado', async () => {
      mockConsultarEstado.mockResolvedValue(true);
      await expect(useGoogleCalendarStore.getState().verificarEstado()).resolves.toBe('conectado');

      mockConsultarEstado.mockResolvedValue(false);
      await expect(useGoogleCalendarStore.getState().verificarEstado()).resolves.toBe('desconectado');
    });

    it('un fallo de red conserva el estado que ya sabiamos', async () => {
      resetStore({ estado: 'conectado' });
      mockConsultarEstado.mockRejectedValue(new Error('sin red'));

      await expect(useGoogleCalendarStore.getState().verificarEstado()).resolves.toBe('conectado');
    });
  });

  describe('cargar', () => {
    it('primera vez pregunta estado y, conectado, trae eventos', async () => {
      mockConsultarEstado.mockResolvedValue(true);
      mockCargarEventos.mockResolvedValue({
        conectado: true,
        eventos: [EVENTO],
        diasPorEvento: { 'ev-1': ['2026-08-11'] },
      });

      await useGoogleCalendarStore.getState().cargar('2026-07-27', '2026-09-06');

      expect(mockConsultarEstado).toHaveBeenCalledTimes(1);
      expect(mockCargarEventos).toHaveBeenCalledWith('2026-07-27', '2026-09-06');
      expect(useGoogleCalendarStore.getState().porDia['2026-08-11']).toEqual([EVENTO]);
    });

    it('ya verificado no vuelve a preguntar /estado', async () => {
      resetStore({ estado: 'conectado', verificado: true });

      await useGoogleCalendarStore.getState().cargar('2026-08-01', '2026-08-31');

      expect(mockConsultarEstado).not.toHaveBeenCalled();
      expect(mockCargarEventos).toHaveBeenCalledTimes(1);
    });

    it('desconectado conocido hace CERO llamadas google', async () => {
      // spec external-events-ui: tras desconectar, navegar meses no dispara
      // ninguna llamada. El flag verificado evita re-preguntar /estado.
      resetStore({ estado: 'desconectado', verificado: true });

      await useGoogleCalendarStore.getState().cargar('2026-08-01', '2026-08-31');

      expect(mockConsultarEstado).not.toHaveBeenCalled();
      expect(mockCargarEventos).not.toHaveBeenCalled();
    });

    it('expande multi-dia: el evento aparece en cada dia que ocupa', async () => {
      resetStore({ estado: 'conectado', verificado: true });
      const viaje = { ...EVENTO, id: 'ev-2', titulo: 'Viaje' };
      mockCargarEventos.mockResolvedValue({
        conectado: true,
        eventos: [viaje],
        diasPorEvento: { 'ev-2': ['2026-08-14', '2026-08-15', '2026-08-16'] },
      });

      await useGoogleCalendarStore.getState().cargar('2026-08-01', '2026-08-31');

      const { porDia } = useGoogleCalendarStore.getState();
      expect(porDia['2026-08-14']).toEqual([viaje]);
      expect(porDia['2026-08-15']).toEqual([viaje]);
      expect(porDia['2026-08-16']).toEqual([viaje]);
    });

    it('un evento sin entrada en dias cae en su dia de inicio', async () => {
      resetStore({ estado: 'conectado', verificado: true });
      mockCargarEventos.mockResolvedValue({
        conectado: true,
        eventos: [{ ...EVENTO, inicio: '2026-08-11T10:00:00-03:00' }],
        diasPorEvento: {},
      });

      await useGoogleCalendarStore.getState().cargar('2026-08-01', '2026-08-31');

      // 10:00-03:00 son las 13:00 locales del test runner (UTC): mismo dia.
      expect(Object.keys(useGoogleCalendarStore.getState().porDia)).toHaveLength(1);
    });

    it('401 manda a reconexion y borra lo mostrado, sin error ruidoso', async () => {
      resetStore({ estado: 'conectado', verificado: true, porDia: { '2026-08-11': [EVENTO] } });
      mockCargarEventos.mockRejectedValue(new BackendError('reconnect', 401));

      await useGoogleCalendarStore.getState().cargar('2026-08-01', '2026-08-31');

      const s = useGoogleCalendarStore.getState();
      expect(s.estado).toBe('reconexion');
      expect(s.porDia).toEqual({});
    });

    it('un fallo transitorio deja error aislado, nunca lanza', async () => {
      resetStore({ estado: 'conectado', verificado: true });
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockCargarEventos.mockRejectedValue(new BackendError('boom', 503));

      await expect(
        useGoogleCalendarStore.getState().cargar('2026-08-01', '2026-08-31')
      ).resolves.toBeUndefined();

      const s = useGoogleCalendarStore.getState();
      expect(s.error).toBeTruthy();
      expect(s.estado).toBe('conectado');   // la conexion sigue; fue transitorio
      expect(s.cargando).toBe(false);
    });
  });

  describe('confirmarConexion', () => {
    it('devuelve true solo si quedo conectado', async () => {
      mockConsultarEstado.mockResolvedValue(true);

      await expect(useGoogleCalendarStore.getState().confirmarConexion()).resolves.toBe(true);

      mockConsultarEstado.mockResolvedValue(false);
      await expect(useGoogleCalendarStore.getState().confirmarConexion()).resolves.toBe(false);
    });
  });

  describe('desconectar', () => {
    it('borra TODO lo local y queda verificado como desconectado', async () => {
      resetStore({
        estado: 'conectado',
        verificado: true,
        porDia: { '2026-08-11': [EVENTO] },
      });

      await useGoogleCalendarStore.getState().desconectar();

      const s = useGoogleCalendarStore.getState();
      expect(mockDesconectar).toHaveBeenCalledTimes(1);
      expect(s.estado).toBe('desconectado');
      expect(s.porDia).toEqual({});
      expect(s.verificado).toBe(true);   // cero llamadas google al navegar despues
    });

    it('si el servidor no se entero, no miente: conserva el estado', async () => {
      resetStore({ estado: 'conectado', verificado: true, porDia: { '2026-08-11': [EVENTO] } });
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockDesconectar.mockRejectedValue(new Error('sin red'));

      await useGoogleCalendarStore.getState().desconectar();

      const s = useGoogleCalendarStore.getState();
      expect(s.estado).toBe('conectado');
      expect(s.porDia['2026-08-11']).toEqual([EVENTO]);   // los tokens siguen vivos alla
      expect(s.error).toBeTruthy();
    });
  });
});
