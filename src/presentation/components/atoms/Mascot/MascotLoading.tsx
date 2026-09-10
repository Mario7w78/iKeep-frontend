import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { EtapaSapo } from '../../../../domain/services/frogStage';

import AdultLoading from './AdultLoading';
import BabyLoading from './BabyLoading';
import KidLoading from './KidLoading';

/**
 * La mascota de la pantalla de carga, ilustrada por etapa del sapo.
 *
 * Las tres ilustraciones viven en `assets/LoadingMascot/` y se convirtieron a
 * componentes react-native-svg: cada una muestra al sapo de su etapa (bebé,
 * niño o adulto) con la flor de loto y su globo de texto. La pantalla de carga
 * elige la que corresponde según la racha actual del usuario.
 */

const POR_ETAPA: Record<
  EtapaSapo,
  { Retrato: React.ComponentType<{ width?: number; height?: number }>; ancho: number; alto: number }
> = {
  'bebé': { Retrato: BabyLoading, ancho: 290, alto: 320 },
  'niño': { Retrato: KidLoading, ancho: 232, alto: 319 },
  'adulto': { Retrato: AdultLoading, ancho: 232, alto: 346 },
};

interface Props {
  etapa: EtapaSapo;
  /** Ancho del lienzo de la ilustración en px. El alto se deriva del original. */
  width?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const MascotLoading: React.FC<Props> = ({
  etapa,
  width = 220,
  style,
  testID = 'mascot-loading',
}) => {
  const { Retrato, ancho, alto } = POR_ETAPA[etapa];
  const height = (width * alto) / ancho;

  return (
    <View
      testID={testID}
      style={[{ width, height, justifyContent: 'center', alignItems: 'center' }, style]}
    >
      <Retrato width={width} height={height} />
    </View>
  );
};