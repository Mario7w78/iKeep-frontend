import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { DayOfWeek } from '../../../../domain/entities/Activity';
import { DAYS_SHORT } from '../../../utils/scheduleUtils';
import { Theme } from '../../theme/colors';

interface Props {
  day: DayOfWeek;
  isSelected: boolean;
  onPress: () => void;
}

export function DayTab({ day, isSelected, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.tab, isSelected && s.tabActive]}>
      <Text style={[s.text, isSelected && s.textActive]}>{DAYS_SHORT[day]}</Text>
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' },
  tabActive: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  text: { fontSize: 13, color: '#888' },
  textActive: { color: '#fff', fontWeight: '500' },
});