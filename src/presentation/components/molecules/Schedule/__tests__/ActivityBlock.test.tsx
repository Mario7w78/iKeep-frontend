/**
 * La posicion vertical de un bloque en el horario.
 *
 * Un traslado que empieza antes de la hora de inicio del dia —salir 07:30
 * para llegar 08:00— se daba por madrugada del dia siguiente y se corria 1440
 * minutos hacia abajo, arrastrando la lectura de todo el calendario.
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

import { ActivityBlock } from '../ActivityBlock';

const ALTO_HORA = 56;

function topDe(vista: any, testID = 'activity-block') {
  const estilos = vista.getByTestId(testID).props.style;
  const plano = Array.isArray(estilos) ? Object.assign({}, ...estilos.filter(Boolean)) : estilos;
  return plano.top;
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
