import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DaySelector } from '../../molecules/Schedule/DaySelector';
import { DayOfWeek } from '../../../../domain/entities/Activity';
import { Theme } from '../../theme/colors';

interface Props {
  selectedDay: DayOfWeek;
  activityCount: number;
  onSelectDay: (day: DayOfWeek) => void;
}

export function ScheduleHeader({ selectedDay, activityCount, onSelectDay }: Props) {
  return (
    <View style={s.header}>
      <View style={s.titleBlock}>
        <Text style={s.title}>{selectedDay.toUpperCase()}</Text>
        <View style={s.activityCountRow}>
          <Ionicons name="flash" size={16} color="#8EC5FF" />
          <Text style={s.activityCountText}>
            {activityCount} {activityCount === 1 ? 'actividad' : 'actividades'}
          </Text>
        </View>
      </View>
      <DaySelector selectedDay={selectedDay} onSelectDay={onSelectDay} />
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: '#1F212C',
    paddingTop: 52,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(21, 93, 252, 0.2)', // Glowing blue bottom border
  },
  titleBlock: {
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  activityCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityCountText: {
    fontSize: 14,
    color: '#98FF60', // Comfy green
    fontWeight: '800',
  },
});