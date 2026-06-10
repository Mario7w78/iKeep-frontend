import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { ScheduledActivity } from '../../../../domain/entities/Schedule';
import { hhmmToMinutes, formatDisplayTime, LABEL_WIDTH } from '../../../utils/scheduleUtils';

const BLOCK_COLORS = [
  { bg: '#221A3D', border: '#5D4BB3', text: '#DDD6FF' },
  { bg: '#162A23', border: '#3C8D70', text: '#C8F2E2' },
  { bg: '#33240F', border: '#A86A1F', text: '#FFE3B8' },
  { bg: '#351D18', border: '#A65542', text: '#FFD5CB' },
  { bg: '#1D2B3A', border: '#4A8DB5', text: '#C5E4F7' },
  { bg: '#2A1D34', border: '#915EB5', text: '#E4CEF7' },
  { bg: '#1A2D28', border: '#3E9E7A', text: '#C8F0DF' },
  { bg: '#352713', border: '#B87A2E', text: '#FDE8C4' },
  { bg: '#2C1A1A', border: '#B54A4A', text: '#F7CECE' },
  { bg: '#1E2233', border: '#6674CC', text: '#D5DBF5' },
];

const TRAVEL_COLOR = { bg: '#1A1D22', border: '#5A6A7A', text: '#8A9AAA' };
const VIAJE_COLOR = { bg: '#161719', border: '#3D4145', text: '#6B7280' };

interface Props {
  item: ScheduledActivity;
  onPress?: (item: ScheduledActivity) => void;
  displayStart?: number;
  hourHeight?: number;
}

export function ActivityBlock({ item, onPress, displayStart = 0, hourHeight = 56 }: Props) {
  let normalizedStart = hhmmToMinutes(item.assignedStartTime);
  let normalizedEnd = hhmmToMinutes(item.assignedEndTime);

  // If the activity starts before the day start hour, it belongs to the post-midnight segment of the crossing day
  if (normalizedStart < displayStart * 60) {
    normalizedStart += 1440;
  }
  // If the activity crosses midnight or is scheduled in the post-midnight segment, adjust end time accordingly
  if (normalizedEnd < normalizedStart) {
    normalizedEnd += 1440;
  }

  const top = ((normalizedStart - displayStart * 60) / 60) * hourHeight;
  const height = Math.max(((normalizedEnd - normalizedStart) / 60) * hourHeight - 4, 28);

  // VIAJE blocks — gray, non-interactive, no onPress
  if (!item.activity && item.tipo === 'viaje') {
    return (
      <View style={[s.block, { top, height, backgroundColor: VIAJE_COLOR.bg, borderLeftColor: VIAJE_COLOR.border }]}>
        <Text style={[s.title, { color: VIAJE_COLOR.text }]} numberOfLines={1}>
          {item.nombre ?? 'Traslado'}
        </Text>
        {height > 36 && (
          <Text style={[s.time, { color: VIAJE_COLOR.text }]}>
            {formatDisplayTime(item.assignedStartTime)} – {formatDisplayTime(item.assignedEndTime)}
          </Text>
        )}
      </View>
    );
  }

  // Location-based travel blocks (existing behavior)
  if (!item.activity) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPress?.(item)}
        style={[s.block, { top, height, backgroundColor: TRAVEL_COLOR.bg, borderLeftColor: TRAVEL_COLOR.border }]}
      >
        <Text style={[s.title, { color: TRAVEL_COLOR.text }]} numberOfLines={1}>
          Viaje (ubicación)
        </Text>
        {height > 36 && (
          <Text style={[s.time, { color: TRAVEL_COLOR.text }]}>
            {formatDisplayTime(item.assignedStartTime)} – {formatDisplayTime(item.assignedEndTime)}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  // Use a hash of the activity ID to ensure consistent color across different days
  const idNum = parseInt(item.activity.id.slice(-6), 10) || 0;
  const color = BLOCK_COLORS[idNum % BLOCK_COLORS.length];

  return (
    <TouchableOpacity 
      activeOpacity={0.85}
      onPress={() => onPress?.(item)}
      style={[s.block, { top, height, backgroundColor: color.bg, borderLeftColor: color.border }]}
    >
      <Text style={[s.title, { color: color.text }]} numberOfLines={1}>
        {item.activity.title}
      </Text>
      {height > 36 && (
        <Text style={[s.time, { color: color.text }]}>
          {formatDisplayTime(item.assignedStartTime)} – {formatDisplayTime(item.assignedEndTime)}
        </Text>
      )}
    </TouchableOpacity>
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
