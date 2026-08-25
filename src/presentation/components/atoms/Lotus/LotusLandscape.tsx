import React, { useEffect, useRef, useState } from 'react';
import { AppState, StyleProp, View, ViewStyle } from 'react-native';
import Rive, { Fit, LoopMode } from 'rive-react-native';

import { FaseDelDia, faseDelDia } from '../../../../domain/services/dayPhase';
import { FUENTE_LOTUS } from './lotusAssets';

interface Props {
  style?: StyleProp<ViewStyle>;
  /** Se dispara al terminar la animación de la fase, si hace falta. */
  onFinish?: () => void;
  testID?: string;
}

/**
 * El cuadro principal de Home: un paisaje que sigue la hora.
 *
 * Todo el control es imperativo porque las máquinas de estados del archivo
 * no tienen inputs. Los loops de ambiente arrancan una vez y nunca se
 * reinician; encima corre la animación de la fase (mañana/tarde/noche),
 * que se reproduce sola y al terminar deja al ambiente respirando.
 *
 * La fase solo se recalcula al volver del background y con cambio real:
 * re-reproducir Morning cada vez que el usuario abre y cierra otra app es
 * la forma más rápida de volver el cuadro molesto.
 */
export const LotusLandscape: React.FC<Props> = ({
  style,
  onFinish,
  testID = 'lotus',
}) => {
  const ref = useRef<any>(null);
  const [fase, setFase] = useState<FaseDelDia>(() =>
    faseDelDia(new Date().getHours())
  );

  // Ambiente: dos loops que corren debajo de todo, siempre.
  useEffect(() => {
    if (!FUENTE_LOTUS) return;
    ref.current?.play('Cloud_Loop', LoopMode.Loop);
    ref.current?.play('Nenufar_Loop', LoopMode.Loop);
  }, []);

  // La fase va en OneShot sobre el ambiente. Al cambiar, la anterior ya
  // terminó o termina ahora: el runtime la reemplaza sin tocar los loops.
  useEffect(() => {
    if (!FUENTE_LOTUS) return;
    ref.current?.play(fase, LoopMode.OneShot);
  }, [fase]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active') return;
      const nueva = faseDelDia(new Date().getHours());
      // setFase con el mismo valor no re-renderiza: mismo horario al
      // volver, cero reproducciones espurias.
      setFase(nueva);
    });

    return () => subscription.remove();
  }, []);

  const terminarFase = (nombre: string) => {
    if (!onFinish || nombre !== fase) return;
    onFinish();
  };

  if (!FUENTE_LOTUS || !Rive) {
    return <View testID={testID} style={[stylesReserva, style]} />;
  }

  return (
    <Rive
      ref={ref}
      testID={testID}
      source={FUENTE_LOTUS as number}
      autoplay={false}
      fit={Fit.Cover}
      onStop={terminarFase}
      onPause={terminarFase}
      style={[{ width: '100%', height: '100%' }, style] as any}
    />
  );
};

/** Sin asset se reserva el hueco con una altura razonable: Home conserva
 *  su composición aunque la decoración falte. */
const stylesReserva = { width: '100%', height: 180 } as const;
