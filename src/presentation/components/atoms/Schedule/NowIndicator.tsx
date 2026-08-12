import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { LABEL_WIDTH } from '../../../utils/scheduleUtils';
import { ThemeColors, useTheme } from '../../theme/colors';

/**
 * La línea de "ahora" sobre la grilla del horario.
 *
 * El color sale del tema. Tenía un rojo propio —el cuarto de la app para el
 * mismo papel, junto a los de la tarjeta del chat y los de auth— y sobre un
 * fondo claro un rojo pensado para oscuro se ve chillón.
 */
export function NowIndicator({ top }: { top: number }) {
  const { colors } = useTheme();
  const s = useMemo(() => createStyles(colors), [colors]);

  return (
    <>
      <View style={[s.dot, { top: top - 3 }]} />
      <View style={[s.line, { top }]} />
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    dot: {
      position: 'absolute',
      left: LABEL_WIDTH - 4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.error,
    },
    line: {
      position: 'absolute',
      left: LABEL_WIDTH,
      right: 0,
      height: 2,
      backgroundColor: colors.error,
    },
  });
