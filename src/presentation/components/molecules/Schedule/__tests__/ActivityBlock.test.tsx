/**
 * La posicion vertical de un bloque en el horario.
 *
 * Un traslado que empieza antes de la hora de inicio del dia —salir 07:30
 * para llegar 08:00— se daba por madrugada del dia siguiente y se corria 1440
 * minutos hacia abajo, arrastrando la lectura de todo el calendario.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import { ActivityBlock } from '../ActivityBlock';

const ALTO_HORA = 56;

function topDe(vista: any, testID = 'activity-block') {
  const estilos = vista.getByTestId(testID).props.style;
  const plano = Array.isArray(estilos) ? Object.assign({}, ...estilos.filter(Boolean)) : estilos;
  return plano.top;
}

function estilosDe(vista: any, testID = 'activity-block') {
  const estilos = vista.getByTestId(testID).props.style;
  return Array.isArray(estilos) ? Object.assign({}, ...estilos.filter(Boolean)) : estilos;
}

function bloque(over: any = {}) {
  return {
    activity: { id: '1', title: 'Cálculo' },
    assignedStartTime: '09:00',
    assignedEndTime: '11:00',
    day: 'Lunes',
    tipo: 'clase',
    ...over,
  };
}

describe('dia que NO cruza medianoche', () => {
  it('coloca la actividad segun su hora', async () => {
    const vista = await render(
      <ActivityBlock item={bloque() as any} displayStart={8} hourHeight={ALTO_HORA} />
    );

    // 09:00 con el dia arrancando a las 08:00 → una hora abajo.
    expect(topDe(vista)).toBe(ALTO_HORA);
  });

  it('un traslado anterior al inicio del dia NO se va un dia abajo', async () => {
    const vista = await render(
      <ActivityBlock
        item={bloque({ tipo: 'viaje', activity: undefined, nombre: 'Traslado', assignedStartTime: '07:30', assignedEndTime: '08:00' }) as any}
        displayStart={8}
        hourHeight={ALTO_HORA}
      />
    );

    // Antes daba ((07:30 + 1440) - 08:00) / 60 * 56 = 1316 px.
    expect(topDe(vista, 'activity-block')).toBeLessThan(ALTO_HORA);
  });

  it('y se queda dentro de la grilla en vez de dibujarse fuera', async () => {
    const vista = await render(
      <ActivityBlock
        item={bloque({ tipo: 'viaje', activity: undefined, assignedStartTime: '06:00', assignedEndTime: '08:00' }) as any}
        displayStart={8}
        hourHeight={ALTO_HORA}
      />
    );

    expect(topDe(vista, 'activity-block')).toBeGreaterThanOrEqual(0);
  });
});

describe('dia que SI cruza medianoche', () => {
  it('lo de la madrugada va despues de lo de la noche', async () => {
    // Ventana 22:00 → 04:00: un bloque a la 01:00 es del dia siguiente.
    const vista = await render(
      <ActivityBlock
        item={bloque({ assignedStartTime: '01:00', assignedEndTime: '02:00' }) as any}
        displayStart={22}
        cruzaMedianoche
        hourHeight={ALTO_HORA}
      />
    );

    // (01:00 + 1440 - 22:00) / 60 * 56 = 3 horas → 168 px.
    expect(topDe(vista)).toBe(3 * ALTO_HORA);
  });
});

describe('agenda (ocurrencias del calendario) = bloque normal', () => {
  function agenda(nombre: string, activityId: string) {
    return {
      activity: { id: activityId, title: nombre } as any,
      assignedStartTime: '09:00',
      assignedEndTime: '11:00',
      day: 'Martes',
      tipo: 'agenda',
      nombre,
    };
  }

  function colorDe(vista: any) {
    const estilos = vista.getByTestId('activity-block').props.style;
    const plano = Array.isArray(estilos) ? Object.assign({}, ...estilos.filter(Boolean)) : estilos;
    return plano.backgroundColor;
  }

  it('INTERACTUA igual que un bloque del plan (onPress abre el detalle)', async () => {
    const onPress = jest.fn();
    const vista = await render(
      <ActivityBlock item={agenda('Parcial', 'a1') as any} displayStart={8} hourHeight={ALTO_HORA} onPress={onPress} />
    );

    fireEvent.press(vista.getByTestId('activity-block'));

    expect(onPress).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'agenda', nombre: 'Parcial' }));
  });

  it('tiene COLOR variado: distintas actividades, distinto color', async () => {
    const a = await render(<ActivityBlock item={agenda('Parcial', 'a1') as any} displayStart={8} hourHeight={ALTO_HORA} />);
    const b = await render(<ActivityBlock item={agenda('Laboratorio', 'a2') as any} displayStart={8} hourHeight={ALTO_HORA} />);

    expect(colorDe(a)).not.toBe(colorDe(b));
  });

  it('el color es ESTABLE por actividad (misma actividad, mismo color)', async () => {
    const a = await render(<ActivityBlock item={agenda('Parcial', 'a1') as any} displayStart={8} hourHeight={ALTO_HORA} />);
    const b = await render(<ActivityBlock item={agenda('Parcial', 'a1') as any} displayStart={8} hourHeight={ALTO_HORA} />);

    expect(colorDe(a)).toBe(colorDe(b));
  });
});

describe('actividades cortas y traslados', () => {
  it('menos de 15 minutos = píldora con su duración, no un bloque de horas', async () => {
    const vista = await render(
      <ActivityBlock
        item={bloque({ assignedStartTime: '09:00', assignedEndTime: '09:05' }) as any}
        displayStart={8}
        hourHeight={ALTO_HORA}
      />
    );

    const plano = estilosDe(vista);
    expect(plano.height).toBe(24);
    expect(plano.borderRadius).toBe(12);
    expect(vista.getByText('5 m')).toBeTruthy();
  });

  it('una actividad de una hora NO se comprime', async () => {
    const vista = await render(
      <ActivityBlock item={bloque() as any} displayStart={8} hourHeight={ALTO_HORA} />
    );

    expect(estilosDe(vista).height).toBe(2 * ALTO_HORA - 4);
  });

  it('el traslado es gris apagado con borde punteado, sin acento de actividad', async () => {
    const vista = await render(
      <ActivityBlock
        item={bloque({ tipo: 'viaje', activity: undefined, nombre: 'Traslado', assignedStartTime: '07:30', assignedEndTime: '08:00' }) as any}
        displayStart={8}
        hourHeight={ALTO_HORA}
      />
    );

    const plano = estilosDe(vista);
    expect(plano.backgroundColor).toBe('#26282F');
    expect(plano.borderStyle).toBe('dashed');
    expect(plano.borderLeftWidth).toBe(1);
  });
});
