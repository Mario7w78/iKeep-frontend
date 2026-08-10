/**
 * La mascota y su máquina de estados.
 *
 * Hay siete estados previstos y tres animaciones producidas. El componente
 * declara los siete igual: así el resto de la app puede pedir `celebrating`
 * hoy, ver algo razonable, y empezar a mostrar la animación buena el día que
 * exista, sin tocar quien la usa.
 */

jest.mock('lottie-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: any) => React.createElement(View, { ...props, testID: props.testID }),
  };
});

import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';

import { Sapo } from '../Sapo';
import { animacionDe, ESTADOS_CON_ANIMACION, esEnBucle } from '../sapoStates';

describe('animacionDe', () => {
  it('devuelve la animación propia cuando existe', () => {
    expect(animacionDe('idle')).toBe(animacionDe('idle'));
    expect(animacionDe('waving')).not.toBe(animacionDe('idle'));
  });

  it('los estados sin animación propia caen a idle', () => {
    /** Degradar a reposo es preferible a no mostrar nada: la mascota
     *  sigue presente y la pantalla no cambia de forma. */
    expect(animacionDe('thinking')).toBe(animacionDe('idle'));
    expect(animacionDe('sad')).toBe(animacionDe('idle'));
    expect(animacionDe('sleeping')).toBe(animacionDe('idle'));
  });

  it('celebrar y alegrarse usan la de éxito', () => {
    expect(animacionDe('happy')).toBe(animacionDe('celebrating'));
    expect(animacionDe('happy')).not.toBe(animacionDe('idle'));
  });

  it('declara qué estados tienen animación propia', () => {
    expect(ESTADOS_CON_ANIMACION).toEqual(
      expect.arrayContaining(['idle', 'waving', 'happy', 'celebrating'])
    );
  });
});

describe('esEnBucle', () => {
  it('reposo y espera se repiten', () => {
    expect(esEnBucle('idle')).toBe(true);
    expect(esEnBucle('thinking')).toBe(true);
    expect(esEnBucle('sleeping')).toBe(true);
  });

  it('las celebraciones y el saludo ocurren una vez', () => {
    /** Un saludo en bucle deja de leerse como saludo. */
    expect(esEnBucle('waving')).toBe(false);
    expect(esEnBucle('happy')).toBe(false);
    expect(esEnBucle('celebrating')).toBe(false);
  });
});

describe('Sapo', () => {
  it('se dibuja en reposo por defecto', async () => {
    const vista = await render(<Sapo />);

    expect(vista.getByTestId('sapo')).toBeTruthy();
  });

  it('un estado en bucle se repite', async () => {
    const vista = await render(<Sapo estado="idle" />);

    expect(vista.getByTestId('sapo').props.loop).toBe(true);
  });

  it('un estado puntual no se repite', async () => {
    const vista = await render(<Sapo estado="waving" />);

    expect(vista.getByTestId('sapo').props.loop).toBe(false);
  });

  it('arranca reproduciendo', async () => {
    const vista = await render(<Sapo estado="idle" />);

    expect(vista.getByTestId('sapo').props.autoPlay).toBe(true);
  });

  it('acepta un tamaño', async () => {
    const vista = await render(<Sapo estado="idle" tamano={120} />);

    // El estilo llega como array porque se combina con el que reciba por
    // props; hay que aplanarlo para leerlo.
    const estilo = StyleSheet.flatten(vista.getByTestId('sapo').props.style);
    expect(estilo).toEqual(expect.objectContaining({ width: 120, height: 120 }));
  });

  it('se dibuja cuadrado aunque las animaciones no compartan proporcion', async () => {
    /** `success` es 4:3 y las otras casi cuadradas: sin esto la mascota
     *  cambiaria de tamano al celebrar. */
    const vista = await render(<Sapo estado="celebrating" tamano={96} />);

    const estilo = StyleSheet.flatten(vista.getByTestId('sapo').props.style);
    expect(estilo.width).toBe(estilo.height);
    expect(vista.getByTestId('sapo').props.resizeMode).toBe('contain');
  });
});
