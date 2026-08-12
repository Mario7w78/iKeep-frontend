/**
 * La semana entera, para mirarla de una y para la foto.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import { WeekGrid } from '../WeekGrid';

function horarioCon(items: Record<string, any[]>) {
  return {
    getItemsByDay: (dia: string) => items[dia] ?? [],
  } as any;
}

const BLOQUE = {
  activity: { id: '1', title: 'Cálculo' },
  assignedStartTime: '10:00',
  assignedEndTime: '12:00',
  day: 'Martes',
  tipo: 'clase',
};

describe('WeekGrid', () => {
  it('dibuja los siete dias', async () => {
    const vista = await render(
      <WeekGrid schedule={horarioCon({})} startHour={0} endHour={1440} />
    );

    // Las mismas abreviaturas que el resto de la pantalla del horario:
    // rotar el telefono no deberia cambiar el vocabulario.
    expect(vista.getByText('Lu')).toBeTruthy();
    expect(vista.getByText('Do')).toBeTruthy();
  });

  it('coloca los bloques de cada dia', async () => {
    const vista = await render(
      <WeekGrid schedule={horarioCon({ Martes: [BLOQUE] })} startHour={0} endHour={1440} />
    );

    expect(vista.getAllByTestId('week-grid-block')).toHaveLength(1);
    expect(vista.getByText('Cálculo')).toBeTruthy();
  });

  it('sin horario no rompe', async () => {
    const vista = await render(
      <WeekGrid schedule={null} startHour={0} endHour={1440} />
    );

    expect(vista.getByTestId('week-grid')).toBeTruthy();
  });

  it('respeta la ventana de horas del usuario', async () => {
    // Con el dia de 08:00 a 12:00 no hay por que dibujar la madrugada.
    const vista = await render(
      <WeekGrid schedule={horarioCon({})} startHour={480} endHour={720} />
    );

    expect(vista.getByText('08')).toBeTruthy();
    expect(vista.queryByText('03')).toBeNull();
  });

  it('no muestra nada personal: va pensada para el screenshot', async () => {
    const vista = await render(
      <WeekGrid schedule={horarioCon({ Martes: [BLOQUE] })} startHour={0} endHour={1440} />
    );

    // Ni nombre de usuario, ni racha, ni progreso: lo que no esta en pantalla
    // no se puede filtrar por accidente al compartir la foto.
    expect(vista.queryByTestId('streak-badge')).toBeNull();
    expect(vista.queryByTestId('daily-progress')).toBeNull();
  });

  it('un bloque sin actividad usa su nombre suelto', async () => {
    // Los traslados no tienen actividad detras.
    const vista = await render(
      <WeekGrid
        schedule={horarioCon({
          Lunes: [{ ...BLOQUE, activity: undefined, nombre: 'Viaje' }],
        })}
        startHour={0}
        endHour={1440}
      />
    );

    expect(vista.getByText('Viaje')).toBeTruthy();
  });
});
