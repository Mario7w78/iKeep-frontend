import { View, StyleSheet } from 'react-native';
import { HourLabel } from '../../atoms/Schedule/HourLabel';
import { HOUR_HEIGHT, START_HOUR } from '../../../utils/scheduleUtils';

export function HourRow({ hour }: { hour: number }) {
  return (
    <View style={[s.row, { top: (hour - START_HOUR) * HOUR_HEIGHT }]}>
      <HourLabel hour={hour} />
      <View style={s.line} />
    </View>
  );
}
const s = StyleSheet.create({
  row: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start' },
  line: { flex: 1, height: 0.5, backgroundColor: 'rgba(0,0,0,0.08)', marginTop: 7 },
});