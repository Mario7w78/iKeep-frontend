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

import { BackendError } from '../../api/backendClient';
import { useRewardsStore } from '../useRewardsStore';

const RESUMEN = {
  racha: { actual: 3, mejor: 5, enRiesgo: false },
  progreso: {
    completadas: 1,
    total: 3,
    fraccion: 1 / 3,
    terminado: false,
    completadosIds: ['act-1'],
    noHechasIds: [],
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
        noHechasIds: [],
      },
      diasTerminados: 0,
      hidratado: false,
    });
  });

  it('carga racha y progreso', async () => {
    await estado().cargar();

    expect(estado().racha.actual).toBe(3);
    expect(estado().progreso.total).toBe(3);
  });

  it('queda hidratado recien cuando el resumen llega', async () => {
    // Quien dibuja preguntas depende de esto: antes de la primera respuesta
    // "vacio" y "no respondio nada" son indistinguibles.
    expect(estado().hidratado).toBe(false);

    await estado().cargar();

    expect(estado().hidratado).toBe(true);
  });

  it('un fallo no lo deja hidratado', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockResumen.mockRejectedValue(new Error('sin red'));

    await estado().cargar();

    expect(estado().hidratado).toBe(false);
  });

  it('un fallo al cargar no rompe la pantalla', async () => {
    // La racha es un adorno sobre lo que el usuario vino a ver.
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockResumen.mockRejectedValue(new Error('sin red'));

    await estado().cargar();

    expect(estado().cargando).toBe(false);
  });

  it('reintenta un 502 pasajero: la instancia se reinicio y vuelve', async () => {
    jest.useFakeTimers();
    mockResumen
      .mockRejectedValueOnce(new BackendError('El servidor respondio 502.', 502))
      .mockResolvedValueOnce(RESUMEN);

    const promesa = estado().cargar();
    await jest.advanceTimersByTimeAsync(10_000);
    await promesa;

    expect(mockResumen).toHaveBeenCalledTimes(2);
    expect(estado().racha.actual).toBe(3);
    jest.useRealTimers();
  });

  it('reintenta un fallo de red (status null)', async () => {
    jest.useFakeTimers();
    mockResumen
      .mockRejectedValueOnce(new BackendError('No se pudo conectar.', null))
      .mockResolvedValueOnce(RESUMEN);

    const promesa = estado().cargar();
    await jest.advanceTimersByTimeAsync(10_000);
    await promesa;

    expect(mockResumen).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it('pero no insiste para siempre', async () => {
    jest.useFakeTimers();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockResumen.mockRejectedValue(new BackendError('El servidor respondio 502.', 502));

    const promesa = estado().cargar();
    await jest.advanceTimersByTimeAsync(60_000);
    await promesa;

    expect(mockResumen).toHaveBeenCalledTimes(3);
    jest.useRealTimers();
  });

  it('no reintenta un error que no es pasajero', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockResumen.mockRejectedValue(new BackendError('Fecha invalida', 422));

    await estado().cargar();

    expect(mockResumen).toHaveBeenCalledTimes(1);
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
        noHechasIds: [],
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

  it('dos marcas rápidas no se pisan: el resumen viejo no borra la segunda', async () => {
    // Marcar es optimista y refresca después. Con dos marcas seguidas salen
    // dos resúmenes en paralelo; si el de la primera resuelve último con una
    // foto vieja, borraba la segunda marca y quedaba "marqué 2, contó 1".
    useRewardsStore.setState({
      progreso: { ...RESUMEN.progreso, completadas: 0, completadosIds: [], total: 2 },
    });

    const fotoVieja = {
      ...RESUMEN,
      progreso: { ...RESUMEN.progreso, completadas: 1, completadosIds: ['act-1'], total: 2 },
    };
    const fotoNueva = {
      ...RESUMEN,
      progreso: {
        ...RESUMEN.progreso,
        completadas: 2,
        completadosIds: ['act-1', 'act-2'],
        total: 2,
      },
    };

    let resolverVieja: (valor: any) => void = () => {};
    const promesaVieja = new Promise((r) => {
      resolverVieja = r;
    });
    mockResumen
      .mockReturnValueOnce(promesaVieja) // la marca de act-1 tarda y trae la foto de una sola
      .mockResolvedValueOnce(fotoNueva); // la de act-2 llega primero y ya trae las dos

    const primera = estado().alternar('act-1');
    const segunda = estado().alternar('act-2');
    await segunda;
    resolverVieja(fotoVieja);
    await primera;

    expect(estado().progreso.completadosIds).toEqual(['act-1', 'act-2']);
  });

  it('un "no la hice" de hoy se persiste como no_hecha, por día', async () => {
    // El deck del Home responde las cartas de hoy con ESTA accion. Que no se
    // guarde era el bug: la carta volvía a aparecer en cada apertura.
    await estado().marcarPasado('act-1', '2026-08-11', false);

    expect(mockCompletar).toHaveBeenCalledWith(
      'act-1', '2026-08-11', 'no_hecha', 'manual'
    );
    expect(mockResumen).toHaveBeenCalled(); // refresca: sale del carry-over
  });

  it('un "la hice" de un día anterior se persiste como hecha', async () => {
    await estado().marcarPasado('act-1', '2026-08-10', true);

    expect(mockCompletar).toHaveBeenCalledWith(
      'act-1', '2026-08-10', 'hecha', 'manual'
    );
  });
});
