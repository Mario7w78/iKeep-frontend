import React, { useEffect, useState } from 'react';
import { StyleProp, View, ViewStyle, AppState, AppStateStatus } from 'react-native';
import { 
  RiveView, 
  useRiveFile, 
  useViewModelInstance 
} from '@rive-app/react-native';

import { FaseDelDia, faseDelDia } from '../../../../domain/services/dayPhase';
import { FUENTE_LOTUS } from './lotusAssets';

interface Props {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const LotusLandscape: React.FC<Props> = ({
  style,
  testID = 'lotus',
}) => {
  const { riveFile } = useRiveFile(FUENTE_LOTUS);
  const { instance, isLoading } = useViewModelInstance(riveFile, { async: true });

  const [faseActual, setFaseActual] = useState<FaseDelDia>(() =>
    faseDelDia(new Date().getHours())
  );

  // Sincronizar enum property en ViewModel
  useEffect(() => {
    if (instance) {
      // currentDayState = enum property en ViewModel
      // Valores: 'Morning' | 'Evening' | 'Night' (según FaseDelDia)
      instance.enumProperty('currentDayState')?.set(faseActual);
    }
  }, [faseActual, instance]);

  // AppState listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (estado: AppStateStatus) => {
      if (estado !== 'active') return;
      const nueva = faseDelDia(new Date().getHours());
      setFaseActual(prev => prev === nueva ? prev : nueva);
    });
    return () => subscription.remove();
  }, []);

  // La fase también cambia con la app abierta (05:00, 15:00 y 18:00). El
  // listener de AppState solo cubre volver de background, así que acá se
  // revisa el reloj cada minuto: sin esto la ilustración se quedaba en la fase
  // del último arranque hasta recargar la app.
  useEffect(() => {
    const interval = setInterval(() => {
      const nueva = faseDelDia(new Date().getHours());
      setFaseActual(prev => prev === nueva ? prev : nueva);
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Fallback
  if (!riveFile || isLoading || !instance) {
    return <View testID={testID} style={{ width: '100%', height: 180, ...style }} />;
  }

  // Render
  return (
    <View style={[{ width: '100%', height: '100%' }, style]}>
      <RiveView
        file={riveFile}
        dataBind={instance}
        style={{ flex: 1 }}
      />
    </View>
  );
};