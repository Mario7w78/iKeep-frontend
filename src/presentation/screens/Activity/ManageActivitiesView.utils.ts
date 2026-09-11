import { Activity } from "../../../domain/entities/Activity";

export interface GrupoActividades {
  titulo: string;
  items: Activity[];
}

/**
 * Agrupa las actividades por título (el "curso"), preservando el orden de
 * aparición. Dentro de cada grupo ordena por fecha_unica ascendente para que
 * las sesiones repetidas se lean en orden cronológico.
 */
export function agruparPorCurso(activities: Activity[]): GrupoActividades[] {
  const mapa = new Map<string, Activity[]>();
  for (const a of activities) {
    const arr = mapa.get(a.title);
    if (arr) arr.push(a);
    else mapa.set(a.title, [a]);
  }
  return Array.from(mapa.entries()).map(([titulo, items]) => ({
    titulo,
    items: [...items].sort((x, y) =>
      (x.fechaUnica ?? "9999").localeCompare(y.fechaUnica ?? "9999")
    ),
  }));
}

/** Formatea "YYYY-MM-DD" a algo como "27 ago". */
export function formatearFechaUnica(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  if (!y || !m || !d) return fecha;
  return new Date(y, m - 1, d).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
  });
}