/**
 * Con qué actividad queda cada bloque del horario.
 *
 * El solver devuelve ids compuestos (`{actividad}-{grupo}-{día}-{turno}`) y el
 * id de la actividad puede tener guiones —los importados de Google son
 * `google-<hash>`—. Cortar en el primer guion dejaba esos bloques sin
 * `Activity`: en el Home abrían el detalle de bloque en vez del de la actividad.
 */

import { Activity, ActivityType } from '../../../../domain/entities/Activity';
import { scheduleResponseToDomain } from '../scheduleMapper';
import { ScheduleResponseDto } from '../../dto/ScheduleResponseDto';

function actividad(id: string): Activity {
  return new Activity({
    id,
    title: id,
    type: ActivityType.FIXED,
    identity: 'clase',
    priority: 3,
    difficulty: 'media',
    daysEnabled: ['Viernes'],
    daysConfig: {},
  } as any);
}

function bloque(id_actividad: string, tipo: string = 'clase') {
  return {
    id_actividad,
    nombre: id_actividad,
    tipo,
    dia: 4, // Viernes
    hora_inicio: 960,
    hora_fin: 1080,
    ubicacion_id: null,
  };
}

function respuesta(bloques: ReturnType<typeof bloque>[]): ScheduleResponseDto {
  return { estado: 'FACTIBLE', bloques, mensaje: '' } as ScheduleResponseDto;
}

function actividadDe(bloques: ReturnType<typeof bloque>[], activities: Activity[]) {
  return scheduleResponseToDomain(respuesta(bloques), activities).getAllItems()[0].activity;
}

describe('scheduleResponseToDomain · referencia de actividad', () => {
  it('engancha un id de Google, que trae guiones', () => {
    const google = 'google-9f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c5b4a';

    const actividadDeGoogle = actividadDe(
      [bloque(`${google}-0-Viernes-0`)],
      [actividad(google)]
    );

    expect(actividadDeGoogle?.id).toBe(google);
  });

  it('sigue enganchando los ids numéricos de siempre', () => {
    const numerica = '1726600000000';

    const enganchada = actividadDe([bloque(`${numerica}-0-Viernes-0`)], [actividad(numerica)]);

    expect(enganchada?.id).toBe(numerica);
  });

  it('elige el id conocido más largo y no un prefijo suyo', () => {
    // `google-a` es prefijo de `google-a-0`: el bloque del grupo 0 pertenece al
    // segundo, no al primero.
    const corta = 'google-aaaa';
    const larga = 'google-aaaa-0';

    const enganchada = actividadDe(
      [bloque(`${larga}-Viernes-0`)],
      [actividad(corta), actividad(larga)]
    );

    expect(enganchada?.id).toBe(larga);
  });

  it('deja los traslados sin actividad', () => {
    const google = 'google-9f8e7d6c5b4a39281706f5e4d3c2b1a09f8e7d6c5b4a';

    const enganchada = actividadDe(
      [bloque(`${google}_viaje_to`, 'viaje')],
      [actividad(google)]
    );

    expect(enganchada).toBeUndefined();
  });

  it('deja los bloques desconocidos sin actividad', () => {
    const enganchada = actividadDe([bloque('bloque-sin-definicion-0-0')], []);

    expect(enganchada).toBeUndefined();
  });
});
