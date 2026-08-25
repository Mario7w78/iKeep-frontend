import { AreaDeVida } from '../entities/lifeArea';

/**
 * Qué vale la pena destacar del día que recién se cerró.
 *
 * El resumen post-cierre necesita UNA afirmación sobre el día: en qué área
 * se movió más. Calcularlo mal tiene un costo concreto —nombrar un ganador
 * arbitrario inventa un hecho, y nombrar dos diluye el mensaje hasta no
 * decir nada—. Por eso la regla es estricta: solo si un área va claramente
 * adelante de todas las demás.
 *
 * Es el mismo criterio de `masOlvidadaDe` en `lifeBalance`: solo se afirma
 * lo que es verdad. Un empate en el primer puesto no dice "Salud", dice
 * "no sé" — y "no sé" acá se calla.
 */

export interface ItemConArea {
  id: string;
  area?: AreaDeVida;
}

/** Única área con más hechas que las demás; null si hay empate o nada hecho. */
export function areaDestacada(
  items: ItemConArea[],
  hechasIds: string[]
): AreaDeVida | null {
  const hechas = new Set(hechasIds);
  const conteos = new Map<AreaDeVida, number>();

  for (const item of items) {
    // Sin área declarada no hay nada que atribuir: contarla sería inventar.
    if (!item.area || !hechas.has(item.id)) continue;
    conteos.set(item.area, (conteos.get(item.area) ?? 0) + 1);
  }

  let mejor: AreaDeVida | null = null;
  let maximo = 0;

  for (const [area, conteo] of conteos) {
    if (conteo > maximo) {
      mejor = area;
      maximo = conteo;
    } else if (conteo === maximo) {
      // Empate en el primer puesto: ninguna merece el título. Y como sigue
      // mirando, un tercer área con más que el empate igual lo gana.
      mejor = null;
    }
  }

  return maximo > 0 ? mejor : null;
}
