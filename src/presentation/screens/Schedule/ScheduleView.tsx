// screens/schedule/ScheduleView.tsx
import { useState, useCallback, useEffect } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScheduleHeader } from '../../components/organisms/Schedule/ScheduleHeader';
import { ScheduleGrid } from '../../components/organisms/Schedule/ScheduleGrid';
import { EnergyPicker } from '../../components/molecules/Energy/EnergyPicker';
import { Theme } from '../../components/theme/colors';
import { useScheduleStore } from '../../../di/Dependencies';
import {
  saveEnergyRecord,
  makeEnergyRecord,
  getEnergyHistory,
} from '../../../infrastructure/persistence/EnergyHistoryService';

export default function ScheduleView() {
  const {
    activitiesForDay,
    handleGenerateSchedule,
    isLoading,
    schedule,
    selectedDay,
    setSelectedDay,
  } = useScheduleStore();

  const [showEnergyPicker, setShowEnergyPicker] = useState(false);

  const items = activitiesForDay();

  const onGenerateWithEnergy = useCallback(
    async (nivel: number) => {
      setShowEnergyPicker(false);

      // Save the record and get history
      await saveEnergyRecord(makeEnergyRecord(nivel));
      const historial = await getEnergyHistory(14);

      // Call the store with energy data
      await handleGenerateSchedule({
        nivel_energia: nivel,
        historial_energia: historial,
      });
    },
    [handleGenerateSchedule],
  );

  if (isLoading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={Theme.colors.iconPrimary} />
    </View>
  );

  if (!schedule) return (
    <View style={s.center}>
      <Text style={s.emptyText}>No hay horario generado aún</Text>
      <TouchableOpacity
        style={s.btn}
        onPress={() => setShowEnergyPicker(true)}
      >
        <Text style={s.btnText}>Generar horario</Text>
      </TouchableOpacity>

      <EnergyPicker
        visible={showEnergyPicker}
        onSelect={onGenerateWithEnergy}
        onCancel={() => setShowEnergyPicker(false)}
      />
    </View>
  );

  return (
    <View style={s.container}>
      <ScheduleHeader
        selectedDay={selectedDay}
        activityCount={items.length}
        onSelectDay={setSelectedDay}
      />
      <ScheduleGrid activities={items} />

      {/* FAB to re-generate with energy picker */}
      <TouchableOpacity
        style={s.fabBtn}
        activeOpacity={0.8}
        onPress={() => setShowEnergyPicker(true)}
      >
        <Ionicons name="refresh" size={24} color={Theme.comfyFontColors.green} />
      </TouchableOpacity>

      <EnergyPicker
        visible={showEnergyPicker}
        onSelect={onGenerateWithEnergy}
        onCancel={() => setShowEnergyPicker(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1F212C' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32, backgroundColor: '#1F212C' },
  emptyText: { fontSize: 15, color: Theme.colors.textSecondary },
  btn: { backgroundColor: Theme.colors.cardBackground, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 },
  btnText: { color: Theme.colors.surface, fontSize: 15, fontWeight: '500' },
  fabBtn: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.comfyColors.green,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});