import { construirSugerenciasSapo, esManana, formatearTiempoLibre } from '../sugerenciasSapo';

describe('formatearTiempoLibre', () => {
  it('formatea minutos sueltos en neutro', () => {
    expect(formatearTiempoLibre(45)).toBe('Tengo 45 minutos libres');
    expect(formatearTiempoLibre(0)).toBe('Tengo 0 minutos libres');
  });

  it('formatea horas exactas', () => {
    expect(formatearTiempoLibre(120)).toBe('Tengo 2 horas libres');
    expect(formatearTiempoLibre(60)).toBe('Tengo 1 hora libres');
  });

  it('formatea hora y media', () => {
    expect(formatearTiempoLibre(90)).toBe('Tengo 1 hora y media libres');
    expect(formatearTiempoLibre(150)).toBe('Tengo 2 horas y media libres');
  });
});

describe('construirSugerenciasSapo', () => {
  it('sin actividades invita a crear la primera', () => {
    const sugerencias = construirSugerenciasSapo({
      cantidadActividades: 0,
      hayHorario: false,
      freeTimeMinutes: null,
      mananaTieneActividades: false,
    });

    expect(sugerencias).toHaveLength(3);
    expect(sugerencias[0]).toBe('Quiero crear mi primera actividad');
  });

  it('siempre devuelve tres chips', () => {
    const sugerencias = construirSugerenciasSapo({
      cantidadActividades: 3,
      hayHorario: true,
      freeTimeMinutes: 90,
      mananaTieneActividades: true,
    });

    expect(sugerencias).toHaveLength(3);
  });

  it('prioriza el tiempo libre real del usuario', () => {
    const sugerencias = construirSugerenciasSapo({
      cantidadActividades: 3,
      hayHorario: true,
      freeTimeMinutes: 90,
      mananaTieneActividades: false,
    });

    expect(sugerencias[0]).toBe('Tengo 1 hora y media libres');
  });

  it('no ofrece el atajo de mañana si no hay agenda mañana', () => {
    const sugerencias = construirSugerenciasSapo({
      cantidadActividades: 3,
      hayHorario: true,
      freeTimeMinutes: null,
      mananaTieneActividades: false,
    });

    expect(sugerencias).not.toContain('¿Qué tengo mañana?');
  });

  it('no duplica chips cuando el relleno ya está', () => {
    const sugerencias = construirSugerenciasSapo({
      cantidadActividades: 3,
      hayHorario: false,
      freeTimeMinutes: null,
      mananaTieneActividades: true,
    });

    expect(new Set(sugerencias).size).toBe(sugerencias.length);
  });
});

describe('esManana', () => {
  const lunes = new Date('2026-09-07T10:00:00');

  it('reconoce el día siguiente', () => {
    expect(esManana('Martes', lunes)).toBe(true);
  });

  it('devuelve false para otro día o nulo', () => {
    expect(esManana('Sabado', lunes)).toBe(false);
    expect(esManana(null, lunes)).toBe(false);
  });

  it('salta correctamente de domingo a lunes', () => {
    const domingo = new Date('2026-09-13T10:00:00');
    expect(esManana('Lunes', domingo)).toBe(true);
  });
});