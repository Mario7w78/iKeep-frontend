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

const EVENTO_GOOGLE = {
  id: 'g-ev-1',
  titulo: 'Dentista',
  inicio: '2026-08-11T13:00:00Z',
  fin: '2026-08-11T14:00:00Z',
  todoElDia: false,
};

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

describe('el boton de crear en el dia', () => {
  // calendario-mensual: crear una actividad puntual justo donde se esta
  // mirando, con la fecha del dia elegido.
  it('con dia elegido aparece y avisa con la fecha local', async () => {
    const crear = jest.fn();
    const vista = await pintar({
      diaSeleccionado: '2026-08-11',
      onCrearEnDia: crear,
    });

    const boton = vista.getByTestId('crear-en-dia');
    expect(boton.props.accessibilityLabel).toBe('Crear actividad el 2026-08-11');

    await act(async () => { fireEvent.press(boton); });

    expect(crear).toHaveBeenCalledWith('2026-08-11');
  });

  it('un dia vacio tambien ofrece crearlo', async () => {
    const crear = jest.fn();
    const vista = await pintar({
      diaSeleccionado: '2026-08-12',
      onCrearEnDia: crear,
    });

    await act(async () => { fireEvent.press(vista.getByTestId('crear-en-dia')); });

    expect(crear).toHaveBeenCalledWith('2026-08-12');
  });

  it('sin handler no existe: pantallas viejas no cambian', async () => {
    const vista = await pintar({ diaSeleccionado: '2026-08-11' });

    expect(vista.queryByTestId('crear-en-dia')).toBeNull();
  });
});

describe('las acciones del panel', () => {
  // calendario-mensual: mover y cancelar viven en la fila, a la vista.
  it('cada fila expone Mover y Cancelar con su fecha', async () => {
    const mover = jest.fn();
    const cancelar = jest.fn();
    const vista = await pintar({
      porDia: { '2026-08-11': [OCURRENCIA] },
      diaSeleccionado: '2026-08-11',
      onMover: mover,
      onCancelar: cancelar,
    });

    expect(vista.getByTestId('mover-1')).toBeTruthy();
    expect(vista.getByTestId('cancelar-1')).toBeTruthy();
    expect(vista.getByLabelText('Mover Cálculo del 2026-08-11')).toBeTruthy();

    await act(async () => { fireEvent.press(vista.getByTestId('mover-1')); });
    await act(async () => { fireEvent.press(vista.getByTestId('cancelar-1')); });

    expect(mover).toHaveBeenCalledWith('1', '2026-08-11');
    expect(cancelar).toHaveBeenCalledWith('1', '2026-08-11');
  });

  it('sin handlers las filas no ofrecen acciones: pantallas viejas intactas', async () => {
    const vista = await pintar({
      porDia: { '2026-08-11': [OCURRENCIA] },
      diaSeleccionado: '2026-08-11',
    });

    expect(vista.queryByTestId('mover-1')).toBeNull();
    expect(vista.queryByTestId('cancelar-1')).toBeNull();
  });

  it('solo Mover sin Cancelar tambien compila', async () => {
    const vista = await pintar({
      porDia: { '2026-08-11': [OCURRENCIA] },
      diaSeleccionado: '2026-08-11',
      onMover: jest.fn(),
    });

    expect(vista.getByTestId('mover-1')).toBeTruthy();
    expect(vista.queryByTestId('cancelar-1')).toBeNull();
  });
});

describe('la seccion de canceladas', () => {
  // El servidor descarta las canceladas del GET: estas filas vienen de la
  // lista en sesion, y Restaurar borra la excepcion.
  const CANCELADA = { ...OCURRENCIA };

  it('lista las canceladas del dia con su boton Restaurar', async () => {
    const restaurar = jest.fn();
    const vista = await pintar({
      porDia: {},
      canceladasEnSesion: [CANCELADA],
      diaSeleccionado: '2026-08-11',
      onRestaurar: restaurar,
    });

    expect(vista.getByTestId('seccion-canceladas')).toBeTruthy();
    expect(vista.getByText('Cálculo')).toBeTruthy();

    await act(async () => { fireEvent.press(vista.getByTestId('restaurar-1')); });

    expect(restaurar).toHaveBeenCalledWith('1', '2026-08-11');
  });

  it('no mezcla canceladas de otros dias', async () => {
    const vista = await pintar({
      porDia: {},
      canceladasEnSesion: [CANCELADA],
      diaSeleccionado: '2026-08-12',
    });

    expect(vista.queryByTestId('seccion-canceladas')).toBeNull();
  });

  it('un dia vacio con canceladas no dice "dia libre"', async () => {
    const vista = await pintar({
      porDia: {},
      canceladasEnSesion: [CANCELADA],
      diaSeleccionado: '2026-08-11',
      onRestaurar: jest.fn(),
    });

    expect(vista.queryByText('Nada agendado. Día libre.')).toBeNull();
  });
});

describe('los eventos importados de google', () => {
  // external-events-ui: lo importado se distingue y se LEE, nunca se edita.
  it('el dia con importados muestra su punto con estilo propio', async () => {
    const vista = await pintar({
      importadosPorDia: { '2026-08-11': [EVENTO_GOOGLE] },
    });

    const punto = vista.getByTestId('punto-importado-g-ev-1-2026-08-11');
    expect(punto).toBeTruthy();
    // Distinto del punto de actividad (secondaryAccent) y del unico (warning).
    expect(punto.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ backgroundColor: '#a5b2eb' })])
    );
  });

  it('sin la prop no hay ningun cambio: aditivo', async () => {
    const vista = await pintar();

    expect(vista.queryByTestId('punto-importado-g-ev-1-2026-08-11')).toBeNull();
    expect(vista.queryByTestId('seccion-importados')).toBeNull();
  });

  it('un evento multi-dia aparece en cada dia que ocupa', async () => {
    const viaje = { ...EVENTO_GOOGLE, id: 'g-viaje', titulo: 'Viaje' };
    const vista = await pintar({
      importadosPorDia: { '2026-08-14': [viaje], '2026-08-15': [viaje], '2026-08-16': [viaje] },
    });

    expect(vista.getByTestId('punto-importado-g-viaje-2026-08-14')).toBeTruthy();
    expect(vista.getByTestId('punto-importado-g-viaje-2026-08-15')).toBeTruthy();
    expect(vista.getByTestId('punto-importado-g-viaje-2026-08-16')).toBeTruthy();
  });

  describe('en el detalle del dia', () => {
    const pintarConImportado = (props: any = {}) =>
      pintar({
        diaSeleccionado: '2026-08-11',
        importadosPorDia: { '2026-08-11': [EVENTO_GOOGLE] },
        ...props,
      });

    it('lista el titulo tal cual vino de google, sin prefijos ni adornos', async () => {
      const vista = await pintarConImportado();

      expect(vista.getByTestId('seccion-importados')).toBeTruthy();
      expect(vista.getByText('Dentista')).toBeTruthy();   // exacto, no regex
    });

    it('la seccion esta separada y no mezcla con las actividades propias', async () => {
      const vista = await pintarConImportado({
        porDia: { '2026-08-11': [OCURRENCIA] },
      });

      expect(vista.getByText('Cálculo')).toBeTruthy();
      expect(vista.getByTestId('seccion-importados')).toBeTruthy();
    });

    it('es SOLO lectura: sin Mover, sin Cancelar, sin Restaurar', async () => {
      const vista = await pintarConImportado({
        onMover: jest.fn(),
        onCancelar: jest.fn(),
        onRestaurar: jest.fn(),
      });

      expect(vista.queryByTestId('mover-g-ev-1')).toBeNull();
      expect(vista.queryByTestId('cancelar-g-ev-1')).toBeNull();
      expect(vista.queryByTestId('restaurar-g-ev-1')).toBeNull();
    });

    it('una fila importada no es tocable: View plano, no TouchableOpacity', async () => {
      const vista = await pintarConImportado();

      const fila = vista.getByTestId('importado-g-ev-1');
      expect(fila.props.onPress).toBeUndefined();
    });

    it('un dia solo con importados no dice "dia libre"', async () => {
      const vista = await pintarConImportado();

      expect(vista.queryByText('Nada agendado. Día libre.')).toBeNull();
      expect(vista.getByText('Dentista')).toBeTruthy();
    });
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
