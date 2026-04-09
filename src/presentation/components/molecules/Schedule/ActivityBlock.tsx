import { View, Text, StyleSheet } from 'react-native';
import { ScheduledActivity } from '../../../../domain/entities/Schedule';
import { hhmmToMinutes, minutesToTop, durationToHeight, formatDisplayTime, LABEL_WIDTH } from '../../../utils/scheduleUtils';
import { LIGHT_COLORS, DARK_COLORS } from '../../theme/colors';

interface Props {
  item: ScheduledActivity;
  colorIndex: number;
}

export function ActivityBlock({ item, colorIndex }: Props) {
  const startMin = hhmmToMinutes(item.assignedStartTime);
  const endMin   = hhmmToMinutes(item.assignedEndTime);
  const top    = minutesToTop(startMin);
  const height = durationToHeight(startMin, endMin);
  const color  = DARK_COLORS[colorIndex % DARK_COLORS.length];

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