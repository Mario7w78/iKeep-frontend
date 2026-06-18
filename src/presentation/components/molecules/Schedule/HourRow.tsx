import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { HourLabel } from '../../atoms/Schedule/HourLabel';
import { useTheme, ThemeColors } from '../../theme/colors';

export function HourRow({ hour, displayStart = 0, hourHeight = 56 }: { 
  hour: number;
  displayStart?: number;
  hourHeight?: number;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.row, { top: (hour - displayStart) * hourHeight }]}>
      <HourLabel hour={hour} />
      <View style={styles.line} />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: { 
      position: 'absolute', 
      left: 0, 
      right: 0, 
      flexDirection: 'row', 
      alignItems: 'flex-start' 
    },
    line: { 
      flex: 1, 
      height: StyleSheet.hairlineWidth, 
      backgroundColor: colors.cardBorder, 
      marginTop: 7 
    },
  });
}