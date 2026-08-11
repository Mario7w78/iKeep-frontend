/**
 * El ciclo de recompensa.
 *
 * Sin poder marcar algo como hecho, la app es una agenda: muestra lo que
 * viene y nunca reconoce lo que paso.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const mockCompletar = jest.fn();
const mockDescompletar = jest.fn();
const mockResumen = jest.fn();

jest.mock('../../api/RewardsApiService', () => ({
  completarActividad: (...a: any[]) => mockCompletar(...a),
  descompletarActividad: (...a: any[]) => mockDescompletar(...a),
  obtenerResumen: (...a: any[]) => mockResumen(...a),
  fechaLocal: () => '2026-08-11',
}));

import { useRewardsStore } from '../useRewardsStore';

const RESUMEN = {
  racha: { actual: 3, mejor: 5, enRiesgo: false },
  progreso: {
    completadas: 1,
    total: 3,
    fraccion: 1 / 3,
    terminado: false,
    completadosIds: ['act-1'],
  },
};

function estado() {
  return useRewardsStore.getState();
}

describe('useRewardsStore', () => {
  beforeEach(() => {
    mockCompletar.mockReset().mockResolvedValue(undefined);
    mockDescompletar.mockReset().mockResolvedValue(undefined);
    mockResumen.mockReset().mockResolvedValue(RESUMEN);
    useRewardsStore.setState({
      racha: { actual: 0, mejor: 0, enRiesgo: false },
      progreso: {
        completadas: 0,
        total: 0,
        fraccion: 1,
        terminado: false,
        completadosIds: [],
      },
      diasTerminados: 0,
    });
  });

  it('carga racha y progreso', async () => {
    await estado().cargar();

    expect(estado().racha.actual).toBe(3);
    expect(estado().progreso.total).toBe(3);
  });

  it('un fallo al cargar no rompe la pantalla', async () => {
    // La racha es un adorno sobre lo que el usuario vino a ver.
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockResumen.mockRejectedValue(new Error('sin red'));

    await estado().cargar();

    expect(estado().cargando).toBe(false);
  });

  it('marcar actualiza antes de que el servidor conteste', async () => {
    useRewardsStore.setState({
      progreso: { ...RESUMEN.progreso, completadas: 0, completadosIds: [], total: 2 },
    });
    let durante: string[] = [];
    mockCompletar.mockImplementation(async () => {
      durante = estado().progreso.completadosIds;
    });

    await estado().alternar('act-9');

    expect(durante).toEqual(['act-9']);
  });

  it('si el servidor rechaza, se revierte', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    useRewardsStore.setState({
      progreso: { ...RESUMEN.progreso, completadas: 0, completadosIds: [], total: 2 },
    });
    mockCompletar.mockRejectedValue(new Error('409'));

    await estado().alternar('act-9');

    expect(estado().progreso.completadosIds).toEqual([]);
  });

  it('volver a tocar desmarca', async () => {
    useRewardsStore.setState({
      progreso: { ...RESUMEN.progreso, completadosIds: ['act-1'], total: 2 },
    });

    await estado().alternar('act-1');

    expect(mockDescompletar).toHaveBeenCalledWith('act-1', '2026-08-11');
  });

  it('terminar el dia cuenta una vez', async () => {
    useRewardsStore.setState({
      progreso: { ...RESUMEN.progreso, completadas: 0, completadosIds: [], total: 1 },
    });

    await estado().alternar('act-1');

    expect(estado().diasTerminados).toBe(1);
  });

  it('desmarcar y volver a marcar no vuelve a celebrar de la nada', async () => {
    // Sin el guard, cada ida y vuelta dispararia la celebracion.
    useRewardsStore.setState({
      progreso: {
        ...RESUMEN.progreso,
        completadas: 1,
        completadosIds: ['act-1'],
        total: 1,
        terminado: true,
      },
      diasTerminados: 1,
    });

    await estado().alternar('act-1');

    expect(estado().diasTerminados).toBe(1);
  });

  it('la racha la recalcula el servidor y no el cliente', async () => {
    // Dos implementaciones de las reglas de borde terminarian discrepando.
    useRewardsStore.setState({
      progreso: { ...RESUMEN.progreso, completadosIds: [], total: 2 },
    });

    await estado().alternar('act-9');

    expect(mockResumen).toHaveBeenCalled();
  });
});
