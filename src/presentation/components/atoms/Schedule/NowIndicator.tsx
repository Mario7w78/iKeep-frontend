// atoms/NowIndicator.tsx
import { View, StyleSheet } from 'react-native';
import { LABEL_WIDTH } from '../../../utils/scheduleUtils';

export function NowIndicator({ top }: { top: number }) {
  return (
    <>
      <View style={[s.dot, { top: top - 3 }]} />
      <View style={[s.line, { top }]} />
    </>
  );
}
const s = StyleSheet.create({
  dot: { position: 'absolute', left: LABEL_WIDTH - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: '#E24B4A' },
  line: { position: 'absolute', left: LABEL_WIDTH, right: 0, height: 2, backgroundColor: '#E24B4A' },
});