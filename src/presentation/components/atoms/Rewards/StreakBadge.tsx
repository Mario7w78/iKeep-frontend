import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemeColors, useTheme } from '../../theme/colors';
import { ESPACIO, PESO, RADIO, TEXTO } from '../../theme/tokens';

interface Props {
  dias: number;
  enRiesgo: boolean;
}

/**
 * Los días seguidos con algo hecho.
 *
 * No se muestra en cero: un contador en cero no motiva, informa de un vacío.
 * Aparece cuando hay algo que perder, que es cuando empieza a importar.
 */
export const StreakBadge: React.FC<Props> = ({ dias, enRiesgo }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (dias <= 0) return null;

  return (
    <View
      testID="streak-badge"
      style={[styles.contenedor, enRiesgo && styles.enRiesgo]}
      accessibilityRole="text"
      accessibilityLabel={
        enRiesgo ? `Racha de ${dias} días, en riesgo` : `Racha de ${dias} días`
      }
    >
      <Ionicons
        name="flame"
        size={16}
        // Apagado cuando está en riesgo: la llama encendida es la recompensa,
        // y verla gris dice más que cualquier texto de advertencia.
        color={enRiesgo ? colors.textSecondary : colors.warning}
      />
      <Text style={[styles.numero, enRiesgo && styles.numeroEnRiesgo]}>{dias}</Text>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    contenedor: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIO.xs,
      paddingVertical: ESPACIO.xs + 1,
      paddingHorizontal: ESPACIO.md - 2,
      borderRadius: RADIO.pill,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.warning,
    },
    enRiesgo: {
      borderColor: colors.cardBorder,
    },
    numero: {
      fontSize: TEXTO.pie + 1,
      fontWeight: PESO.fuerte,
      color: colors.warning,
    },
    numeroEnRiesgo: {
      color: colors.textSecondary,
    },
  });
