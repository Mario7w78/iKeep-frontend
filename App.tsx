import 'react-native-gesture-handler';
import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_500Medium } from '@expo-google-fonts/nunito/500Medium';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';

import AppNavigator from './src/presentation/navigation/AppNavigator';
import { navigationRef } from './src/presentation/navigation/navigationRef';
import { useBackendWarmUp } from './src/presentation/hooks/useBackendWarmUp';
import { useConfirmacionEmail } from './src/presentation/hooks/useConfirmacionEmail';
import { aplicarTipografiaGlobal } from './src/presentation/theme/typography';

export default function App() {
  // Va en la raíz y no en cada pantalla: el servidor tarda 20-50s en
  // despertar, así que conviene empezar apenas se abre la app y no cuando el
  // usuario ya está esperando una respuesta.
  useBackendWarmUp();

  // Escucha el deep link de confirmación de email (lotus://confirmar-email)
  // en la raíz para que funcione aunque la app se abra desde el correo.
  useConfirmacionEmail();

  // Se cargan solo los pesos que la app declara. Traer la familia entera
  // serían dieciocho archivos para usar seis.
  const [fuentesListas] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  // No se renderiza nada hasta que la fuente esté: con la del sistema primero
  // y Nunito después, la app entera daría un salto visible al arrancar.
  if (!fuentesListas) return <View style={{ flex: 1, backgroundColor: '#2C2E3C' }} />;

  aplicarTipografiaGlobal();

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </View>
  );
}
