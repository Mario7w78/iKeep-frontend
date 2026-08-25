/**
 * Mock manual de rive-react-native para todo el runner.
 *
 * jest-expo aplica los mocks manuales en `__mocks__/` de la raíz a los
 * paquetes de node_modules sin que cada suite llame jest.mock(): así las
 * suites que renderizan Sapo de pasada no saben ni les importa que abajo
 * hay un runtime Rive.
 *
 * Contrato:
 * - `default` es un forwardRef que registra cada montaje en `__instancias`
 *   con los controles como jest.Mock. Se afirma con
 *   `__instancias.at(-1).play` → `('Idle', 'loop')`, etc.
 * - `__reset()` limpia entre tests.
 * - `LoopMode` y `Fit` replican el vocabulario del paquete real.
 */
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';

export const LoopMode = {
  OneShot: 'oneshot',
  Loop: 'loop',
  AutoLoop: 'autoloop',
} as const;

export const Fit = {
  Contain: 'contain',
  Cover: 'cover',
  Fill: 'fill',
  None: 'none',
} as const;

type Controles = {
  play: ReturnType<typeof jest.fn>;
  pause: ReturnType<typeof jest.fn>;
  stop: ReturnType<typeof jest.fn>;
  reset: ReturnType<typeof jest.fn>;
};

/** Instancias montadas; la última es la que acaba de renderizar. */
export const __instancias: Array<{ props: Record<string, unknown> } & Controles> = [];

export const __reset = (): void => {
  __instancias.length = 0;
};

type Props = Record<string, any>;

const Rive = forwardRef<Controles, Props>((props, ref) => {
  // Estables para que el ref siga siendo el mismo entre renders.
  const controles = useRef<Controles>({
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
  }).current;

  useEffect(() => {
    __instancias.push({ props, ...controles });
    // Al desmontar se va: `at(-1)` siempre apunta al vivo más nuevo.
    return () => {
      const indice = __instancias.findIndex((i) => i.play === controles.play);
      if (indice >= 0) __instancias.splice(indice, 1);
    };
  }, [controles]);

  useImperativeHandle(ref, () => controles);

  return <View testID={props.testID} />;
});

Rive.displayName = 'Rive';

export default Rive;
