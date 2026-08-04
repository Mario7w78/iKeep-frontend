/**
 * El decorador que hace que abrir la app no dependa de que el backend este
 * despierto. Envuelve a cualquier ActivityRepository, asi que sirve tanto
 * sobre el adaptador del backend como sobre el de Supabase.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Activity } from '../../../domain/entities/Activity';
import { CachedActivityRepository } from '../CachedActivityRepository';

const leer = AsyncStorage.getItem as jest.Mock;

function actividad(id: string): Activity {
  return new Activity({
    id,
    title: `Actividad ${id}`,
    type: 'fija' as any,
    identity: 'clase' as any,
    priority: 1,
    difficulty: 'media' as any,
    deadline: null,
    daysEnabled: [] as any,
    daysConfig: {},
    optionalDay: false,
    isAnchor: false,
  });
}

describe('CachedActivityRepository', () => {
  let interno: any;
  let repo: CachedActivityRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    leer.mockResolvedValue(null);
    interno = {
      getAll: jest.fn().mockResolvedValue([actividad('a')]),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    repo = new CachedActivityRepository(interno);
  });

  it('sin cache pide al repositorio real', async () => {
    const actividades = await repo.getAll();

    expect(interno.getAll).toHaveBeenCalledTimes(1);
    expect(actividades.map((a) => a.id)).toEqual(['a']);
  });

  it('guarda en cache lo que devuelve el repositorio', async () => {
    await repo.getAll();

    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('devuelve lo cacheado cuando el repositorio falla', async () => {
    /** Esta es la razon de existir: el backend dormido no deja al usuario
     *  sin sus datos. */
    leer.mockResolvedValue(
      JSON.stringify({ v: 1, data: [{ id: 'b', title: 'Vieja', type: 'fija' }] })
    );
    interno.getAll.mockRejectedValue(new Error('timeout'));

    const actividades = await repo.getAll();

    expect(actividades.map((a) => a.id)).toEqual(['b']);
    expect(actividades[0]).toBeInstanceOf(Activity);
  });

  it('si falla y no hay cache, propaga el error', async () => {
    /** Sin nada que mostrar, ocultar el fallo dejaria una lista vacia que
     *  el usuario leeria como "se borraron mis actividades". */
    interno.getAll.mockRejectedValue(new Error('timeout'));

    await expect(repo.getAll()).rejects.toThrow('timeout');
  });

  it('leer en cache no evita ir al servidor', async () => {
    /** La cache adelanta la respuesta, no reemplaza la verdad. */
    leer.mockResolvedValue(JSON.stringify({ v: 1, data: [] }));

    await repo.getAll();

    expect(interno.getAll).toHaveBeenCalledTimes(1);
  });

  it('guardar invalida la cache', async () => {
    await repo.save(actividad('a'));

    expect(interno.save).toHaveBeenCalled();
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });

  it('borrar invalida la cache', async () => {
    await repo.delete('a');

    expect(interno.delete).toHaveBeenCalledWith('a');
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });

  it('no invalida si la escritura fallo', async () => {
    /** Si el guardado no llego al servidor, lo cacheado sigue siendo lo
     *  ultimo cierto que conocemos. */
    interno.save.mockRejectedValue(new Error('timeout'));

    await expect(repo.save(actividad('a'))).rejects.toThrow();
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
  });
});
