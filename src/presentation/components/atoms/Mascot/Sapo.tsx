import React, { useEffect, useRef } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Rive, { Fit, LoopMode } from 'rive-react-native';

import { SapoState } from './sapoStates';
import { FUENTE_SAPO } from './sapoAssets';
import { useSapoViewModel } from './useSapoViewModel';

interface Props {
  /** Qué está haciendo la mascota. Los estados sin animación caen a reposo. */
  estado?: SapoState;
  /** Lado del cuadrado en el que se dibuja. */
  tamano?: number;
  style?: StyleProp<ViewStyle>;
  /**
   * Si se reproduce o queda quieta.
   *
   * Un Rive animándose por cada mensaje del chat sería caro en gama media:
   * los avatares viejos se congelan y solo el ultimo se mueve.
   */
  animar?: boolean;
  /** Se dispara al terminar, solo en los estados que no se repiten. */
  onFinish?: () => void;
  testID?: string;
}

const TAMANO_POR_DEFECTO = 96;

/**
 * La mascota, ahora con runtime Rive.
 *
 * Cada máquina de estados del archivo no tiene inputs: todo el control es
 * imperativo por ref (`play(nombre, modo)`), sin autoplay ni props
 * declarativas de por medio.
 *
 * El `key` cambia con el estado y la etapa a propósito: remontar reinicia
 * la reproducción desde un estado limpio, que es más predecible —y
 * testeable— que negociar artboards en vivo con un runtime ya cargado.
 *
 * Sin asset se reserva el hueco y no se dibuja nada: la pantalla conserva
 * su composición en vez de reacomodarse o romperse.
 */
export const Sapo: React.FC<Props> = ({
  estado = 'idle',
  tamano = TAMANO_POR_DEFECTO,
  style,
  animar = true,
  onFinish,
  testID = 'sapo',
}) => {
  const { etapa, artboard, animacion, ambiental, enBucle, alTerminar } =
    useSapoViewModel(estado);
  const ref = useRef<any>(null);

  // Se reproduce a mano y no con autoplay: autoplay arranca antes de que
  // el componente decida qué toca, y acá la decisión depende del estado
  // y de la etapa (racha).
  useEffect(() => {
    if (!animar) return;
    ref.current?.play(
      animacion,
      enBucle ? LoopMode.Loop : LoopMode.OneShot
    );
    // El ambiente (parpadeo) corre encima y nunca termina.
    if (ambiental) {
      ref.current?.play(ambiental, LoopMode.Loop);
    }
  }, [animar, animacion, ambiental, enBucle]);

  if (!FUENTE_SAPO || !Rive) {
    return <View testID={testID} style={[{ width: tamano, height: tamano }, style]} />;
  }

  /**
   * Fin de una animación.
   *
   * El runtime avisa el fin de una OneShot con onPause (iOS) o onStop;
   * escuchar ambos cuesta nada y deja el encadenado igual en las dos
   * plataformas. Si terminó otra —el ambiente pausado al irse de la
   * app—, `alTerminar` lo ignora porque el nombre no coincide.
   */
  const terminar = (nombre: string) => {
    const eraLaPrincipal = nombre === animacion && !enBucle;
    alTerminar(nombre);
    if (eraLaPrincipal) onFinish?.();
  };

  return (
    <Rive
      key={`${estado}-${etapa}`}
      ref={ref}
      testID={testID}
      source={FUENTE_SAPO as number}
      artboardName={artboard}
      autoplay={false}
      fit={Fit.Contain}
      onStop={terminar}
      onPause={terminar}
      style={[{ width: tamano, height: tamano }, style] as any}
    />
  );
};
