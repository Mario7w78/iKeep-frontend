import { DayOfWeek } from '../../domain/entities/Activity';
import { DayConfig } from '../../domain/entities/activity.types';

/**
 * Devuelve las horas de `daysConfig` a ser Date.
 *
 * Viven dentro de una columna jsonb, asi que sobreviven el viaje como texto
 * ISO sin importar por donde vengan —Supabase directo o el backend—. El
 * dominio las quiere como Date, y quien las reciba debe restaurarlas antes de
 * construir la entidad.
 *
 * Vive suelta y no dentro de un adaptador porque la usan varios: dejarla en
 * el de Supabase obligaba al que habla con el backend a importar el cliente
 * de Supabase entero solo para esto.
 */
export function restoreDaysConfig(
  raw: Record<string, any> | null | undefined
): Partial<Record<DayOfWeek, DayConfig>> {
  const restored: Record<string, any> = raw ? { ...raw } : {};
  Object.keys(restored).forEach((day) => {
    const config = restored[day];
    if (config?.partitions) {
      config.partitions = config.partitions.map((p: any) => ({
        ...p,
        startHour: new Date(p.startHour),
        endHour: new Date(p.endHour),
      }));
    }
  });
  return restored;
}
