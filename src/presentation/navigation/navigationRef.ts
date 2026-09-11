import { createNavigationContainerRef } from '@react-navigation/native';
import { AuthStackParamList, RootStackParamList } from './AppNavigator';

/**
 * Referencia global al contenedor de navegación.
 *
 * Vive en la raíz (App.tsx) y la usan piezas que están FUERA del árbol de
 * navegación — como el hook de confirmación de email, que corre en App.tsx
 * antes de que exista cualquier pantalla. Con `isReady()` se comprueba si el
 * contenedor ya está montado antes de navegar: el deep link inicial puede
 * llegar antes que la primera pantalla.
 */
export const navigationRef = createNavigationContainerRef<
  RootStackParamList & AuthStackParamList
>();