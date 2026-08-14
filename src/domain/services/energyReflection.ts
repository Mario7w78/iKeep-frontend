import { EnergyRecord } from '../../application/ports/out/EnergyRepository';

/**
 * Lo que la app le devuelve al usuario cuando dice cómo está.
 *
 * Hasta ahora el check-in era mudo: elegías tu energía, el dato viajaba al
 * solver y nunca volvía. Preguntar algo y no hacer nada visible con la
 * respuesta enseña que la pregunta es decorativa, y a la segunda semana nadie
 * la contesta.
 *
 * Solo afirma cosas que se pueden comprobar con el historial que ya existe.
 * No promete que el horario cambiará —eso solo es cierto si el usuario
 * regenera— ni inventa patrones con dos días de datos: un dato falso quema la
 * credibilidad de todos los siguientes.
 *
 * Es lógica pura y se prueba sin red ni base.
 */

/** Debajo de esto no hay historial suficiente para afirmar nada. */
const MINIMO_PARA_PATRON = 14;

export interface Reflexion {
  /** Lo que se le muestra. `null` cuando no hay nada honesto que decir. */
  texto: string | null;
  /** Qué la originó. Solo para tests y depuración. */
  motivo: 'racha' | 'cambio' | 'patron' | null;
}

const NADA: Reflexion = { texto: null, motivo: null };

/**
 * El reporte diario va de 1 a 3 — son las tres opciones del picker y lo que
 * el backend valida (`stored_schedule.py`, `nivel: int = Field(ge=1, le=3)`).
 *
 * No confundir con `nivel_energia` del PERFIL, que va de 1 a 5: es la
 * preferencia general de carga, no cómo amaneciste hoy.
 */
const NOMBRE: Record<number, string> = {
  1: 'baja',
  2: 'estable',
  3: 'alta',
};

function banda(nivel: number): 'baja' | 'estable' | 'alta' {
  return (NOMBRE[nivel] ?? 'estable') as 'baja' | 'estable' | 'alta';
}

/** `YYYY-MM-DD` del día del usuario, no del UTC. */
function comoDiaLocal(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dia}`;
}

/**
 * El día al que pertenece un registro PARA EL USUARIO.
 *
 * Cortar los primeros diez caracteres del ISO daría el día en UTC, que no es
 * el mismo: reportar a las 20:00 en Lima se guarda como el día siguiente. Eso
 * partiría en dos una racha real y contaría dos veces un mismo día. El mismo
 * error que `ApiEnergyRepository.reportedToday` ya tuvo que corregir.
 */
function aDia(iso: string): string {
  return comoDiaLocal(new Date(iso));
}

function fechaDeHoy(): string {
  return comoDiaLocal(new Date());
}

/**
 * Un registro por día, del más reciente al más viejo.
 *
 * Si alguien reportó dos veces el mismo día vale el último: cambiar de
 * opinión a las dos horas es normal y el dato bueno es el segundo.
 */
function porDia(historial: EnergyRecord[]): { dia: string; nivel: number }[] {
  const vistos = new Map<string, number>();
  const ordenado = [...historial].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  );
  for (const r of ordenado) {
    const dia = aDia(r.timestamp);
    if (!vistos.has(dia)) vistos.set(dia, r.nivel);
  }
  return [...vistos.entries()].map(([dia, nivel]) => ({ dia, nivel }));
}

/**
 * Qué decirle a alguien que acaba de reportar `nivelHoy`.
 *
 * Devuelve `texto: null` cuando no hay nada verdadero que valga la pena
 * decir. Callarse es una respuesta válida; inventar no.
 */
export function reflexionar(
  nivelHoy: number,
  historial: EnergyRecord[],
  hoy: string = fechaDeHoy()
): Reflexion {
  const dias = porDia(historial);
  const bandaHoy = banda(nivelHoy);

  // El registro de hoy puede estar o no en el historial según si ya se
  // guardó cuando se llama. Se descarta por FECHA y no por posición: dar por
  // hecho que el más reciente es el de hoy hace que el día anterior
  // desaparezca cuando todavía no se guardó nada.
  const previos = dias.filter((d) => d.dia !== hoy);

  // 1 · Días seguidos en la misma banda. Es lo más barato de comprobar y lo
  //     único que se puede afirmar desde el primer par de días.
  let seguidos = 1;
  for (const d of previos) {
    if (banda(d.nivel) === bandaHoy) seguidos++;
    else break;
  }

  if (seguidos >= 3) {
    return {
      // Se nombra, no se juzga. Y con energía baja se ofrece algo, porque
      // nombrar un mal tramo sin salida es solo señalarlo.
      texto:
        bandaHoy === 'baja'
          ? `${seguidos} días seguidos con la energía baja. Quizá convenga aligerar la semana.`
          : `${seguidos} días seguidos con la energía ${bandaHoy}.`,
      motivo: 'racha',
    };
  }

  // 2 · Cambió respecto de ayer.
  const ayer = previos[0];
  if (ayer && banda(ayer.nivel) !== bandaHoy) {
    const antes = banda(ayer.nivel);
    if (antes === 'baja' && bandaHoy !== 'baja') {
      return { texto: 'Ayer estabas con la energía baja. Hoy mejor.', motivo: 'cambio' };
    }
    if (bandaHoy === 'baja') {
      return { texto: 'Hoy bajaste respecto de ayer. Tenlo en cuenta al planear.', motivo: 'cambio' };
    }
  }

  // 3 · Comparación con tu propio patrón. Exige historial de verdad: afirmar
  //     un patrón con dos semanas de datos es inventarlo.
  if (previos.length >= MINIMO_PARA_PATRON) {
    const promedio =
      previos.reduce((suma, d) => suma + d.nivel, 0) / (previos.length || 1);
    if (nivelHoy >= promedio + 1) {
      return { texto: 'Hoy estás por encima de tu promedio.', motivo: 'patron' };
    }
    if (nivelHoy <= promedio - 1) {
      return { texto: 'Hoy estás por debajo de tu promedio.', motivo: 'patron' };
    }
  }

  return NADA;
}
