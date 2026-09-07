import { ScheduledActivity, Schedule } from '../../domain/entities/Schedule';
import { NotificationScheduler } from '../../application/ports/out/NotificationScheduler';
import { dayOfWeekToExpoWeekday } from '../../presentation/utils/scheduleUtils';

// Cada actividad programa 2 notificaciones (10 min antes + inicio) e iOS
// descarta silenciosamente locales pendientes más allá de 64: cap de 32.
const DEFAULT_CAP = 32;

export function selectNotifiableOccurrences(
  items: ScheduledActivity[],
  cap: number = DEFAULT_CAP
): { included: ScheduledActivity[]; truncatedCount: number } {
  const notifiable = items.filter((item) => !!item.activity);

  const sorted = [...notifiable].sort((a, b) => {
    const anchorA = a.activity!.isAnchor ? 1 : 0;
    const anchorB = b.activity!.isAnchor ? 1 : 0;
    if (anchorA !== anchorB) return anchorB - anchorA;
    return b.activity!.priority - a.activity!.priority;
  });

  const included = sorted.slice(0, cap);
  const truncatedCount = Math.max(0, sorted.length - included.length);
  return { included, truncatedCount };
}

function buildIdentifier(item: ScheduledActivity, sufijo: string): string {
  return `schedule:${item.activity!.id}:${item.day}:${item.assignedStartTime}:${sufijo}`;
}

/** Resta minutos al horario; devuelve null si cruza al día anterior (inicio
 * 00:00-00:09 no puede tener aviso previo sin cambiar de día). */
function timeMinusMinutes(
  hour: number,
  minute: number,
  minutos: number
): { hour: number; minute: number } | null {
  const total = hour * 60 + minute - minutos;
  if (total < 0) return null;
  return { hour: Math.floor(total / 60), minute: total % 60 };
}

export async function syncActivityNotifications(
  schedule: Schedule | null,
  scheduler: NotificationScheduler
): Promise<void> {
  try {
    const permissionStatus = await scheduler.getPermissionStatus();
    if (permissionStatus !== 'granted') {
      return;
    }

    await scheduler.cancelAll();

    if (!schedule) {
      return;
    }

    const { included, truncatedCount } = selectNotifiableOccurrences(schedule.getAllItems());
    if (truncatedCount > 0) {
      console.warn(
        `[ActivityNotificationSync] Se omitieron ${truncatedCount} notificaciones por el límite de notificaciones locales pendientes.`
      );
    }

    const results = await Promise.allSettled(
      included.flatMap((item) => {
        const [hour, minute] = item.assignedStartTime.split(':').map(Number);
        const title = item.activity!.title;

        // Aviso de "empieza en 10 minutos" (solo si no cruza de día).
        const previo = timeMinusMinutes(hour, minute, 10);
        const avisos = previo
          ? [{
              identifier: buildIdentifier(item, 'previo'),
              title,
              body: 'Empieza en 10 minutos',
              weekday: dayOfWeekToExpoWeekday(item.day),
              hour: previo.hour,
              minute: previo.minute,
            }]
          : [];

        // Aviso de la hora exacta.
        avisos.push({
          identifier: buildIdentifier(item, 'inicio'),
          title,
          body: 'Empieza ahora',
          weekday: dayOfWeekToExpoWeekday(item.day),
          hour,
          minute,
        });

        return avisos.map((aviso) =>
          scheduler.scheduleWeekly(aviso)
        );
      })
    );

    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (rejected.length > 0) {
      console.error(
        `[ActivityNotificationSync] ${rejected.length} notificaciones fallaron al programarse:`,
        rejected.map((r) => r.reason)
      );
    }
  } catch (e) {
    console.error('[ActivityNotificationSync] Error sincronizando notificaciones:', e);
  }
}
