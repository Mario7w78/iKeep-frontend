import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DayTab } from '../../atoms/Schedule/DayTab';
import { DayOfWeek } from '../../../../domain/entities/Activity';
import { DAYS_ORDER } from '../../../utils/scheduleUtils';

interface Props {
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
}

export function DaySelector({ selectedDay, onSelectDay }: Props) {
  return (
    <View style={s.content}>
      {DAYS_ORDER.map(day => (
        <DayTab key={day} day={day} isSelected={selectedDay === day} onPress={() => onSelectDay(day)} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
});