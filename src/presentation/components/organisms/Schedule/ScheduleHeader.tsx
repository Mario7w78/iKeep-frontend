// organisms/ScheduleHeader.tsx
import { View, Text, StyleSheet } from 'react-native';
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
      <View style={s.row}>
        <Text style={s.title}>{selectedDay}</Text>
        <View style={s.badge}>
          <Text style={s.badgeText}>{activityCount} actividades</Text>
        </View>
      </View>
      <DaySelector selectedDay={selectedDay} onSelectDay={onSelectDay} />
    </View>
  );
}
const s = StyleSheet.create({
  header: { backgroundColor: Theme.colors.primary, paddingTop: 52, paddingBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '500', color: '#fff' },
  badge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, color: '#fff' },
});