import React, { useEffect, useMemo, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';

import { animacionDe, esEnBucle, rangoDe, SapoState } from './sapoStates';

interface Props {
  /** Qué está haciendo la mascota. Los estados sin animación caen a reposo. */
  estado?: SapoState;
  /** Lado del cuadrado en el que se dibuja. */
  tamano?: number;
  style?: StyleProp<ViewStyle>;
  /**
   * Si se reproduce o queda en un cuadro fijo.
   *
   * Un LottieView animandose por cada mensaje del chat seria caro en gama
   * media: los avatares viejos se congelan y solo el ultimo se mueve.
   */
  animar?: boolean;
  /** Se dispara al terminar, solo en los estados que no se repiten. */
  onFinish?: () => void;
  testID?: string;
}

const TAMANO_POR_DEFECTO = 96;

/**
 * La mascota.
 *
 * Se dibuja siempre en un cuadrado aunque las animaciones no compartan
 * proporción: `success` es 4:3 y las otras casi cuadradas, así que sin esto la
 * mascota cambiaría de tamaño al celebrar. `resizeMode="contain"` la encaja
 * dentro sin recortarla.
 *
 * La `key` cambia con el estado a propósito: LottieView no reinicia la
 * reproducción al cambiarle la fuente, y sin remontar una celebración
 * arrancaría desde donde había quedado el reposo.
 */
export const Sapo: React.FC<Props> = ({
  estado = 'idle',
  tamano = TAMANO_POR_DEFECTO,
  style,
  animar = true,
  onFinish,
  testID = 'sapo',
}) => {
  const fuente = useMemo(() => animacionDe(estado), [estado]);
  const enBucle = esEnBucle(estado);
  const rango = rangoDe(estado);
  const ref = useRef<LottieView>(null);

  // Con rango se reproduce a mano en vez de con autoPlay: autoPlay siempre
  // arranca desde el frame 0 hasta el final, que es justo lo que hay que
  // evitar cuando el archivo trae una cola larga.
  useEffect(() => {
    if (animar && rango) {
      ref.current?.play(rango[0], rango[1]);
    }
  }, [animar, estado]);

  return (
    <LottieView
      key={estado}
      ref={ref}
      testID={testID}
      source={fuente as any}
      autoPlay={animar && !rango}
      loop={animar && enBucle}
      // progress fija el cuadro cuando no se anima; sin esto quedaria en
      // negro hasta que algo lo reprodujera.
      progress={animar ? undefined : 0}
      onAnimationFinish={enBucle ? undefined : onFinish}
      resizeMode="contain"
      style={[{ width: tamano, height: tamano }, style] as any}
    />
  );
};
