import { View, Text, StyleSheet } from 'react-native';
import { ScheduledActivity } from '../../../../domain/entities/Schedule';
import { hhmmToMinutes, minutesToTop, durationToHeight, formatDisplayTime, LABEL_WIDTH } from '../../../utils/scheduleUtils';

const BLOCK_COLORS = [
  { bg: '#221A3D', border: '#5D4BB3', text: '#DDD6FF' },
  { bg: '#162A23', border: '#3C8D70', text: '#C8F2E2' },
  { bg: '#33240F', border: '#A86A1F', text: '#FFE3B8' },
  { bg: '#351D18', border: '#A65542', text: '#FFD5CB' },
];

interface Props {
  item: ScheduledActivity;
}

export function ActivityBlock({ item }: Props) {
  const startMin = hhmmToMinutes(item.assignedStartTime);
  const endMin   = hhmmToMinutes(item.assignedEndTime);
  const top    = minutesToTop(startMin);
  const height = durationToHeight(startMin, endMin);
  
  // Use a hash of the activity ID to ensure consistent color across different days
  const idNum = parseInt(item.activity.id.slice(-6), 10) || 0;
  const color = BLOCK_COLORS[idNum % BLOCK_COLORS.length];

  return (
    <View style={[s.block, { top, height, backgroundColor: color.bg, borderLeftColor: color.border }]}>
      <Text style={[s.title, { color: color.text }]} numberOfLines={1}>
        {item.activity.title}
      </Text>
      {height > 36 && (
        <Text style={[s.time, { color: color.text }]}>
          {formatDisplayTime(item.assignedStartTime)} – {formatDisplayTime(item.assignedEndTime)}
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  block: {
    position: 'absolute', left: LABEL_WIDTH + 4, right: 4,
    borderRadius: 8, borderLeftWidth: 3,
    paddingHorizontal: 8, paddingVertical: 4, overflow: 'hidden',
  },
  title: { fontSize: 13, fontWeight: '500' },
  time:  { fontSize: 11, marginTop: 2, opacity: 0.75 },
});