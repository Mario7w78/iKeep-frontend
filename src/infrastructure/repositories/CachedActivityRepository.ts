import { ActivityRepository } from '../../application/ports/out/ActivityRepository';
import { Activity, ActivityType, DayOfWeek } from '../../domain/entities/Activity';
import { PersistentCache } from '../cache/persistentCache';
import { restoreDaysConfig } from './daysConfigMapper';

/**
 * Guarda una copia local de las actividades para sobrevivir un backend lento.
 *
 * Decora cualquier ActivityRepository en vez de estar metido dentro de uno:
 * asi sirve igual sobre el adaptador del backend o el de Supabase, y se puede
 * probar sin red.
 *
 * La lectura siempre va al repositorio real —la cache adelanta la respuesta,
 * no reemplaza la verdad—. Lo que cambia es el fallo: si el servidor no
 * responde y hay copia local, el usuario ve sus datos igual.
 *
 * Subir la version invalida lo guardado. Hay que hacerlo si cambia la forma
 * de Activity.
 */

const VERSION = 1;

interface ActivitySnapshot {
  id: string;
  title: string;
  type: string;
  identity?: string;
  priority?: number;
  difficulty?: string;
  deadline?: string | null;
  daysEnabled?: any[];
  daysConfig?: Record<string, any> | null;
  optionalDay?: boolean;
  dayFrom?: number | null;
  dayTo?: number | null;
  isAnchor?: boolean;
}

function aSnapshot(activity: Activity): ActivitySnapshot {
  return {
    id: String(activity.id),
    title: activity.title,
    type: activity.type,
    identity: activity.identity,
    priority: activity.priority,
    difficulty: activity.difficulty,
    deadline: activity.deadline,
    daysEnabled: activity.daysEnabled,
    daysConfig: activity.daysConfig,
    optionalDay: activity.optionalDay ?? false,
    dayFrom: activity.dayFrom ?? null,
    dayTo: activity.dayTo ?? null,
    isAnchor: activity.isAnchor ?? false,
  };
}

function desdeSnapshot(snapshot: ActivitySnapshot): Activity {
  return new Activity({
    id: String(snapshot.id),
    title: snapshot.title,
    type: snapshot.type as ActivityType,
    identity: (snapshot.identity ?? 'tarea') as any,
    priority: snapshot.priority ?? 3,
    difficulty: (snapshot.difficulty ?? 'media') as any,
    deadline: snapshot.deadline ?? null,
    daysEnabled: (snapshot.daysEnabled ?? []) as DayOfWeek[],
    // JSON.stringify convirtio las horas en texto; hay que devolverlas a Date
    // igual que cuando vienen del servidor.
    daysConfig: restoreDaysConfig(snapshot.daysConfig),
    optionalDay: snapshot.optionalDay ?? false,
    dayFrom: snapshot.dayFrom ?? undefined,
    dayTo: snapshot.dayTo ?? undefined,
    isAnchor: snapshot.isAnchor ?? false,
  });
}

export class CachedActivityRepository implements ActivityRepository {
  private readonly cache = new PersistentCache<ActivitySnapshot[]>(
    'activities',
    VERSION
  );

  constructor(private readonly inner: ActivityRepository) {}

  async getAll(): Promise<Activity[]> {
    try {
      const actividades = await this.inner.getAll();
      await this.cache.write(actividades.map(aSnapshot));
      return actividades;
    } catch (error) {
      const guardadas = await this.cache.read();
      if (guardadas) return guardadas.map(desdeSnapshot);

      // Sin copia local no hay nada que mostrar. Se propaga en vez de
      // devolver una lista vacia: el usuario leeria eso como "se borraron
      // mis actividades" en vez de como un problema de conexion.
      throw error;
    }
  }

  async save(activity: Activity): Promise<void> {
    await this.inner.save(activity);
    // Se invalida despues de que el servidor confirmo. Si la escritura fallo,
    // lo cacheado sigue siendo lo ultimo cierto que conocemos.
    await this.cache.clear();
  }

  async delete(id: string): Promise<void> {
    await this.inner.delete(id);
    await this.cache.clear();
  }
}
