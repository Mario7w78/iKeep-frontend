import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { DayOfWeek } from '../../../../domain/entities/Activity';
import { JS_DAY_TO_DAYOFWEEK } from '../../../utils/scheduleUtils';

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

  return (
    <View style={s.tabContainer}>
      <TouchableOpacity
        onPress={onPress}
        style={[
          s.tab,
          isSelected ? s.tabActive : s.tabInactive,
          isToday && !isSelected && { borderColor: '#98FF60', borderWidth: 1.5 }
        ]}
      >
        <Text style={[
          s.text, 
          isSelected ? s.textActive : s.textInactive,
          isToday && !isSelected && { color: '#98FF60' }
        ]}>
          {DAY_SINGLE_LETTER[day]}
        </Text>
      </TouchableOpacity>
      {isSelected ? (
        <View style={s.indicator} />
      ) : (
        <View style={s.indicatorPlaceholder} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
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
    backgroundColor: '#2B7FFF',
  },
  tabInactive: {
    backgroundColor: 'rgba(39, 39, 42, 0.5)',
  },
  text: {
    fontSize: 16,
    fontWeight: '900',
  },
  textActive: {
    color: '#ffffff',
  },
  textInactive: {
    color: '#A9A9A9',
  },
  indicator: {
    width: 20,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ffffff',
  },
  indicatorPlaceholder: {
    width: 20,
    height: 4,
    backgroundColor: 'transparent',
  },
});