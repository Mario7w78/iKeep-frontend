/**
 * La cuadricula del mes.
 *
 * Antes el calendario mostraba una semana que se repetia: no habia forma de
 * ver el 12 de noviembre ni de saber que martes tenias libre.
 */

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(), getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(), clear: jest.fn(),
}));

import { MonthGrid } from '../MonthGrid';

const AGOSTO = new Date(2026, 7, 15);

function pintar(props: any = {}) {
  return render(
    <MonthGrid
      mesVisible={AGOSTO}
      porDia={{}}
      cargando={false}
      error={null}
      diaSeleccionado={null}
      onSeleccionarDia={jest.fn()}
      onCambiarMes={jest.fn()}
      onReintentar={jest.fn()}
      {...props}
    />
  );
}

const OCURRENCIA = {
  fecha: '2026-08-11',
  actividad: { id: '1', title: 'Cálculo' },
  movidaDesde: null,
  esUnica: false,
};

describe('la cuadricula', () => {
  it('muestra el mes y el ano', async () => {
    const vista = await pintar();

    expect(vista.getByText('agosto 2026')).toBeTruthy();
  });

  it('incluye los dias de relleno del mes anterior', async () => {
    // Agosto 2026 empieza sabado: la semana necesita del 27 de julio.
    const vista = await pintar();

    expect(vista.getByTestId('dia-2026-07-27')).toBeTruthy();
  });

  it('dibuja semanas completas', async () => {
    const vista = await pintar();

    // 6 semanas x 7 dias para agosto 2026.
    expect(vista.getByTestId('dia-2026-09-06')).toBeTruthy();
  });

  it('marca los dias con actividades', async () => {
    const vista = await pintar({ porDia: { '2026-08-11': [OCURRENCIA] } });

    const celda = vista.getByTestId('dia-2026-08-11');
    expect(celda).toBeTruthy();
    expect(celda.props.accessibilityLabel).toContain('1 actividades');
  });

  it('navegar de mes avisa', async () => {
    const cambiar = jest.fn();
    const vista = await pintar({ onCambiarMes: cambiar });

    await act(async () => { fireEvent.press(vista.getByTestId('mes-siguiente')); });

    expect(cambiar).toHaveBeenCalledWith(1);
  });
});

describe('el detalle del dia', () => {
  it('al elegir un dia lista lo que ocurre', async () => {
    const vista = await pintar({
      porDia: { '2026-08-11': [OCURRENCIA] },
      diaSeleccionado: '2026-08-11',
    });

    expect(vista.getByText('Cálculo')).toBeTruthy();
  });

  it('un dia sin nada lo dice sin sonar a error', async () => {
    const vista = await pintar({ diaSeleccionado: '2026-08-12' });

    expect(vista.getByText('Nada agendado. Día libre.')).toBeTruthy();
  });

  it('una reprogramada dice de donde viene', async () => {
    const vista = await pintar({
      porDia: { '2026-08-13': [{ ...OCURRENCIA, fecha: '2026-08-13', movidaDesde: '2026-08-11' }] },
      diaSeleccionado: '2026-08-13',
    });

    expect(vista.getByText(/Reprogramada del 11 de agosto/)).toBeTruthy();
  });

  it('un evento unico se distingue', async () => {
    const vista = await pintar({
      porDia: { '2026-08-12': [{ ...OCURRENCIA, fecha: '2026-08-12', esUnica: true }] },
      diaSeleccionado: '2026-08-12',
    });

    expect(vista.getByText('Solo este día')).toBeTruthy();
  });
});

describe('cuando falla', () => {
  it('lo dice y ofrece reintentar, no muestra un mes vacio', async () => {
    // Una cuadricula vacia se lee como "no tienes nada", que es mentira.
    const vista = await pintar({ error: 'No pudimos cargar tu calendario.' });

    expect(vista.getByTestId('month-error')).toBeTruthy();
    expect(vista.queryByTestId('dia-2026-08-11')).toBeNull();
  });

  it('reintentar avisa', async () => {
    const reintentar = jest.fn();
    const vista = await pintar({ error: 'algo', onReintentar: reintentar });

    await act(async () => { fireEvent.press(vista.getByText('Reintentar')); });

    expect(reintentar).toHaveBeenCalled();
  });
});
