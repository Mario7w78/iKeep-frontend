import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
const VIAJE_COLOR = { bg: '#2D2416', border: '#C8963E', text: '#F5DEB3' };

interface Props {
  item: ScheduledActivity;
  onPress?: (item: ScheduledActivity) => void;
  displayStart?: number;
  hourHeight?: number;
  /**
   * Si la ventana del dia termina despues de medianoche (22:00 → 04:00).
   *
   * Sin este dato el bloque no puede distinguir "es de la madrugada del dia
   * siguiente" de "empieza un rato antes de que arranque el dia", y trataba
   * los dos casos igual.
   */
  cruzaMedianoche?: boolean;
}

export function ActivityBlock({
  item,
  onPress,
  displayStart = 0,
  hourHeight = 56,
  cruzaMedianoche = false,
}: Props) {
  let normalizedStart = hhmmToMinutes(item.assignedStartTime);
  let normalizedEnd = hhmmToMinutes(item.assignedEndTime);

  // Empezar antes de la hora de inicio del dia solo significa "madrugada del
  // dia siguiente" cuando la ventana cruza medianoche.
  //
  // Sin esa condicion, un traslado que arranca 07:30 para llegar 08:00 se
  // daba por madrugada y se corria 1440 minutos: mas de mil pixeles hacia
  // abajo, que es lo que descolocaba la lectura del calendario entero.
  if (cruzaMedianoche && normalizedStart < displayStart * 60) {
    normalizedStart += 1440;
  }
  if (normalizedEnd < normalizedStart) {
    normalizedEnd += 1440;
  }

  // Lo que empieza antes de la ventana se apoya en el borde superior en vez
  // de dibujarse fuera: recortado no se ve, y el usuario necesita saber que
  // tiene que salir antes de que su dia "empiece".
  const top = Math.max(((normalizedStart - displayStart * 60) / 60) * hourHeight, 0);
  const height = Math.max(((normalizedEnd - normalizedStart) / 60) * hourHeight - 4, 28);

  // VIAJE blocks — gray, non-interactive, no onPress
  if (item.tipo === 'viaje') {
    return (
      <View testID="activity-block" style={[s.block, { top, height, backgroundColor: VIAJE_COLOR.bg, borderLeftColor: VIAJE_COLOR.border, borderLeftWidth: 6, flexDirection: 'row', alignItems: 'center' }]}>
        <Ionicons name="car" size={16} color={VIAJE_COLOR.border} style={{ marginRight: 6 }} />
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: VIAJE_COLOR.text }]} numberOfLines={2}>
            {item.nombre ?? 'Traslado'}
          </Text>
          {height > 36 && (
            <Text style={[s.time, { color: VIAJE_COLOR.text }]}>
              {formatDisplayTime(item.assignedStartTime)} – {formatDisplayTime(item.assignedEndTime)}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Location-based travel blocks (existing behavior)
  if (!item.activity) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPress?.(item)}
        testID="activity-block"
        style={[s.block, { top, height, backgroundColor: TRAVEL_COLOR.bg, borderLeftColor: TRAVEL_COLOR.border, borderLeftWidth: 6, flexDirection: 'row', alignItems: 'center' }]}
      >
        <Ionicons name="car-outline" size={16} color={TRAVEL_COLOR.border} style={{ marginRight: 6 }} />
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: TRAVEL_COLOR.text }]} numberOfLines={1}>
            {item.nombre ?? 'Viaje (ubicación)'}
          </Text>
          {height > 36 && (
            <Text style={[s.time, { color: TRAVEL_COLOR.text }]}>
              {formatDisplayTime(item.assignedStartTime)} – {formatDisplayTime(item.assignedEndTime)}
            </Text>
          )}
        </View>
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
      testID="activity-block"
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
