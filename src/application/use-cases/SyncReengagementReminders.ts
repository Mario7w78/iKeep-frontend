import { NotificationScheduler } from '../ports/out/NotificationScheduler';
import {
  EstadoParaAvisos,
  TODOS_LOS_AVISOS,
  avisosQueCorresponden,
} from '../../domain/services/reengagementReminders';

/**
 * Deja los avisos de re-enganche igual a lo que dice el estado.
 *
 * Reconcilia en vez de dar de alta y de baja: se programa lo que corresponde
 * y se cancela todo lo demás. Así el sistema no necesita recordar qué había
 * antes, y una racha que se rompe deja de avisar sin que nadie lo ordene.
 *
 * Si el usuario no dio permiso, no se hace nada — ni siquiera se pregunta.
 * Pedirlo aquí sería sacarle un diálogo del sistema mientras marca una tarea.
 */
export async function sincronizarAvisos(
  scheduler: NotificationScheduler,
  estado: EstadoParaAvisos
): Promise<void> {
  const permiso = await scheduler.getPermissionStatus();
  if (permiso !== 'granted') return;

  const corresponden = avisosQueCorresponden(estado);
  const vigentes = new Set(corresponden.map((a) => a.identifier));

  for (const id of TODOS_LOS_AVISOS) {
    if (!vigentes.has(id)) {
      await scheduler.cancel(id).catch(() => undefined);
    }
  }

  for (const aviso of corresponden) {
    await scheduler.scheduleDaily(aviso).catch(() => undefined);
  }
}
