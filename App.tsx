import 'react-native-gesture-handler';
import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/presentation/navigation/AppNavigator';
import { useBackendWarmUp } from './src/presentation/hooks/useBackendWarmUp';

export default function App() {
  // Va en la raíz y no en cada pantalla: el servidor tarda 20-50s en
  // despertar, así que conviene empezar apenas se abre la app y no cuando el
  // usuario ya está esperando una respuesta.
  useBackendWarmUp();

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator/>
        </NavigationContainer>
      </SafeAreaProvider>
    </View>
  );
}
