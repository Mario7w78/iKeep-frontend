import { AREAS, AreaDeVida } from '../entities/lifeArea';

/**
 * La flor de loto: cuánto hay de cada parte de tu vida.
 *
 * Arregla un problema real de las rachas — puedes tener treinta días seguidos
 * estudiando y haber dejado de dormir, de moverte y de ver gente, y la app te
 * felicita. Los pétalos son el único lugar donde eso se ve.
 *
 * Dos escalas, porque el loto necesita dos cosas y una sola respondería mal a
 * las dos:
 *
 *   tamaño  ← histórico, acumula desde siempre. NUNCA encoge.
 *   forma   ← ventana reciente. Sí cambia, y por eso dice algo sobre tu vida
 *             ahora y no sobre la de hace dos años.
 *
 * Ver un pétalo achicarse porque dejaste de correr es exactamente el reproche
 * que este diseño evita. Lo que abre el loto no es el volumen: es el
 * equilibrio. Una flor con un solo pétalo gigante no es una flor.
 *
 * Y la regla que lo sostiene: la flor muestra la FORMA de tu vida, no la
 * califica. En semana de exámenes vas a estar torcido, y así se ve una semana
 * de exámenes. Una flor a medio abrir no está rota: está abriéndose.
 */

export type ConteoPorArea = Record<string, number>;

/**
 * Cuántas veces hay que hacer algo de un área para que el pétalo se vea
 * crecido. No es un objetivo ni una cuota: es la escala del dibujo.
 */
const PARA_PETALO_LLENO = 40;

export interface Petalo {
  area: AreaDeVida;
  titulo: string;
  /** Lo acumulado desde siempre. */
  hechas: number;
  /** 0–1. Cuánto se dibuja. Nunca baja porque `hechas` nunca baja. */
  tamano: number;
}

export interface Flor {
  petalos: Petalo[];
  /**
   * 0–1. Cuán abierta está. Sale del EQUILIBRIO de lo reciente, no del
   * total: hacer mucho de una sola cosa no abre el loto.
   */
  apertura: number;
  /** El área más descuidada últimamente, o `null` si no hay nada que decir. */
  masOlvidada: AreaDeVida | null;
}

/** Crecimiento con rendimientos decrecientes: los primeros días se notan. */
function tamanoDe(hechas: number): number {
  if (hechas <= 0) return 0;
  return Math.min(1, Math.log(1 + hechas) / Math.log(1 + PARA_PETALO_LLENO));
}

/**
 * Cuán repartido está lo reciente, de 0 a 1.
 *
 * Es entropía normalizada: 1 cuando las cinco áreas llevan lo mismo, 0 cuando
 * todo está en una sola. Se eligió sobre "el pétalo más chico manda" porque
 * esa castiga con un cero cualquier área en blanco, y eso convierte la flor
 * en el reproche que no debe ser.
 */
function equilibrioDe(recientes: ConteoPorArea): number {
  const valores = AREAS.map((a) => Math.max(0, recientes[a.valor] ?? 0));
  const total = valores.reduce((s, v) => s + v, 0);
  if (total === 0) return 0;

  const usadas = valores.filter((v) => v > 0).length;
  if (usadas <= 1) return 0;

  let entropia = 0;
  for (const v of valores) {
    if (v === 0) continue;
    const p = v / total;
    entropia -= p * Math.log(p);
  }
  return Math.min(1, entropia / Math.log(AREAS.length));
}

/**
 * En qué área hay menos últimamente.
 *
 * Solo se afirma si de verdad hay un desnivel: señalar la "más olvidada"
 * cuando todo está parejo es inventar un problema. Y no se dice nada hasta
 * que hay actividad suficiente para que la comparación signifique algo.
 */
const MINIMO_PARA_COMPARAR = 8;

function masOlvidadaDe(recientes: ConteoPorArea): AreaDeVida | null {
  const total = AREAS.reduce((s, a) => s + (recientes[a.valor] ?? 0), 0);
  if (total < MINIMO_PARA_COMPARAR) return null;

  const ordenadas = [...AREAS].sort(
    (a, b) => (recientes[a.valor] ?? 0) - (recientes[b.valor] ?? 0)
  );
  const menor = recientes[ordenadas[0].valor] ?? 0;
  const mayor = recientes[ordenadas[ordenadas.length - 1].valor] ?? 0;

  // Si la diferencia no llega al doble, no hay desnivel que nombrar.
  return menor * 2 < mayor ? ordenadas[0].valor : null;
}

export function construirFlor(
  historico: ConteoPorArea,
  recientes: ConteoPorArea
): Flor {
  return {
    petalos: AREAS.map((a) => {
      const hechas = Math.max(0, historico[a.valor] ?? 0);
      return {
        area: a.valor,
        titulo: a.titulo,
        hechas,
        tamano: tamanoDe(hechas),
      };
    }),
    apertura: equilibrioDe(recientes),
    masOlvidada: masOlvidadaDe(recientes),
  };
}
