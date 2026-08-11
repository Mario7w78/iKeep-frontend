import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import NameIdentityStep from './NameIdentityStep';
import DaySelectionStep from './DaySelectionStep';
import { ThemeColors, useTheme } from '../../theme/colors';

/**
 * "¿Qué y cuándo?" — el primer paso del wizard.
 *
 * Junta lo que antes eran dos pantallas separadas. Estaban partidas sin
 * motivo: elegir el nombre y elegir los días son la misma decisión —qué
 * actividad es y cuándo ocurre— y separarlas costaba dos toques de "Siguiente"
 * y dos de "Atrás" cada vez que el usuario quería corregir algo.
 *
 * El desplazamiento es uno solo. Cada sección se dibuja embebida, sin su
 * propio ScrollView: anidarlos hacía que el gesto se peleara entre los dos.
 */
export const WhatAndWhenStep: React.FC<any> = (props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.contenido}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <NameIdentityStep {...props} embebido />
      <View style={styles.separador} />
      <DaySelectionStep {...props} embebido />
    </ScrollView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: {
      flex: 1,
    },
    contenido: {
      paddingBottom: 24,
    },
    separador: {
      height: 1,
      backgroundColor: colors.cardBorder,
      marginVertical: 20,
      marginHorizontal: 20,
    },
  });
