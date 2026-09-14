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

    // Las del glosario, que ahora son las de toda la app.
    expect(vista.getByText('Lun')).toBeTruthy();
    expect(vista.getByText('Dom')).toBeTruthy();
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

  it('una actividad corta se comprime a píldora con su duración', async () => {
    const vista = await render(
      <WeekGrid
        schedule={horarioCon({
          Martes: [{ ...BLOQUE, assignedStartTime: '10:00', assignedEndTime: '10:05' }],
        })}
        startHour={0}
        endHour={1440}
      />
    );

    expect(vista.getByText('5 m')).toBeTruthy();
    const plano = Object.assign(
      {},
      ...vista.getAllByTestId('week-grid-block').map((b) => b.props.style).flat().filter(Boolean)
    );
    expect(plano.height).toBe(20);
  });

  it('el traslado se dibuja gris punteado, distinto de una actividad', async () => {
    const vista = await render(
      <WeekGrid
        schedule={horarioCon({
          Lunes: [{ ...BLOQUE, tipo: 'viaje', activity: undefined, nombre: 'Viaje' }],
          Martes: [BLOQUE],
        })}
        startHour={0}
        endHour={1440}
      />
    );

    const traslado = vista.getAllByTestId('week-grid-block')[0].props.style;
    const plano = Array.isArray(traslado) ? Object.assign({}, ...traslado.filter(Boolean)) : traslado;
    expect(plano.backgroundColor).toBe('#26282F');
    expect(plano.borderStyle).toBe('dashed');
    expect(plano.borderLeftWidth).toBe(1);
  });

  it('la variante para la foto dibuja la semana entera sin scroll', async () => {
    const vista = await render(
      <WeekGrid
        paraCaptura
        schedule={horarioCon({
          Lunes: [{ ...BLOQUE, assignedStartTime: '10:00', assignedEndTime: '10:05' }],
        })}
        startHour={480}
        endHour={720}
      />
    );

    // Cabecera con los dias + los bloques, en un solo arbol plano (sin ScrollView).
    expect(vista.getByTestId('week-grid-foto')).toBeTruthy();
    expect(vista.getByText('Lun')).toBeTruthy();
    expect(vista.getByText('Dom')).toBeTruthy();
    expect(vista.getAllByTestId('week-grid-block')).toHaveLength(1);
    // La ventana completa se dibuja de una: hasta la ultima hora del rango.
    expect(vista.getByText('11')).toBeTruthy();
    // Sin ScrollView: la altura la pone el contenido, no el viewport.
    const tieneScroll = (function buscar(n: any): boolean {
      if (!n || typeof n !== 'object') return false;
      if (String(n.type ?? '').endsWith('ScrollView')) return true;
      return (n.children ?? []).some(buscar);
    })(vista.toJSON());
    expect(tieneScroll).toBe(false);
  });

  it('dibuja los bloques que no estan en el plan (agenda / google importado)', async () => {
    // El grid de la semana pide el MISMO contenido que la pagina del dia:
    // plan semanal + lo que el mes muestra y el plan no (parciales con fecha
    // unica, actividades movidas, eventos de Google materializados). La
    // dedup contra el plan la hace quien arma `itemsExtraPorDia`.
    const vista = await render(
      <WeekGrid
        schedule={horarioCon({
          Lunes: [{ ...BLOQUE, activity: { id: 'a1', title: 'Cálculo' } }],
        })}
        startHour={0}
        endHour={1440}
        itemsExtraPorDia={{
          Lunes: [
            { ...BLOQUE, activity: { id: 'g-1', title: 'Dentista' }, assignedStartTime: '14:00', assignedEndTime: '15:00', tipo: 'agenda' },
          ],
        }}
      />
    );

    expect(vista.getAllByTestId('week-grid-block')).toHaveLength(2);
    expect(vista.getByText('Cálculo')).toBeTruthy();
    expect(vista.getByText('Dentista')).toBeTruthy();
  });
});
