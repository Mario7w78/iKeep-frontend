import React from 'react';
import { ScrollView, StyleProp, View, ViewStyle } from 'react-native';

interface Props {
  /**
   * Si el paso se dibuja dentro de otro que ya desplaza.
   *
   * Cada paso del wizard traía su propio ScrollView, lo que impedía juntarlos
   * en una sola pantalla: anidarlos hace que el gesto de arrastre se pelee
   * entre los dos y que el interior atrape el scroll del exterior.
   *
   * Con esto, un paso puede ser pantalla completa o una sección más dentro de
   * otra, sin duplicar su contenido.
   */
  embebido?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export const StepContainer: React.FC<Props> = ({
  embebido = false,
  style,
  contentContainerStyle,
  children,
}) => {
  if (embebido) {
    // Los estilos de contenido pasan al View porque ya no hay
    // contentContainer: sin esto se perderían los paddings del paso.
    return <View style={[style, contentContainerStyle]}>{children}</View>;
  }

  return (
    <ScrollView
      style={style}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
};
