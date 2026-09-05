import React, { useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemeColors, useTheme } from '../../theme/colors';
import { RADIO } from '../../theme/tokens';

interface Props {
  completada: boolean;
  onToggle: () => void;
  /** Para distinguir una casilla de otra en los tests y en accesibilidad. */
  nombre?: string;
}

/**
 * La casilla que marca una actividad como hecha.
 *
 * Es el evento que faltaba en toda la app: sin él no hay racha, ni progreso,
 * ni nada que la mascota pueda celebrar.
 *
 * El área táctil es más grande que el dibujo: se toca al pasar, muchas veces
 * caminando, y un objetivo de 20px se falla.
 */
export const CompleteToggle: React.FC<Props> = ({ completada, onToggle, nombre }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const alTocar = () => {
    // El golpecito llega antes que la red. Es lo que hace que la acción se
    // sienta instantánea aunque el servidor tarde en despertar.
    Haptics.impactAsync(
      completada ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    ).catch(() => undefined);
    onToggle();
  };

  return (
    <TouchableOpacity
      testID="complete-toggle"
      onPress={alTocar}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completada }}
      accessibilityLabel={
        nombre
          ? `${completada ? 'Desmarcar' : 'Marcar como hecha'} ${nombre}`
          : 'Marcar como hecha'
      }
      activeOpacity={0.7}
    >
      <View style={[styles.casilla, completada && styles.casillaHecha]}>
        {completada && <Ionicons name="checkmark" size={16} color={colors.screenBackground} />}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    casilla: {
      width: 24,
      height: 24,
      borderRadius: RADIO.md - 2,
      borderWidth: 2,
      borderColor: colors.secondaryAccent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    casillaHecha: {
      backgroundColor: colors.secondaryAccent,
      borderColor: colors.secondaryAccent,
    },
  });
