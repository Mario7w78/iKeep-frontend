// screens/schedule/ScheduleView.tsx
import { View, ActivityIndicator, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ScheduleHeader } from '../../components/organisms/Schedule/ScheduleHeader';
import { ScheduleGrid } from '../../components/organisms/Schedule/ScheduleGrid';
import { Theme } from '../../components/theme/colors';
import { useScheduleStore } from '../../../infrastructure/store/useScheduleStore';

export default function ScheduleView() {
  const {
    activitiesForDay,
    handleGenerateSchedule,
    isLoading,
    schedule,
    selectedDay,
    setSelectedDay
  } = useScheduleStore();

  const items = activitiesForDay();

  if (isLoading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={Theme.colors.primary} />
    </View>
  );

  if (!schedule) return (
    <View style={s.center}>
      <Text style={s.emptyText}>No hay horario generado aún</Text>
      <TouchableOpacity style={s.btn} onPress={handleGenerateSchedule}>
        <Text style={s.btnText}>Generar horario</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.container}>
      <ScheduleHeader
        selectedDay={selectedDay}
        activityCount={activitiesForDay.length}
        onSelectDay={setSelectedDay}
      />
      <ScheduleGrid activities={items} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32, backgroundColor: Theme.colors.background },
  emptyText: { fontSize: 15, color: '#666' },
  btn: { backgroundColor: Theme.colors.primary, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '500' },
});