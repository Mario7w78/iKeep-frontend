import { Text, StyleSheet } from 'react-native';
import { formatHour, LABEL_WIDTH } from '../../../utils/scheduleUtils';

export function HourLabel({ hour }: { hour: number }) {
  return <Text style={styles.label}>{formatHour(hour)}</Text>;
}
const styles = StyleSheet.create({
  label: { width: LABEL_WIDTH, fontSize: 11, color: '#aaa', textAlign: 'right', paddingRight: 8, marginTop: -7 },
});