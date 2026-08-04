import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Copia local de datos del servidor, para mostrar algo mientras se revalida.
 *
 * Con el backend mediando el acceso a datos, una lectura puede costar 20-50s
 * si la instancia de Render desperto. Sin cache, el usuario mira un spinner
 * todo ese tiempo para ver una agenda que no cambio desde ayer.
 *
 * Es deliberadamente una optimizacion y nunca una fuente de verdad: cualquier
 * fallo de almacenamiento se traga y se responde como si no hubiera nada
 * guardado. Perder la cache solo cuesta una espera; hacerla fallar ruidosa
 * costaria una pantalla de error por algo que no le importa al usuario.
 */
export class PersistentCache<T> {
  private readonly key: string;

  /**
   * @param name  Identifica el dato guardado.
   * @param version Subirla invalida lo guardado. Hay que hacerlo cuando
   *   cambia la forma de T: lo viejo ya no se puede interpretar y devolverlo
   *   daria errores lejos de aca, en el codigo que lo consume.
   */
  constructor(name: string, private readonly version: number) {
    this.key = `@cache/${name}`;
  }

  async read(): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(this.key);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (parsed?.v !== this.version) return null;

      return parsed.data as T;
    } catch {
      return null;
    }
  }

  async write(data: T): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.key,
        JSON.stringify({ v: this.version, data })
      );
    } catch {
      // Sin cache se sigue funcionando; solo se pierde la lectura instantanea.
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.key);
    } catch {
      // Idem.
    }
  }
}
