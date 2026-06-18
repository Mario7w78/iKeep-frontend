import React, { useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { formatHour, LABEL_WIDTH } from '../../../utils/scheduleUtils';
import { useTheme, ThemeColors } from '../../theme/colors';

export function HourLabel({ hour }: { hour: number }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Text style={styles.label}>{formatHour(hour)}</Text>;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    label: { 
      width: LABEL_WIDTH, 
      fontSize: 11, 
      color: colors.textSecondary, 
      textAlign: 'right', 
      paddingRight: 8, 
      marginTop: -7 
    },
  });
}