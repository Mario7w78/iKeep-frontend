/**
 * La sesión enfocada.
 *
 * Cuando propuse esto puse a Forest como referencia, y me equivoqué en la
 * parte que importa: la mecánica que hace funcionar a Forest —te vas de la
 * app y el árbol muere— NO se puede replicar de forma justa.
 *
 * Lo que React Native puede observar es `AppState` con tres valores:
 * `active`, `background` e `inactive`. Y en iOS `inactive` se dispara con un
 * banner de notificación, con el centro de control, con una llamada
 * entrante. No hay forma de distinguir «se fue a Instagram» de «le escribió
 * la madre» ni de «bloqueó la pantalla para leer el libro». Castigar eso es
 * castigar el azar — y el caso que más castigaría es justamente el de quien
 * deja el teléfono de lado para estudiar de verdad.
 *
 * Acá la sesión no muere: registra presencia y se puede retomar.
 *
 * ── La decisión técnica que sostiene todo lo demás ──
 *
 * El tiempo NO se acumula con un temporizador que suma cada segundo. iOS
 * suspende el JS al rato de irse a background, así que un contador así se
 * queda dormido y la sesión cuenta de menos justo cuando el usuario hizo lo
 * correcto. Se deriva de las marcas de tiempo, que siguen corriendo aunque
 * la app no exista.
 */

/** Más allá de esto no se puede afirmar qué pasó. Ver `EstadoSesion`. */
export const HORAS_HASTA_CADUCAR = 12;

export type EstadoSesion =
  /** Todavía no llegó a la meta. */
  | 'en_curso'
  /** Llegó. Falta que el usuario lo confirme — nunca se marca sola. */
  | 'lista'
  /**
   * Pasó tanto tiempo que afirmar algo sería inventarlo: alguien empezó una
   * sesión de 25 minutos y volvió a abrir la app al día siguiente. Decir que
   * estudió catorce horas es ficción, y la ficción envenena el dato.
   */
  | 'caducada';

export interface SesionEnfocada {
  activityId: string;
  /** ISO. La sesión se reconstruye de acá, no de un contador en memoria. */
  iniciadaEn: string;
  /** Cuánto se propuso. En minutos. */
  metaMinutos: number;
  /**
   * Cuántas veces salió de la app. Es INFORMACIÓN, no una falta: puede ser
   * una llamada, un banner, o haber bloqueado la pantalla para leer.
   */
  salidas: number;
}

export function iniciar(
  activityId: string,
  metaMinutos: number,
  ahora: Date = new Date()
): SesionEnfocada {
  return {
    activityId,
    iniciadaEn: ahora.toISOString(),
    metaMinutos,
    salidas: 0,
  };
}

/** Minutos transcurridos, derivados del reloj y no de un contador. */
export function transcurrido(
  sesion: SesionEnfocada,
  ahora: Date = new Date()
): number {
  const ms = ahora.getTime() - new Date(sesion.iniciadaEn).getTime();
  return Math.max(0, Math.floor(ms / 60000));
}

export function estadoDe(
  sesion: SesionEnfocada,
  ahora: Date = new Date()
): EstadoSesion {
  const minutos = transcurrido(sesion, ahora);
  if (minutos >= HORAS_HASTA_CADUCAR * 60) return 'caducada';
  return minutos >= sesion.metaMinutos ? 'lista' : 'en_curso';
}

/**
 * Cuánto falta, de 0 a 1. Solo para dibujar.
 *
 * Nunca pasa de 1: seguir sentado después de la meta no es "más del 100%",
 * es haber cumplido y seguir.
 */
export function progreso(
  sesion: SesionEnfocada,
  ahora: Date = new Date()
): number {
  if (sesion.metaMinutos <= 0) return 1;
  return Math.min(1, transcurrido(sesion, ahora) / sesion.metaMinutos);
}

/**
 * Se fue de la app.
 *
 * No cancela nada ni resta: solo se anota. Registrar la salida sirve para
 * que el usuario lo vea si quiere; usarlo para castigar sería castigar el
 * azar, porque `AppState` no sabe por qué se fue.
 */
export function registrarSalida(sesion: SesionEnfocada): SesionEnfocada {
  return { ...sesion, salidas: sesion.salidas + 1 };
}

/**
 * Cuántos minutos se pueden acreditar honestamente.
 *
 * Se recorta a la meta: si alguien dejó la sesión abierta cuatro horas para
 * una tarea de 25 minutos, lo único cierto es que la hizo, no que estuvo
 * cuatro horas en ella.
 */
export function minutosAcreditables(
  sesion: SesionEnfocada,
  ahora: Date = new Date()
): number {
  return Math.min(transcurrido(sesion, ahora), sesion.metaMinutos);
}
