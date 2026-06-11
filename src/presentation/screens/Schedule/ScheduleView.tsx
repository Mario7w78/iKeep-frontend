// screens/schedule/ScheduleView.tsx
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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

function ChronologicalAgendaList({
  activities,
  onActivityPress,
}: {
  activities: ScheduledActivity[];
  onActivityPress: (item: ScheduledActivity) => void;
}) {
  if (activities.length === 0) {
    return (
      <View style={s.listEmptyContainer}>
        <Ionicons name="calendar-outline" size={48} color={Theme.colors.textSecondary} style={{ opacity: 0.5 }} />
        <Text style={s.listEmptyTitle}>No hay actividades</Text>
        <Text style={s.listEmptySubtitle}>No tienes ninguna actividad programada para este día.</Text>
      </View>
    );
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 5) return 'Alta';
    if (priority >= 3) return 'Media';
    return 'Baja';
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'baja': return 'Baja';
      case 'media': return 'Normal';
      case 'alta': return 'Alta';
      default: return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'baja': return Theme.comfyColors.green;
      case 'media': return Theme.comfyColors.yellow;
      case 'alta': return '#FF6B6B';
      default: return Theme.colors.surface;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return '#FF6B6B';
    if (priority >= 3) return Theme.comfyColors.skyBlue;
    return Theme.comfyColors.green;
  };

  const getIdentityIcon = (identity: string | undefined) => {
    switch (identity) {
      case 'clase': return 'school-outline';
      case 'trabajo': return 'briefcase-outline';
      default: return 'document-text-outline';
    }
  };

  const getIdentityColor = (identity: string | undefined) => {
    switch (identity) {
      case 'clase': return Theme.comfyColors.skyBlue;
      case 'trabajo': return Theme.comfyColors.orange;
      default: return Theme.comfyColors.green;
    }
  };

  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={s.listContent}
      showsVerticalScrollIndicator={false}
    >
      {activities.map((act, idx) => {
        const actActivity = act.activity;
        const isTravel = !actActivity;
        
        const iconName = isTravel ? 'car-outline' : getIdentityIcon(actActivity?.identity);
        const iconColor = isTravel ? '#8A9AAA' : getIdentityColor(actActivity?.identity);
        const title = actActivity?.title ?? act.nombre ?? (act.tipo === 'viaje' ? 'Traslado' : 'Actividad');
        
        return (
        <TouchableOpacity
          key={`${actActivity?.id ?? act.tipo ?? 'unknown'}-${act.day}-${act.assignedStartTime}-${idx}`}
          style={[s.listItem, isTravel && { opacity: 0.75, borderLeftColor: '#8A9AAA', borderLeftWidth: 4 }]}
          activeOpacity={isTravel ? 1 : 0.7}
          disabled={isTravel}
          onPress={() => onActivityPress(act)}
        >
            <View style={s.listItemHeader}>
            <View style={[s.listItemIconWrapper, { backgroundColor: iconColor + '20' }]}>
              <Ionicons name={iconName} size={18} color={iconColor} />
            </View>
            <Text style={[s.listItemTitle, isTravel && { color: '#8A9AAA' }]} numberOfLines={1}>
              {title}
            </Text>
          </View>

          <View style={s.listItemDivider} />

          <View style={s.listItemDetails}>
            <View style={s.detailRow}>
              <Ionicons name="time-outline" size={14} color={Theme.comfyColors.skyBlue} />
              <Text style={s.detailTimeText}>
                {act.assignedStartTime} - {act.assignedEndTime}
              </Text>
            </View>

            {actActivity && (
            <View style={s.listItemBadges}>
              <View style={[s.listBadge, { borderColor: getPriorityColor(actActivity.priority) + '30', backgroundColor: getPriorityColor(actActivity.priority) + '10' }]}>
                <Ionicons name="flag" size={12} color={getPriorityColor(actActivity.priority)} />
                <Text style={[s.listBadgeText, { color: getPriorityColor(actActivity.priority) }]}>
                  Prioridad {getPriorityLabel(actActivity.priority)}
                </Text>
              </View>

              <View style={[s.listBadge, { borderColor: getDifficultyColor(actActivity.difficulty) + '30', backgroundColor: getDifficultyColor(actActivity.difficulty) + '10' }]}>
                <Ionicons name="speedometer-outline" size={12} color={getDifficultyColor(actActivity.difficulty)} />
                <Text style={[s.listBadgeText, { color: getDifficultyColor(actActivity.difficulty) }]}>
                  Dificultad {getDifficultyLabel(actActivity.difficulty)}
                </Text>
              </View>
            </View>
            )}
          </View>
        </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

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
    startHour,
    endHour,
    perDayStartHours,
    perDayEndHours,
  } = useScheduleStore();

  // Effective display hours for the selected day (per-day or global fallback)
  const dayIndex = DAYS_ORDER.indexOf(selectedDay);
  const displayStartHour = useMemo(
    () => (perDayStartHours?.[dayIndex] ?? startHour),
    [perDayStartHours, dayIndex, startHour]
  );
  const displayEndHour = useMemo(
    () => (perDayEndHours?.[dayIndex] ?? endHour),
    [perDayEndHours, dayIndex, endHour]
  );

  const [showEnergyPicker, setShowEnergyPicker] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ScheduledActivity | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const horizontalScrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(0);
  const isProgrammaticScroll = useRef(false);

  const handleScroll = (e: any) => {
    scrollX.current = e.nativeEvent.contentOffset.x;
  };

  const changeSelectedDayProgrammatically = useCallback((day: any) => {
    isProgrammaticScroll.current = true;
    setSelectedDay(day);
  }, [setSelectedDay]);

  const handlePageChange = useCallback((e: any) => {
    if (isProgrammaticScroll.current) {
      isProgrammaticScroll.current = false;
      return;
    }
    const contentOffset = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / SCREEN_WIDTH);
    const newDay = DAYS_ORDER[index];
    if (newDay && newDay !== selectedDay) {
      setSelectedDay(newDay as any);
    }
  }, [selectedDay, setSelectedDay]);

  useFocusEffect(
    useCallback(() => {
      const today = JS_DAY_TO_DAYOFWEEK[new Date().getDay()];
      changeSelectedDayProgrammatically(today);
    }, [changeSelectedDayProgrammatically])
  );

  // Sync scroll position when selectedDay changes (e.g. from header tabs)
  useEffect(() => {
    if (!isProgrammaticScroll.current) {
      return;
    }
    const pageIndex = DAYS_ORDER.indexOf(selectedDay);
    if (pageIndex !== -1) {
      const targetX = pageIndex * SCREEN_WIDTH;
      if (Math.abs(scrollX.current - targetX) > 10) {
        horizontalScrollRef.current?.scrollTo({ x: targetX, animated: true });
      } else {
        isProgrammaticScroll.current = false;
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
      }, true);
    },
    [handleGenerateSchedule],
  );

  const showEmptyState = !schedule || schedule.getAllItems().length === 0;

  return (
    <View style={s.container}>
      {showEmptyState ? (
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
        </View>
      ) : (
        <View style={s.container}>
          <ScheduleHeader
            selectedDay={selectedDay}
            activityCount={items.length}
            onSelectDay={changeSelectedDayProgrammatically}
            onRefresh={() => setShowEnergyPicker(true)}
            viewMode={viewMode}
            onToggleViewMode={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
          />
          
          <ScrollView
            ref={horizontalScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handlePageChange}
            style={{ flex: 1 }}
          >
            {DAYS_ORDER.map((day) => {
              const loopDayIndex = DAYS_ORDER.indexOf(day);
              const loopDisplayStartHour = perDayStartHours?.[loopDayIndex] ?? startHour;
              const dayItems = schedule.getItemsByDay(day as any, loopDisplayStartHour);
              return (
                <View key={day} style={{ width: SCREEN_WIDTH, flex: 1, paddingVertical: 8, paddingHorizontal: 4 }}>
                  {viewMode === 'grid' ? (
                    <ScheduleGrid 
                      activities={dayItems} 
                      isToday={day === JS_DAY_TO_DAYOFWEEK[new Date().getDay()]} 
                      onActivityPress={setSelectedActivity}
                      startHour={displayStartHour}
                      endHour={displayEndHour}
                    />
                  ) : (
                    <ChronologicalAgendaList
                      activities={dayItems}
                      onActivityPress={setSelectedActivity}
                    />
                  )}
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={s.fabCreateBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("CreateActivityModal")}
          >
            <Ionicons name="add" size={32} color={Theme.comfyFontColors.green} />
          </TouchableOpacity>
        </View>
      )}

      {isLoading && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color={Theme.colors.iconPrimary} />
          <Text style={s.loadingText}>Generando horario...</Text>
        </View>
      )}

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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 11, 18, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    zIndex: 999,
  },
  loadingText: {
    color: Theme.colors.surface,
    fontSize: 15,
    fontWeight: '700',
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
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 80,
  },
  listItem: {
    backgroundColor: Theme.colors.cardBackground,
    borderColor: Theme.colors.cardBorder,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  listItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  listItemIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.surface,
    flex: 1,
  },
  listItemDivider: {
    height: 1,
    backgroundColor: Theme.colors.cardBorder,
    opacity: 0.5,
  },
  listItemDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailTimeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#a8a9bb',
  },
  listItemBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  listBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  listBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  listEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  listEmptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.surface,
    textAlign: 'center',
  },
  listEmptySubtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});