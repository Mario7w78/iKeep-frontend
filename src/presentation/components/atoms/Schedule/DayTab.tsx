import React, { useMemo } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { DayOfWeek } from '../../../../domain/entities/Activity';
import { JS_DAY_TO_DAYOFWEEK } from '../../../utils/scheduleUtils';
import { useTheme, ThemeColors } from '../../theme/colors';

const DAY_SINGLE_LETTER: Record<DayOfWeek, string> = {
  Lunes: 'L',
  Martes: 'M',
  Miercoles: 'X',
  Jueves: 'J',
  Viernes: 'V',
  Sabado: 'S',
  Domingo: 'D',
};

interface Props {
  day: DayOfWeek;
  isSelected: boolean;
  onPress: () => void;
}

export function DayTab({ day, isSelected, onPress }: Props) {
  const today = JS_DAY_TO_DAYOFWEEK[new Date().getDay()];
  const isToday = day === today;
  const { colors, comfyColors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.tab,
          isSelected ? styles.tabActive : styles.tabInactive,
          isToday && !isSelected && { borderColor: comfyColors.green, borderWidth: 1.5 }
        ]}
      >
        <Text style={[
          styles.text, 
          isSelected ? styles.textActive : styles.textInactive,
          isToday && !isSelected && { color: comfyColors.green }
        ]}>
          {DAY_SINGLE_LETTER[day]}
        </Text>
      </TouchableOpacity>
      {isSelected ? (
        <View style={styles.indicator} />
      ) : (
        <View style={styles.indicatorPlaceholder} />
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    tabContainer: {
      alignItems: 'center',
      gap: 6,
    },
    tab: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabActive: {
      backgroundColor: colors.secondaryAccent,
    },
    tabInactive: {
      backgroundColor: colors.screenBackground,
      borderWidth: 1.5,
      borderColor: colors.cardBorder,
    },
    text: {
      fontSize: 16,
      fontWeight: '900',
    },
    textActive: {
      color: colors.secondaryAccentText,
    },
    textInactive: {
      color: colors.textSecondary,
    },
    indicator: {
      width: 20,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.secondaryAccent,
    },
    indicatorPlaceholder: {
      width: 20,
      height: 4,
      backgroundColor: 'transparent',
    },
  });
}