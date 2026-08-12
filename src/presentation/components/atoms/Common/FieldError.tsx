import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemeColors, useTheme } from '../../theme/colors';

interface Props {
  /** Sin mensaje no se dibuja nada, para poder colocarlo siempre. */
  mensaje?: string;
  testID?: string;
}

/**
 * El error de un campo, debajo del campo.
 *
 * Se renderiza vacío cuando no hay error para que quien lo use pueda dejarlo
 * puesto de forma permanente en vez de condicionar el JSX: así el mensaje
 * aparece exactamente donde corresponde y no empuja el resto de la pantalla
 * de forma inesperada.
 */
export const FieldError: React.FC<Props> = ({ mensaje, testID = 'field-error' }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!mensaje) return null;

  return (
    <View style={styles.fila} testID={testID} accessibilityRole="alert">
      <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
      <Text style={styles.texto}>{mensaje}</Text>
    </View>
  );
};

// El rojo de error no está en el tema: los cuatro presets comparten fondos y
// solo cambian el acento, así que un error tomaría el color de la marca y
// dejaría de leerse como advertencia.


const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 6,
      paddingHorizontal: 4,
    },
    texto: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: colors.error,
    },
  });
