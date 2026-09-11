import { Activity } from "../../../../domain/entities/Activity";
import { agruparPorCurso, formatearFechaUnica } from "../ManageActivitiesView.utils";

function actividad(id: string, title: string, fechaUnica?: string | null): Activity {
  return new Activity({
    id,
    title,
    type: 'fija' as any,
    identity: 'clase' as any,
    priority: 1,
    difficulty: 'media' as any,
    deadline: null,
    daysEnabled: [] as any,
    daysConfig: {},
    optionalDay: false,
    isAnchor: false,
    fechaUnica: fechaUnica ?? null,
  });
}

describe('agruparPorCurso', () => {
  it('agrupa por título y ordena por fecha_unica ascendente', () => {
    const grupos = agruparPorCurso([
      actividad('b', 'SEGURIDAD', '2026-09-05'),
      actividad('a', 'PLAN.ESTRÁT.', '2026-08-27'),
      actividad('c', 'SEGURIDAD', '2026-08-29'),
      actividad('d', 'SEGURIDAD', '2026-09-12'),
    ]);

    expect(grupos.map((g) => g.titulo)).toEqual(['SEGURIDAD', 'PLAN.ESTRÁT.']);
    expect(grupos[0].items.map((i) => i.id)).toEqual(['c', 'b', 'd']);
  });

  it('preserva el orden de aparición de los títulos', () => {
    const grupos = agruparPorCurso([
      actividad('1', 'Zeta'),
      actividad('2', 'Alfa'),
      actividad('3', 'Zeta'),
    ]);

    expect(grupos.map((g) => g.titulo)).toEqual(['Zeta', 'Alfa']);
  });

  it('devuelve lista vacía si no hay actividades', () => {
    expect(agruparPorCurso([])).toEqual([]);
  });

  it('deja las actividades sin fecha_unica al final del grupo', () => {
    const grupos = agruparPorCurso([
      actividad('1', 'Curso'),
      actividad('2', 'Curso', null),
      actividad('3', 'Curso', '2026-09-01'),
    ]);

    expect(grupos[0].items.map((i) => i.id)).toEqual(['3', '1', '2']);
  });
});

describe('formatearFechaUnica', () => {
  it('formatea YYYY-MM-DD a día y mes corto', () => {
    expect(formatearFechaUnica('2026-08-27')).toMatch(/27/);
    expect(formatearFechaUnica('2026-08-27')).toMatch(/ago/i);
  });

  it('devuelve el valor original si no es fecha valida', () => {
    expect(formatearFechaUnica('no-es-fecha')).toBe('no-es-fecha');
  });
});