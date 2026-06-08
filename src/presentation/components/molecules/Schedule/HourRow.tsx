import { View, StyleSheet } from 'react-native';
import { HourLabel } from '../../atoms/Schedule/HourLabel';

export function HourRow({ hour, displayStart = 0, hourHeight = 56 }: { 
  hour: number;
  displayStart?: number;
  hourHeight?: number;
}) {
  return (
    <View style={[s.row, { top: (hour - displayStart) * hourHeight }]}>
      <HourLabel hour={hour} />
      <View style={s.line} />
    </View>
  );
}
const s = StyleSheet.create({
  row: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start' },
  line: { flex: 1, height: 0.5, backgroundColor: 'rgba(255, 255, 255, 0.1)', marginTop: 7 },
});