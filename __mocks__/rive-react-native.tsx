/**
 * Mock manual de @rive-app/react-native (API v2) para todo el runner.
 *
 * El componente Sapo usa el paquete scoped con la API v2:
 *   - `useRiveFile(fuente)`      -> { riveFile }
 *   - `useViewModelInstance(..)` -> { instance, isLoading }
 *   - `<RiveView file dataBind fit style/>`
 * El paquete real es ESM y no pasa por el transform de jest-expo, así que sin
 * este mock el runner muere con "Cannot use import statement outside a module"
 * en cualquier suite que renderice Sapo (RachaHero, MessageBubble, etc.).
 *
 * Contrato expuesto para afirmar:
 *   - `__instancias`: props de cada RiveView viva (la última = la actual).
 *   - `__modelos`: instancias de ViewModel devueltas por useViewModelInstance;
 *     `enumProperty(path)` y `artboardProperty(path)` son jest.fn() que
 *     devuelven `{ set: jest.fn() }` (el mismo setter siempre).
 *   - `__reset()` limpia entre tests.
 */
import React, { forwardRef, useEffect } from 'react';
import { View } from 'react-native';

export const Fit = {
  Contain: 'contain',
  Cover: 'cover',
  Fill: 'fill',
  None: 'none',
} as const;

export const Alignment = {
  Center: 'center',
  TopLeft: 'topleft',
  TopCenter: 'topcenter',
  TopRight: 'topright',
  CenterLeft: 'centerleft',
  CenterRight: 'centerright',
  BottomLeft: 'bottomleft',
  BottomCenter: 'bottomcenter',
  BottomRight: 'bottomright',
} as const;

export const LoopMode = {
  OneShot: 'oneshot',
  Loop: 'loop',
  AutoLoop: 'autoloop',
} as const;

export const AutoBind = (value: boolean) => ({ type: 'autobind', value });

export const DataBindMode = {
  auto: 'auto',
  manual: 'manual',
} as const;

export type ModeloMock = {
  enumProperty: ReturnType<typeof jest.fn>;
  artboardProperty: ReturnType<typeof jest.fn>;
};

function modeloNuevo(): ModeloMock {
  const enumSet = jest.fn();
  const artboardSet = jest.fn();
  return {
    enumProperty: jest.fn((_path: string) => ({ set: enumSet })),
    artboardProperty: jest.fn((_path: string) => ({ set: artboardSet })),
  };
}

/** RiveView vivas; la última es la que acabó de renderizar. */
export const __instancias: Array<Record<string, any>> = [];

/** ViewModels entregados por useViewModelInstance (spies del modelo). */
export const __modelos: ModeloMock[] = [];

export const __reset = (): void => {
  __instancias.length = 0;
  __modelos.length = 0;
};

export function useRiveFile(_fuente: unknown) {
  const riveFile = React.useMemo(
    () => ({ getBindableArtboard: jest.fn((nombre: string) => ({ nombre })) }),
    []
  );
  return { riveFile };
}

export function useViewModelInstance(_file: unknown, _opts?: unknown) {
  const modelo = React.useMemo(modeloNuevo, []);
  __modelos.push(modelo);
  return { instance: modelo, isLoading: false };
}

type Props = Record<string, any>;

export const RiveView = forwardRef<unknown, Props>((props, ref) => {
  useEffect(() => {
    __instancias.push(props);
    return () => {
      const indice = __instancias.indexOf(props);
      if (indice >= 0) __instancias.splice(indice, 1);
    };
  }, [props]);

  React.useImperativeHandle(ref, () => ({}));

  return <View testID={props.testID} style={props.style} />;
});

RiveView.displayName = 'RiveView';

export default RiveView;