import { Schedule, validarIntegridadHorario, ScheduledActivity } from '../Schedule';
import { Activity, ActivityType } from '../Activity';

function horarioCon(items: ScheduledActivity[]): Schedule {
  return new Schedule({
    id: 's1',
    userId: 'u1',
    createdAt: new Date('2026-09-14T00:00:00Z'),
    scheduledActivities: items,
  });
}

function fija(title: string, horaInicio: number, horaFin: number): Activity {
  return new Activity({
    id: `f-${title}`,
    title,
    type: ActivityType.FIXED,
    identity: 'clase',
    priority: 5,
    difficulty: 'media',
    deadline: null,
    daysEnabled: ['Lunes'],
    daysConfig: {
      Lunes: {
        groupId: 1,
        partitions: [
          {
            startHour: new Date(2026, 8, 14, Math.floor(horaInicio / 60), horaInicio % 60),
            endHour: new Date(2026, 8, 14, Math.floor(horaFin / 60), horaFin % 60),
            durationTime: horaFin - horaInicio,
            travelTo: null,
            travelFrom: null,
          },
        ],
      },
    },
    optionalDay: false,
    dayFrom: undefined,
    dayTo: undefined,
    isAnchor: false,
  });
}

/** Una fija con dos turnos el mismo día: mañana y tarde. */
function fijaDosTurnos(title: string): Activity {
  const turno = (horaInicio: number, horaFin: number) => ({
    startHour: new Date(2026, 8, 14, horaInicio, 0),
    endHour: new Date(2026, 8, 14, horaFin, 0),
    durationTime: (horaFin - horaInicio) * 60,
    travelTo: null,
    travelFrom: null,
  });
  return new Activity({
    id: `f2-${title}`,
    title,
    type: ActivityType.FIXED,
    identity: 'clase',
    priority: 5,
    difficulty: 'media',
    deadline: null,
    daysEnabled: ['Lunes'],
    daysConfig: {
      Lunes: {
        groupId: 1,
        partitions: [turno(8, 10), turno(14, 16)],
      },
    },
    optionalDay: false,
    dayFrom: undefined,
    dayTo: undefined,
    isAnchor: false,
  });
}

describe('Schedule (normalización de horas)', () => {
  it('sanea un fin que cruza la medianoche (>23:59)', () => {
    const s = horarioCon([
      { day: 'Lunes', assignedStartTime: '23:30', assignedEndTime: '25:00', nombre: 'Viaje nocturno' },
    ]);
    expect(s.getAllItems()[0].assignedStartTime).toBe('23:30');
    expect(s.getAllItems()[0].assignedEndTime).toBe('01:00');
  });

  it('sanea extremos de varios días', () => {
    const s = horarioCon([
      { day: 'Lunes', assignedStartTime: '22:00', assignedEndTime: '48:00', nombre: 'Traslado largo' },
    ]);
    expect(s.getAllItems()[0].assignedEndTime).toBe('00:00');
  });

  it('deja intacta una hora con formato inválido para que la validación la vea', () => {
    const s = horarioCon([
      { day: 'Lunes', assignedStartTime: 'banana', assignedEndTime: '08:00', nombre: 'Malo' },
    ]);
    expect(s.getAllItems()[0].assignedStartTime).toBe('banana');
    const resultado = validarIntegridadHorario(s);
    expect(resultado.valido).toBe(false);
  });
});

describe('validarIntegridadHorario', () => {
  it('retorna valido=true para un horario normal', () => {
    const items: ScheduledActivity[] = [
      { day: 'Lunes', assignedStartTime: '07:00', assignedEndTime: '08:00', nombre: 'Desayuno' },
      { day: 'Lunes', assignedStartTime: '18:00', assignedEndTime: '19:30', nombre: 'Gym' },
    ];
    const resultado = validarIntegridadHorario(horarioCon(items));
    expect(resultado.valido).toBe(true);
    expect(resultado.advertencias).toEqual([]);
  });

  it('marca hora con formato inválido', () => {
    const resultado = validarIntegridadHorario(
      horarioCon([
        { day: 'Lunes', assignedStartTime: '25:00', assignedEndTime: 'abc', nombre: 'Viaje nocturno' },
      ])
    );
    expect(resultado.valido).toBe(false);
  });

  it('detecta actividad fija fuera de su rango configurado', () => {
    const items: ScheduledActivity[] = [
      { day: 'Lunes', assignedStartTime: '15:00', assignedEndTime: '16:00', nombre: 'Clase fija', activity: fija('Clase fija', 600, 660) },
    ];
    const resultado = validarIntegridadHorario(horarioCon(items));
    expect(resultado.valido).toBe(false);
    expect(resultado.advertencias[0]).toContain('fuera del rango fijo');
  });

  it('no molesta a una actividad fija dentro de su rango', () => {
    const items: ScheduledActivity[] = [
      { day: 'Lunes', assignedStartTime: '10:00', assignedEndTime: '11:00', nombre: 'Clase fija ok', activity: fija('Clase fija ok', 600, 660) },
    ];
    const resultado = validarIntegridadHorario(horarioCon(items));
    expect(resultado.valido).toBe(true);
  });

  it('tolera el margen de viaje previo a una actividad fija', () => {
    const actividad = fija('Clase con viaje', 600, 660);
    const items: ScheduledActivity[] = [
      {
        day: 'Lunes',
        assignedStartTime: '09:30',
        assignedEndTime: '11:00',
        nombre: 'Clase con viaje',
        activity: actividad,
      },
    ];
    const resultado = validarIntegridadHorario(horarioCon(items));
    expect(resultado.valido).toBe(true);
  });

  it('acepta el segundo turno de una fija con dos bloques el mismo día', () => {
    // Clase de mañana y de tarde: el bloque de la tarde caía fuera del rango
    // del primero y se marcaba como inconsistencia sin serlo.
    const items: ScheduledActivity[] = [
      { day: 'Lunes', assignedStartTime: '14:00', assignedEndTime: '16:00', nombre: 'Doble turno', activity: fijaDosTurnos('Doble turno') },
    ];

    expect(validarIntegridadHorario(horarioCon(items)).valido).toBe(true);
  });

  it('sigue marcando un bloque que no cae en ninguno de los turnos', () => {
    const items: ScheduledActivity[] = [
      { day: 'Lunes', assignedStartTime: '12:00', assignedEndTime: '13:00', nombre: 'Doble turno', activity: fijaDosTurnos('Doble turno') },
    ];

    const resultado = validarIntegridadHorario(horarioCon(items));

    expect(resultado.valido).toBe(false);
    expect(resultado.advertencias[0]).toContain('fuera del rango fijo');
    expect(resultado.advertencias[0]).toContain('08:00–10:00');
    expect(resultado.advertencias[0]).toContain('14:00–16:00');
  });

  it('marca duración sospechosa (>16h) en un bloque del mismo día', () => {
    const items: ScheduledActivity[] = [
      { day: 'Lunes', assignedStartTime: '00:00', assignedEndTime: '20:00', nombre: 'Maratón imposible' },
    ];
    const resultado = validarIntegridadHorario(horarioCon(items));
    expect(resultado.valido).toBe(false);
    expect(resultado.advertencias[0]).toContain('duración sospechosa');
  });

  it('no marca un cruce de medianoche legítimo (start > end)', () => {
    const items: ScheduledActivity[] = [
      { day: 'Lunes', assignedStartTime: '23:30', assignedEndTime: '01:00', nombre: 'Traslado madrugada' },
    ];
    const resultado = validarIntegridadHorario(horarioCon(items));
    expect(resultado.valido).toBe(true);
  });
});