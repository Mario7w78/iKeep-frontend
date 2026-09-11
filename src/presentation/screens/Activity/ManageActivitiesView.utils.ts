/** Formatea "YYYY-MM-DD" a algo como "27 ago". */
export function formatearFechaUnica(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  if (!y || !m || !d) return fecha;
  return new Date(y, m - 1, d).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
  });
}