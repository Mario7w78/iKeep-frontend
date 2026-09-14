/**
 * "Empezar sesión" solo tiene sentido si el bloque es del día de hoy.
 *
 * Una actividad de mañana se puede ver y editar, pero no se puede "empezar"
 * ahora: no ha llegado. La sesión enfocada acompaña lo que YA está pasando.
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

import { Activity, ActivityType, DayOfWeek } from '../../../../../domain/entities/Activity';
import { ScheduledActivity } from '../../../../../domain/entities/Schedule';
import { ActivityDetailModal } from '../ActivityDetailModal';

const DIAS: DayOfWeek[] = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const diaDeHoy = DIAS[(new Date().getDay() + 6) % 7];
const otroDia = DIAS[(DIAS.indexOf(diaDeHoy) + 1) % 7];

const actividad = (descripcion?: string) =>
  new Activity({
    id: 'a1',
    title: 'Programar',
    type: ActivityType.FLEXIBLE,
    area: 'estudio',
    identity: 'tarea',
    priority: 3,
    difficulty: 'media',
    deadline: null,
    daysConfig: {},
    daysEnabled: [diaDeHoy],
    description: descripcion ?? null,
  });

const bloque = (day: DayOfWeek): ScheduledActivity => ({
  activity: actividad(),
  assignedStartTime: '20:00',
  assignedEndTime: '22:00',
  day,
});

describe('ActivityDetailModal · Empezar sesión', () => {
  it('se ofrece solo para el bloque de hoy', async () => {
    const onEnfocar = jest.fn();
    const vista = await render(
      <ActivityDetailModal
        visible
        activityItem={bloque(diaDeHoy)}
        onClose={() => {}}
        onEnfocar={onEnfocar}
      />
    );

    const boton = vista.getByTestId('empezar-sesion');
    expect(boton).toBeTruthy();

    await fireEvent.press(boton);
    expect(onEnfocar).toHaveBeenCalledWith('a1', 120);
  });

  it('no se ofrece para un bloque que no es de hoy', async () => {
    const vista = await render(
      <ActivityDetailModal
        visible
        activityItem={bloque(otroDia)}
        onClose={() => {}}
        onEnfocar={jest.fn()}
      />
    );

    expect(vista.queryByTestId('empezar-sesion')).toBeNull();
  });
});

describe('ActivityDetailModal · Descripción', () => {
  it('muestra la descripción cuando la actividad tiene una', async () => {
    const vista = await render(
      <ActivityDetailModal
        visible
        activityItem={{ ...bloque(diaDeHoy), activity: actividad('Estudiar TS y grabar la demo.') }}
        onClose={() => {}}
      />
    );

    expect(vista.getByText('DESCRIPCIÓN')).toBeTruthy();
    expect(vista.getByText('Estudiar TS y grabar la demo.')).toBeTruthy();
  });

  it('sin descripción no dibuja la sección', async () => {
    const vista = await render(
      <ActivityDetailModal
        visible
        activityItem={bloque(diaDeHoy)}
        onClose={() => {}}
      />
    );

    expect(vista.queryByText('DESCRIPCIÓN')).toBeNull();
  });
});