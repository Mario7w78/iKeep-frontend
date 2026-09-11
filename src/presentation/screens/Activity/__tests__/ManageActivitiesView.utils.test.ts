import { formatearFechaUnica } from "../ManageActivitiesView.utils";

describe('formatearFechaUnica', () => {
  it('formatea YYYY-MM-DD a día y mes corto', () => {
    expect(formatearFechaUnica('2026-08-27')).toMatch(/27/);
    expect(formatearFechaUnica('2026-08-27')).toMatch(/ago/i);
  });

  it('devuelve el valor original si no es fecha valida', () => {
    expect(formatearFechaUnica('no-es-fecha')).toBe('no-es-fecha');
  });
});