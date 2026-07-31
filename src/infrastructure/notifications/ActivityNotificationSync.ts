import { ScheduledActivity, Schedule } from '../../domain/entities/Schedule';
import { NotificationScheduler } from '../../application/ports/out/NotificationScheduler';
import { dayOfWeekToExpoWeekday } from '../../presentation/utils/scheduleUtils';

const DEFAULT_CAP = 60; // iOS descarta silenciosamente notificaciones locales más allá de 64 pendientes.

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

function buildIdentifier(item: ScheduledActivity): string {
  return `schedule:${item.activity!.id}:${item.day}:${item.assignedStartTime}`;
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
      included.map((item) => {
        const [hour, minute] = item.assignedStartTime.split(':').map(Number);
        return scheduler.scheduleWeekly({
          identifier: buildIdentifier(item),
          title: item.activity!.title,
          body: 'Empieza ahora',
          weekday: dayOfWeekToExpoWeekday(item.day),
          hour,
          minute,
        });
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
