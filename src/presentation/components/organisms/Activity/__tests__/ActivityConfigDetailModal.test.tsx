/**
 * El detalle de una actividad en "GRUPOS Y HORARIOS".
 *
 * Una serie de Google condensada puede juntar dos días de la MISMA clase con
 * horas DISTINTAS: una actividad `groupId` único pero martes a las 20:00 y
 * sábado a las 10:00. El modal no puede colapsar eso a la primera partición;
 * cada bloque de horario distinto va en su propia tarjeta con sus días.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
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