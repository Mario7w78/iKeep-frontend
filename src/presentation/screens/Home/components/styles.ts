/**
 * Tipos compartidos para estilos de componentes Home.
 * Permite propiedades CSS modernas (gap, position, shadow, etc.) 
 * que no están en ViewStyle de versiones antiguas de @types/react-native.
 */
import { ViewStyle, TextStyle } from "react-native";

/**
 * Estilo extendido que incluye propiedades CSS modernas
 * no presentes en ViewStyle de versiones antiguas de @types/react-native.
 */
export type ExtendedViewStyle = ViewStyle & {
  gap?: number;
  position?: 'absolute' | 'relative';
  shadowColor?: string;
  shadowOpacity?: number;
  shadowRadius?: number;
  shadowOffset?: { width: number; height: number };
  elevation?: number;
};

/**
 * Unión de estilos de vista y texto para createStyles.
 */
export type ComponentStyle = ExtendedViewStyle | TextStyle;

/**
 * Tipo de retorno para funciones createStyles.
 */
export type StyleSheetReturn = Record<string, ComponentStyle>;