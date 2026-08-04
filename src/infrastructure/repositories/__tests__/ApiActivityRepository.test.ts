/**
 * El adaptador que reemplaza a SupabaseActivityRepository cuando el backend
 * media el acceso a datos. Implementa el mismo puerto, asi que los casos de
 * uso no cambian: lo unico que se verifica aca es el mapeo y las rutas.
 */

jest.mock('../../api/backendClient', () => ({
  backendRequest: jest.fn(),
  BackendError: class BackendError extends Error {},
}));

import { Activity } from '../../../domain/entities/Activity';
import { backendRequest } from '../../api/backendClient';
import { ApiActivityRepository } from '../ApiActivityRepository';

const pedir = backendRequest as jest.Mock;

const RESPUESTA = {
  id: 'act-1',
  user_id: 'usuario-1',
  title: 'Calculo',
  type: 'fija',
  identity: 'clase',
  priority: 1,
  difficulty: 'alta',
  deadline: null,
  days_enabled: ['martes'],
  days_config: {},
  optional_day: false,
  day_from: null,
  day_to: null,
  is_anchor: true,
};

describe('ApiActivityRepository', () => {
  let repo: ApiActivityRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new ApiActivityRepository();
  });

  it('lista las actividades del usuario', async () => {
    pedir.mockResolvedValue([RESPUESTA]);

    const actividades = await repo.getAll();

    expect(pedir).toHaveBeenCalledWith('/api/v1/actividades');
    expect(actividades).toHaveLength(1);
    expect(actividades[0]).toBeInstanceOf(Activity);
    expect(actividades[0].title).toBe('Calculo');
    expect(actividades[0].isAnchor).toBe(true);
  });

  it('reconstruye las fechas de la configuracion por dia', async () => {
    /** days_config viaja como JSON, asi que las horas llegan como texto. */
    pedir.mockResolvedValue([
      {
        ...RESPUESTA,
        days_config: {
          martes: {
            partitions: [
              {
                startHour: '2026-08-03T10:00:00.000Z',
                endHour: '2026-08-03T12:00:00.000Z',
              },
            ],
          },
        },
      },
    ]);

    const [actividad] = await repo.getAll();
    const particion = (actividad.daysConfig as any).martes.partitions[0];

    expect(particion.startHour).toBeInstanceOf(Date);
    expect(particion.endHour).toBeInstanceOf(Date);
  });

  it('sin actividades devuelve lista vacia', async () => {
    pedir.mockResolvedValue([]);

    await expect(repo.getAll()).resolves.toEqual([]);
  });

  it('guarda con PUT sobre el id de la actividad', async () => {
    pedir.mockResolvedValue(RESPUESTA);
    const actividad = new Activity({
      id: 'act-1',
      title: 'Calculo',
      type: 'fija' as any,
      identity: 'clase' as any,
      priority: 1,
      difficulty: 'alta' as any,
      deadline: null,
      daysEnabled: ['martes'] as any,
      daysConfig: {},
      optionalDay: false,
      isAnchor: true,
    });

    await repo.save(actividad);

    expect(pedir).toHaveBeenCalledWith(
      '/api/v1/actividades/act-1',
      expect.objectContaining({ method: 'PUT' })
    );
  });

  it('no manda user_id: lo pone el servidor desde el token', async () => {
    pedir.mockResolvedValue(RESPUESTA);
    const actividad = new Activity({
      id: 'act-1',
      title: 'Calculo',
      type: 'fija' as any,
      identity: 'clase' as any,
      priority: 1,
      difficulty: 'alta' as any,
      deadline: null,
      daysEnabled: [] as any,
      daysConfig: {},
      optionalDay: false,
      isAnchor: false,
    });

    await repo.save(actividad);

    const [, opciones] = pedir.mock.calls[0];
    expect(opciones.body).not.toHaveProperty('user_id');
  });

  it('borra con DELETE', async () => {
    pedir.mockResolvedValue(undefined);

    await repo.delete('act-1');

    expect(pedir).toHaveBeenCalledWith('/api/v1/actividades/act-1', {
      method: 'DELETE',
    });
  });
});
