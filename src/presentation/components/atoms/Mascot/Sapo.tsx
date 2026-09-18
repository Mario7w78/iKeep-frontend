import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { 
  Fit,
  RiveView, 
  useRiveFile, 
  useViewModelInstance 
} from '@rive-app/react-native';

import { estadoRiveDe, SapoState } from './sapoStates';

interface Props {
  estado?: SapoState;
  size?: number;
  style?: StyleProp<ViewStyle>;
  tipoSapo?: 0 | 1 | 2;
  testID?: string;
}

const DEFAULT_SIZE = 96;
const ARTBOARD_NAMES = ['Baby_Sapo', 'Kid_Sapo', 'Adult_Sapo'] as const;

/**
 * La mascota renderiza su lienzo llenando la caja de `size`: sin crops ni
 * transforms, que cortan la superficie GL y al personaje. Si se quiere un sapo
 * grande sin robar espacio del layout, se pone detrás del contenido como capa
 * de fondo (ver el patrón de AIChatView y RachaHero), no agrandando la caja.
 */
export const Sapo: React.FC<Props> = ({
  estado = 'idle',
  size = DEFAULT_SIZE,
  style,
  tipoSapo = 0,
  testID,
}) => {
  const { riveFile } = useRiveFile(require('../../../../../assets/mascot/sapo_animations.riv'));
  const { instance, isLoading } = useViewModelInstance(riveFile, { async: true });

  useEffect(() => {
    if (instance) {
      instance.enumProperty('sapoState')?.set(estadoRiveDe(estado));
    }
  }, [estado, instance]);

  useEffect(() => {
    if (instance && riveFile) {
      const artboardProp = instance.artboardProperty('artboardProperty');
      if (artboardProp) {
        try {
          const bindable = riveFile.getBindableArtboard(ARTBOARD_NAMES[tipoSapo]);
          artboardProp.set(bindable);
        } catch (e) {
          console.error('Error cambiando artboard:', e);
        }
      }
    }
  }, [tipoSapo, instance, riveFile]);

  // ✅ FIX: check instance también
  if (!riveFile || isLoading || !instance) {
    return <View testID={testID} style={[{ width: size, height: size }, style]} />;
  }

  return (
    <View testID={testID} style={[{ width: size, height: size }, style]}>
      <RiveView
        file={riveFile}
        dataBind={instance}
        fit={Fit.Contain}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
};