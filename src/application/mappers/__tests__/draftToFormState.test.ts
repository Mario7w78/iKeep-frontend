/**
 * El borrador del asistente se convierte al mismo estado de formulario que ya
 * producía el endpoint anterior, para que la tarjeta de confirmación y toda
 * la lógica de guardado sigan funcionando sin cambios.
 */

import { draftToFormState } from '../draftToFormState';
import { Borrador } from '../../../domain/entities/conversation.types';

const BORRADOR: Borrador = {
  name: 'Calculo',
  activity_type: 'clase',
  is_fixed: true,
  is_anchor: false,
  difficulty: 'alta',
  priority: 'media',
  schedule: [{ day: 'Martes', start_time: 600, end_time: 720 }],
  duracion_minutos: 120,
  travel_to: 0,
  travel_from: 0,
};

describe('draftToFormState', () => {
  it('lleva el nombre y la identidad', () => {
    const estado = draftToFormState(BORRADOR, 0);

    expect(estado.activityName).toBe('Calculo');
    expect(estado.identity).toBe('clase');
  });

  it('conserva si es fija', () => {
    expect(draftToFormState(BORRADOR, 0).isFixed).toBe(true);
  });

  it('un borrador vacio no explota', () => {
    const estado = draftToFormState({}, 0);

    expect(estado.activityName).toBeNull();
  });

  it('is_fixed en null se trata como flexible', () => {
    /** El formulario necesita un booleano; null no es una tercera opcion. */
    const estado = draftToFormState({ name: 'x', is_fixed: null }, 0);

    expect(estado.isFixed).toBe(false);
  });

  it('traduce los bloques horarios a la configuracion por dia', () => {
    const estado = draftToFormState(BORRADOR, 0);

    expect(Object.keys(estado.daysDict || {})).toContain('Martes');
  });

  it('sin horario no arma configuracion de dias', () => {
    const estado = draftToFormState({ name: 'Estudiar', is_fixed: false }, 0);

    expect(Object.keys(estado.daysDict || {})).toHaveLength(0);
  });

  it('lleva la duracion de una flexible', () => {
    const estado = draftToFormState(
      { name: 'Estudiar', is_fixed: false, duracion_minutos: 90 },
      0
    );

    expect(estado.duracionMinutos).toBe(90);
  });

  it('lleva la ventana preferida', () => {
    const estado = draftToFormState(
      {
        name: 'Estudiar',
        is_fixed: false,
        duracion_minutos: 90,
        hora_preferida_inicio: 840,
        hora_preferida_fin: 1200,
      },
      0
    );

    expect(estado.horaPreferidaInicio).toBe(840);
    expect(estado.horaPreferidaFin).toBe(1200);
  });
});
