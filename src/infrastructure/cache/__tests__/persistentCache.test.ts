/**
 * Con el backend mediando los datos, una lectura puede costar 20-50s si la
 * instancia desperto. La cache existe para que el usuario vea sus datos igual
 * mientras eso ocurre: se muestra lo ultimo conocido y se revalida detras.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

import { PersistentCache } from '../persistentCache';

const leer = AsyncStorage.getItem as jest.Mock;
const escribir = AsyncStorage.setItem as jest.Mock;
const borrar = AsyncStorage.removeItem as jest.Mock;

describe('PersistentCache', () => {
  let cache: PersistentCache<{ n: number }>;

  beforeEach(() => {
    jest.clearAllMocks();
    leer.mockResolvedValue(null);
    cache = new PersistentCache<{ n: number }>('prueba', 1);
  });

  it('sin nada guardado devuelve null', async () => {
    await expect(cache.read()).resolves.toBeNull();
  });

  it('devuelve lo que se guardo', async () => {
    leer.mockResolvedValue(JSON.stringify({ v: 1, data: { n: 42 } }));

    await expect(cache.read()).resolves.toEqual({ n: 42 });
  });

  it('guarda con la version actual', async () => {
    await cache.write({ n: 7 });

    expect(escribir).toHaveBeenCalledWith(
      '@cache/prueba',
      JSON.stringify({ v: 1, data: { n: 7 } })
    );
  });

  it('descarta lo guardado con otra version', async () => {
    /** Si cambia la forma del dato, lo viejo no se puede interpretar. */
    leer.mockResolvedValue(JSON.stringify({ v: 0, data: { n: 42 } }));

    await expect(cache.read()).resolves.toBeNull();
  });

  it('descarta lo que no se puede parsear', async () => {
    leer.mockResolvedValue('esto no es json');

    await expect(cache.read()).resolves.toBeNull();
  });

  it('un fallo de almacenamiento no rompe la lectura', async () => {
    /** La cache es una optimizacion: si falla, se sigue sin ella. */
    leer.mockRejectedValue(new Error('disco lleno'));

    await expect(cache.read()).resolves.toBeNull();
  });

  it('un fallo al escribir tampoco explota', async () => {
    escribir.mockRejectedValue(new Error('disco lleno'));

    await expect(cache.write({ n: 1 })).resolves.toBeUndefined();
  });

  it('se puede limpiar', async () => {
    await cache.clear();

    expect(borrar).toHaveBeenCalledWith('@cache/prueba');
  });
});
