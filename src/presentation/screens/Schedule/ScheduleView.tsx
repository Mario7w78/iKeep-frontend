// screens/schedule/ScheduleView.tsx
import { useState, useCallback, useEffect, useRef } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ScheduleHeader } from '../../components/organisms/Schedule/ScheduleHeader';
import { ScheduleGrid } from '../../components/organisms/Schedule/ScheduleGrid';
import { EnergyPicker } from '../../components/molecules/Energy/EnergyPicker';
import { ActivityDetailModal } from '../../components/organisms/Schedule/ActivityDetailModal';
import { Theme } from '../../components/theme/colors';
import { useScheduleStore } from '../../../di/Dependencies';
import { JS_DAY_TO_DAYOFWEEK } from '../../utils/scheduleUtils';
import { ScheduledActivity } from '../../../domain/entities/Schedule';
import {
  saveEnergyRecord,
  makeEnergyRecord,
  getEnergyHistory,
} from '../../../infrastructure/persistence/EnergyHistoryService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAYS_ORDER = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

export default function ScheduleView() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const {
    activitiesForDay,
    handleGenerateSchedule,
    isLoading,
    schedule,
    selectedDay,
    setSelectedDay,
  } = useScheduleStore();

  const [showEnergyPicker, setShowEnergyPicker] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ScheduledActivity | null>(null);

  const horizontalScrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(0);

  const handleScroll = (e: any) => {
    scrollX.current = e.nativeEvent.contentOffset.x;
  };

  const handleHorizontalScrollEnd = (e: any) => {
    const contentOffset = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / SCREEN_WIDTH);
    const newDay = DAYS_ORDER[index];
    if (newDay && newDay !== selectedDay) {
      setSelectedDay(newDay as any);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const today = JS_DAY_TO_DAYOFWEEK[new Date().getDay()];
      setSelectedDay(today);
    }, [setSelectedDay])
  );

  // Sync scroll position when selectedDay changes (e.g. from header tabs)
  useEffect(() => {
    const pageIndex = DAYS_ORDER.indexOf(selectedDay);
    if (pageIndex !== -1) {
      const targetX = pageIndex * SCREEN_WIDTH;
      if (Math.abs(scrollX.current - targetX) > 10) {
        horizontalScrollRef.current?.scrollTo({ x: targetX, animated: true });
      }
    }
  }, [selectedDay]);

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
      <View style={s.emptyIcon}>
        <Ionicons name="calendar-outline" size={54} color={Theme.comfyColors.yellow} />
      </View>
      <Text style={s.emptyTitle}>Sin horario generado aún</Text>
      <Text style={s.emptyText}>
        Generá tu horario para acomodar y organizar tus actividades según tu energía.
      </Text>
      <TouchableOpacity
        style={s.btn}
        activeOpacity={0.8}
        onPress={() => setShowEnergyPicker(true)}
      >
        <Ionicons name="sparkles" size={18} color={Theme.comfyFontColors.green} />
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
        onRefresh={() => setShowEnergyPicker(true)}
      />
      
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleHorizontalScrollEnd}
        style={{ flex: 1 }}
      >
        {DAYS_ORDER.map((day) => {
          const dayItems = schedule.getItemsByDay(day as any);
          return (
            <View key={day} style={{ width: SCREEN_WIDTH }}>
              <ScheduleGrid 
                activities={dayItems} 
                isToday={day === JS_DAY_TO_DAYOFWEEK[new Date().getDay()]} 
                onActivityPress={setSelectedActivity}
              />
            </View>
          );
        })}
      </ScrollView>

      {/* FAB to create activity */}
      <TouchableOpacity
        style={s.fabCreateBtn}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("CreateActivityModal")}
      >
        <Ionicons name="add" size={32} color={Theme.comfyFontColors.green} />
      </TouchableOpacity>

      <EnergyPicker
        visible={showEnergyPicker}
        onSelect={onGenerateWithEnergy}
        onCancel={() => setShowEnergyPicker(false)}
      />

      <ActivityDetailModal
        visible={selectedActivity !== null}
        activityItem={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.screenBackground },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    padding: 32,
    backgroundColor: Theme.colors.screenBackground,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(233, 200, 74, 0.15)",
    borderColor: Theme.comfyColors.yellow,
    borderWidth: 2,
    borderStyle: "dashed",
    marginBottom: 8,
  },
  emptyTitle: {
    color: Theme.colors.surface,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    color: Theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: Theme.comfyColors.green,
    borderRadius: 18,
    paddingHorizontal: 28,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnText: {
    color: Theme.comfyFontColors.green,
    fontSize: 16,
    fontWeight: "900",
  },
  fabCreateBtn: {
    position: "absolute",
    bottom: 16,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.comfyColors.green,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
});