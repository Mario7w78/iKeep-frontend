// screens/schedule/ScheduleView.tsx
import { useState, useCallback, useEffect } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ScheduleHeader } from '../../components/organisms/Schedule/ScheduleHeader';
import { ScheduleGrid } from '../../components/organisms/Schedule/ScheduleGrid';
import { EnergyPicker } from '../../components/molecules/Energy/EnergyPicker';
import { Theme } from '../../components/theme/colors';
import { useScheduleStore } from '../../../di/Dependencies';
import {
  saveEnergyRecord,
  makeEnergyRecord,
  getEnergyHistory,
  hasReportedEnergyToday,
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
  const [needsDailyEnergy, setNeedsDailyEnergy] = useState(false);

  // Passive daily check: if schedule exists but no energy today, show prompt
  useEffect(() => {
    if (schedule) {
      hasReportedEnergyToday().then((reported) => {
        setNeedsDailyEnergy(!reported);
      });
    }
  }, [schedule]);

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

  const onQuickEnergy = useCallback(
    async (nivel: number) => {
      await saveEnergyRecord(makeEnergyRecord(nivel));
      setNeedsDailyEnergy(false);
    },
    [],
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
      {needsDailyEnergy && (
        <View style={s.energyBanner}>
          <Text style={s.energyBannerText}>¿Cómo está tu energía hoy?</Text>
          <View style={s.energyBannerOptions}>
            <TouchableOpacity
              style={s.energyBannerBtn}
              onPress={() => onQuickEnergy(1)}
            >
              <Text style={s.energyBannerEmoji}>😴</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.energyBannerBtn}
              onPress={() => onQuickEnergy(2)}
            >
              <Text style={s.energyBannerEmoji}>🙂</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.energyBannerBtn}
              onPress={() => onQuickEnergy(3)}
            >
              <Text style={s.energyBannerEmoji}>⚡</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScheduleHeader
        selectedDay={selectedDay}
        activityCount={items.length}
        onSelectDay={setSelectedDay}
      />
      <ScheduleGrid activities={items} />

      {/* Allow re-generation with energy picker */}
      <TouchableOpacity
        style={s.regenerateBtn}
        onPress={() => setShowEnergyPicker(true)}
      >
        <Text style={s.regenerateText}>Regenerar horario</Text>
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
  container: { flex: 1, backgroundColor: Theme.colors.screenBackground },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 32, backgroundColor: Theme.colors.screenBackground },
  emptyText: { fontSize: 15, color: Theme.colors.textSecondary },
  btn: { backgroundColor: Theme.colors.cardBackground, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 },
  btnText: { color: Theme.colors.surface, fontSize: 15, fontWeight: '500' },
  energyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.screenBackground,
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  energyBannerText: {
    fontSize: 14,
    color: Theme.colors.surface,
    fontWeight: '500',
  },
  energyBannerOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  energyBannerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  energyBannerEmoji: {
    fontSize: 18,
  },
  regenerateBtn: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  regenerateText: {
    color: Theme.colors.surface,
    fontSize: 15,
    fontWeight: '500',
  },
});