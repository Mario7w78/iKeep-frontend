import { ScheduledActivity } from '../entities/Schedule';

/**
 * Qué del día ya terminó y todavía nadie respondió.
 *
 * Es la lista que alimenta el cierre del día, y calcularla mal tiene una
 * consecuencia concreta: preguntar de nuevo por algo que el usuario ya
 * contestó. Eso es lo más rápido que hay para enseñarle a ignorar la
 * pregunta, y sin la pregunta el resto del sistema no tiene de dónde sacar
 * el dato.
 *
 * Hay TRES situaciones, no dos:
 *
 *   hecha        → contestó que sí
 *   no hecha     → contestó que no
 *   sin resolver → no contestó nada  ← las únicas que van acá
 *
 * Antes se calculaba como «todo lo que no está en completadas», y como
 * completadas solo trae las hechas —bien: decir la verdad no debe subir el
 * anillo del día— las «no hechas» caían del lado equivocado.
 *
 * Vive fuera de la pantalla porque son tres condiciones y equivocarse en una
 * no se ve mirando: se ve usando la app un martes a las once de la noche.
 */

export interface Pendiente {
  id: string;
  titulo: string;
}

interface Entrada {
  items: ScheduledActivity[];
  /** Minuto del día actual, para saber qué bloques ya terminaron. */
  minutoActual: number;
  completadas: string[];
  noHechas: string[];
}

function aMinutos(hhmm: string): number {
  const [h, m] = String(hhmm ?? '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function sinResponder({
  items,
  minutoActual,
  completadas,
  noHechas,
}: Entrada): Pendiente[] {
  // Un único conjunto: lo que importa acá no es QUÉ contestó, sino que
  // contestó. La distinción entre sí y no la usan la racha y los pétalos.
  const respondidas = new Set([...completadas, ...noHechas]);

  return items
    .filter((item) => item.activity && item.tipo !== 'viaje')
    .filter((item) => aMinutos(item.assignedEndTime) <= minutoActual)
    .filter((item) => !respondidas.has(String(item.activity!.id)))
    .map((item) => ({
      id: String(item.activity!.id),
      titulo: item.activity!.title || 'Actividad sin nombre',
    }));
}
