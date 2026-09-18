/**
 * El detalle de una actividad en "GRUPOS Y HORARIOS".
 *
 * Una serie de Google condensada puede juntar dos días de la MISMA clase con
 * horas DISTINTAS: una actividad `groupId` único pero martes a las 20:00 y
 * sábado a las 10:00. El modal no puede colapsar eso a la primera partición;
 * cada bloque de horario distinto va en su propia tarjeta con sus días.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import { Activity, ActivityType, DayOfWeek } from '../../../../../domain/entities/Activity';
import { ActivityConfigDetailModal } from '../ActivityConfigDetailModal';

const hora = (h: number) => new Date(2026, 0, 1, h, 0);

function actividadCon(daysConfig: any): Activity {
  return new Activity({
    id: 'act-1',
    title: 'Progra Móvil',
    type: ActivityType.FIXED,
    area: 'estudio',
    identity: 'clase',
    priority: 5,
    difficulty: 'media',
    deadline: null,
    daysConfig,
    daysEnabled: Object.keys(daysConfig) as DayOfWeek[],
  });
}

const particion = (inicio: number, fin: number) => ({
  startHour: hora(inicio),
  endHour: hora(fin),
  durationTime: (fin - inicio) * 60,
  travelTo: null,
  travelFrom: null,
});

describe('ActivityConfigDetailModal · GRUPOS Y HORARIOS', () => {
  const renderModal = async (activity: Activity) =>
    render(
      <ActivityConfigDetailModal
        visible
        activity={activity}
        onClose={() => {}}
      />
    );

  it('misma clase con horas distintas separa los días', async () => {
    const vista = await renderModal(
      actividadCon({
        Martes: { partitions: [particion(20, 22)], groupId: 0 },
        Sabado: { partitions: [particion(10, 13)], groupId: 0 },
      })
    );

    expect(vista.getByText('Mar')).toBeTruthy();
    expect(vista.getByText('Sab')).toBeTruthy();
    // Cada horario distinto tiene su propia fila: nada se colapsa a la primera.
    expect(vista.getAllByText(/2h 0min/)).toHaveLength(1);
    expect(vista.getAllByText(/3h 0min/)).toHaveLength(1);
  });

  it('misma clase a la misma hora comparte una sola tarjeta', async () => {
    const vista = await renderModal(
      actividadCon({
        Martes: { partitions: [particion(20, 22)], groupId: 0 },
        Jueves: { partitions: [particion(20, 22)], groupId: 0 },
      })
    );

    expect(vista.getByText('Mar')).toBeTruthy();
    expect(vista.getByText('Jue')).toBeTruthy();
    expect(vista.getAllByText(/2h 0min/)).toHaveLength(1);
  });

  it('grupos distintos conservan cada su tarjeta', async () => {
    const vista = await renderModal(
      actividadCon({
        Martes: { partitions: [particion(20, 22)], groupId: 0 },
        Sabado: { partitions: [particion(10, 13)], groupId: 1 },
      })
    );

    expect(vista.getAllByText(/2h 0min/)).toHaveLength(1);
    expect(vista.getAllByText(/3h 0min/)).toHaveLength(1);
  });
});

/**
 * El botón de sesión solo tiene sentido cuando el detalle representa el bloque
 * del día de hoy; el modal se reusa desde la lista de actividades, donde no hay
 * sesión que sostener.
 */
describe('ActivityConfigDetailModal · Empezar sesión', () => {
  const actividad = actividadCon({
    Martes: { partitions: [particion(20, 22)], groupId: 0 },
  });

  it('ofrece empezar sesión y arranca con la duración del bloque', async () => {
    const onEnfocar = jest.fn();
    const vista = await render(
      <ActivityConfigDetailModal
        visible
        activity={actividad}
        onClose={() => {}}
        onEnfocar={onEnfocar}
        esHoy
        minutosDelBloque={120}
      />
    );

    fireEvent.press(vista.getByTestId('empezar-sesion'));

    expect(onEnfocar).toHaveBeenCalledWith('act-1', 120);
  });

  it('no ofrece sesión cuando el bloque no es de hoy', async () => {
    const vista = await render(
      <ActivityConfigDetailModal
        visible
        activity={actividad}
        onClose={() => {}}
        onEnfocar={jest.fn()}
        esHoy={false}
      />
    );

    expect(vista.queryByTestId('empezar-sesion')).toBeNull();
  });

  it('no ofrece sesión desde la lista de actividades (sin onEnfocar)', async () => {
    const vista = await render(
      <ActivityConfigDetailModal visible activity={actividad} onClose={() => {}} esHoy />
    );

    expect(vista.queryByTestId('empezar-sesion')).toBeNull();
  });
});