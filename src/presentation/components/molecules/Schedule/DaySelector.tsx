import { ScrollView, StyleSheet } from 'react-native';
import { DayTab } from '../../atoms/Schedule/DayTab';
import { DayOfWeek } from '../../../../domain/entities/Activity';
import { DAYS_ORDER } from '../../../utils/scheduleUtils';

interface Props {
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
}

export function DaySelector({ selectedDay, onSelectDay }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.content}>
      {DAYS_ORDER.map(day => (
        <DayTab key={day} day={day} isSelected={selectedDay === day} onPress={() => onSelectDay(day)} />
      ))}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  content: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
});