import React, { useMemo, useState, useEffect } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useActivityStore, useScheduleStore } from "../../../di/Dependencies";
import { ScheduledActivity } from "../../../domain/entities/Schedule";
import { JS_DAY_TO_DAYOFWEEK } from "../../utils/scheduleUtils";
import { Theme } from "../../components/theme/colors";
import { SAPO_BASE64 } from "../../components/sapoBase64";
import { ActivityDetailModal } from "../../components/organisms/Schedule/ActivityDetailModal";
import {
  saveEnergyRecord,
  makeEnergyRecord,
  getEnergyHistory,
} from "../../../infrastructure/persistence/EnergyHistoryService";

const ENERGY_LEVELS = [
  {
    label: "Baja energia",
    color: Theme.comfyColors.yellow,
    icon: "battery-dead",
    iconColor: Theme.comfyColors.yellow,
    gradient: ["#34364d", "#4c4832"] as const,
  },
  {
    label: "Energia estable",
    color: Theme.comfyColors.green,
    icon: "battery-half",
    iconColor: Theme.comfyColors.green,
    gradient: ["#34364d", "#2d3d33"] as const,
  },
  {
    label: "Alta energia",
    color: Theme.comfyColors.skyBlue,
    icon: "flash",
    iconColor: Theme.comfyColors.skyBlue,
    gradient: ["#34364d", "#2c344d"] as const,
  },
];

const dayFormatter = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}



export default function HomeView() {
  const navigation = useNavigation<any>();
  const schedule = useScheduleStore((s) => s.schedule);
  const isLoadedFromStorage = useScheduleStore((s) => s.isLoadedFromStorage);
  const handleGenerateSchedule = useScheduleStore((s) => s.handleGenerateSchedule);
  const activities = useActivityStore((s) => s.activities);
  const loadActivities = useActivityStore((s) => s.loadActivities);
  const [energyIndex, setEnergyIndex] = useState(0);
  const [savedEnergyIndex, setSavedEnergyIndex] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<ScheduledActivity | null>(null);

  // Initialize energy level from local storage history on mount
  useEffect(() => {
    const initEnergy = async () => {
      try {
        const history = await getEnergyHistory(1);
        if (history.length > 0) {
          const latest = history[history.length - 1];
          const idx = latest.nivel - 1;
          if (idx >= 0 && idx < ENERGY_LEVELS.length) {
            setEnergyIndex(idx);
            setSavedEnergyIndex(idx);
          }
        } else {
          setEnergyIndex(1); // Default to stable (index 1)
          setSavedEnergyIndex(1);
        }
      } catch (e) {
        console.error("Error loading energy history:", e);
      }
    };
    initEnergy();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadActivities();
    }, [loadActivities]),
  );

  useEffect(() => {
    if (isLoadedFromStorage && activities.length > 0 && schedule === null) {
      handleGenerateSchedule();
    }
  }, [isLoadedFromStorage, activities, schedule, handleGenerateSchedule]);

  const todayItems = useMemo(() => {
    const today = JS_DAY_TO_DAYOFWEEK[new Date().getDay()];
    return schedule?.getItemsByDay(today) ?? [];
  }, [schedule]);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const currentMinutes = useMemo(() => {
    return currentTime.getHours() * 60 + currentTime.getMinutes();
  }, [currentTime]);

  const currentActivity = useMemo(() => {
    return todayItems.find((item) => {
      const start = toMinutes(item.assignedStartTime);
      const end = toMinutes(item.assignedEndTime);
      return currentMinutes >= start && currentMinutes <= end;
    });
  }, [todayItems, currentMinutes]);

  const nextActivities = useMemo(() => {
    return todayItems.filter((item) => {
      const start = toMinutes(item.assignedStartTime);
      return start > currentMinutes;
    });
  }, [todayItems, currentMinutes]);

  const firstNext = nextActivities[0];

  const minutesLeft = useMemo(() => {
    if (!currentActivity) return null;
    return Math.max(toMinutes(currentActivity.assignedEndTime) - currentMinutes, 0);
  }, [currentActivity, currentMinutes]);

  const selectedEnergy = ENERGY_LEVELS[energyIndex];

  const moveEnergy = (direction: -1 | 1) => {
    setEnergyIndex((current) => {
      const next = current + direction;
      if (next < 0) return ENERGY_LEVELS.length - 1;
      if (next >= ENERGY_LEVELS.length) return 0;
      return next;
    });
  };

  const handleSaveEnergy = () => {
    Alert.alert(
      "Actualizar horario",
      `¿Estás seguro de que querés actualizar tu horario para adaptarlo a un nivel de "${selectedEnergy.label.toLowerCase()}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => {
            // Revert back to the saved state
            setEnergyIndex(savedEnergyIndex);
          },
        },
        {
          text: "Sí, actualizar",
          style: "default",
          onPress: async () => {
            setSavedEnergyIndex(energyIndex);
            try {
              const nivel = energyIndex + 1;
              await saveEnergyRecord(makeEnergyRecord(nivel));
              const historial = await getEnergyHistory(14);
              await handleGenerateSchedule({
                nivel_energia: nivel,
                historial_energia: historial,
              });
            } catch (e) {
              console.error("Error updating schedule with energy:", e);
            }
          },
        },
      ]
    );
  };



  const getIdentityLabel = (val?: string) => {
    switch (val) {
      case "clase": return "Clase";
      case "trabajo": return "Trabajo";
      default: return "Tarea";
    }
  };

  const cardStatus = currentActivity
    ? {
        pill: "En curso",
        pillColor: Theme.comfyColors.green,
        pillText: Theme.comfyFontColors.green,
        label: getIdentityLabel(currentActivity.activity.identity),
      }
    : firstNext
    ? {
        pill: "Siguiente",
        pillColor: Theme.comfyColors.skyBlue,
        pillText: Theme.comfyFontColors.skyBlue,
        label: getIdentityLabel(firstNext.activity.identity),
      }
    : {
        pill: "Libre",
        pillColor: Theme.colors.cardBorder,
        pillText: Theme.colors.surface,
        label: "",
      };

  const currentCardTitle = currentActivity
    ? currentActivity.activity.title
    : firstNext
    ? firstNext.activity.title
    : "Sin actividades pendientes";

  const formatMinutesRemaining = (minutes: number | null) => {
    if (minutes === null) return "--";
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };



  if (!activities.length) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={44} color={Theme.colors.iconPrimary} />
          </View>
          <Text style={styles.emptyTitle}>No hay actividades</Text>
          <Text style={styles.emptyDescription}>
            Crea tu primera actividad para que iKeep pueda armar tu horario.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("CreateActivityModal")}
          >
            <Ionicons name="add" size={22} color={Theme.comfyFontColors.green} />
            <Text style={styles.emptyButtonText}>Crear actividad</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.mascot}>
            <Image
              source={{ uri: SAPO_BASE64 }}
              style={styles.sapoMascotImage}
            />
          </View>
          <View>
            <Text style={styles.title}>Hola, Mario. Tu día está listo.</Text>
            <Text style={styles.date}>{dayFormatter.format(new Date())}</Text>
          </View>
        </View>

        <LinearGradient
          colors={selectedEnergy.gradient}
          style={[styles.card, styles.energyCard]}
        >
          <Text style={styles.cardTitle}>¿Cómo está tu nivel de energía hoy?</Text>
          <View style={styles.energySelector}>
            <Pressable onPress={() => moveEnergy(-1)} hitSlop={12}>
              <Ionicons name="chevron-back" size={34} color={Theme.colors.surface} />
            </Pressable>
            <View style={styles.energyOrb}>
              <Ionicons 
                name={selectedEnergy.icon as any} 
                size={40} 
                color={selectedEnergy.iconColor} 
              />
            </View>
            <Pressable onPress={() => moveEnergy(1)} hitSlop={12}>
              <Ionicons name="chevron-forward" size={34} color={Theme.colors.surface} />
            </Pressable>
          </View>
          <Text style={styles.energyLabel}>{selectedEnergy.label}</Text>

          {/* Guardar Button */}
          {energyIndex !== savedEnergyIndex && (
            <TouchableOpacity
              style={[
                styles.saveEnergyButton,
                { backgroundColor: selectedEnergy.iconColor },
              ]}
              activeOpacity={0.8}
              onPress={handleSaveEnergy}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={Theme.colors.screenBackground}
              />
              <Text style={styles.saveEnergyButtonText}>Guardar</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        <TouchableOpacity 
          style={styles.card}
          activeOpacity={0.75}
          onPress={() => (currentActivity || firstNext) && setSelectedActivity(currentActivity || firstNext)}
          disabled={!currentActivity && !firstNext}
        >
          <View style={styles.statusRow}>
            <View style={[styles.statusPill, { backgroundColor: cardStatus.pillColor }]}>
              <Text style={[styles.statusText, { color: cardStatus.pillText }]}>
                {cardStatus.pill}
              </Text>
            </View>
            {cardStatus.label !== "" && (
              <Text style={styles.classLabel}>{cardStatus.label}</Text>
            )}
          </View>
          <Text style={styles.currentTitle}>
            {currentCardTitle}
          </Text>
          {currentActivity ? (
            <View style={styles.timerRow}>
              <Text style={styles.timerText}>
                {formatMinutesRemaining(minutesLeft)}
              </Text>
              <Text style={styles.timerLabel}>restantes</Text>
            </View>
          ) : firstNext ? (
            <View style={styles.timerRow}>
              <Text style={[styles.timerText, { color: Theme.comfyColors.skyBlue }]}>
                {firstNext.assignedStartTime}
              </Text>
              <Text style={styles.timerLabel}>hora de inicio</Text>
            </View>
          ) : (
            <View style={styles.timerRow}>
              <Text style={[styles.timerText, { color: Theme.comfyColors.green }]}>
                Listo
              </Text>
              <Text style={styles.timerLabel}>¡Día completado!</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.changeTitle}>¿Algo cambió hoy?</Text>
          <Text style={styles.changeSubtitle}>
            Crea una actividad o administra las que ya tienes
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.75}
            onPress={() => navigation.navigate("CreateActivityModal")}
          >
            <Ionicons name="add-circle-outline" size={20} color={Theme.colors.surface} />
            <Text style={styles.actionText}>Crear nueva actividad</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.75}
            onPress={() => navigation.navigate("ManageActivities")}
          >
            <Ionicons name="list-outline" size={20} color={Theme.colors.surface} />
            <Text style={styles.actionText}>Ver mis actividades</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleSection}>
          <Text style={styles.sectionTitle}>PRÓXIMO EN TU HORARIO</Text>
          <View style={styles.timeline}>
            {nextActivities.length > 0 ? (
              nextActivities.slice(0, 3).map((item, index) => (
                <TouchableOpacity 
                  key={`${item.activity.id}-${index}`} 
                  style={styles.nextCard}
                  activeOpacity={0.75}
                  onPress={() => setSelectedActivity(item)}
                >
                  <View>
                    <Text style={styles.nextTime}>
                      {item.assignedStartTime} - {item.assignedEndTime}
                    </Text>
                    <Text style={styles.nextTitle}>{item.activity.title}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Theme.colors.iconSecondary} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.nextCard}>
                <View>
                  <Text style={styles.nextTime}>
                    {todayItems.length > 0 ? "Día completado" : "Sin bloques programados"}
                  </Text>
                  <Text style={styles.nextTitle}>
                    {todayItems.length > 0 ? "¡Terminaste por hoy!" : "Genera tu horario"}
                  </Text>
                </View>
                <Ionicons
                  name={todayItems.length > 0 ? "checkmark-circle-outline" : "calendar-outline"}
                  size={22}
                  color={todayItems.length > 0 ? Theme.comfyColors.green : Theme.colors.iconSecondary}
                />
              </View>
            )}
          </View>
        </View>
        <ActivityDetailModal
          visible={selectedActivity !== null}
          activityItem={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      </ScrollView>

      {/* FAB to create activity */}
      <TouchableOpacity
        style={styles.fabCreateBtn}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("CreateActivityModal")}
      >
        <Ionicons name="add" size={32} color={Theme.comfyFontColors.green} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Theme.colors.screenBackground,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 64,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 28,
  },
  mascot: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(141, 255, 104, 0.14)",
    shadowColor: Theme.comfyColors.green,
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  sapoMascotImage: {
    width: 38,
    height: 40,
    resizeMode: "contain",
  },
  title: {
    color: Theme.colors.surface,
    fontSize: 20,
    fontStyle: "italic",
    fontWeight: "800",
  },
  date: {
    color: Theme.colors.textTertiary,
    fontSize: 14,
    marginTop: 2,
  },
  energyCard: {
    minHeight: 200,
  },
  cardTitle: {
    color: Theme.colors.surface,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  energySelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 18,
  },
  energyOrb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  energyLabel: {
    color: Theme.colors.surface,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  fabCreateBtn: {
    position: 'absolute',
    bottom: 16,
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.cardBackground,
    borderColor: Theme.colors.cardBorder,
    borderWidth: 1,
    marginBottom: 22,
  },
  emptyTitle: {
    color: Theme.colors.surface,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },
  emptyDescription: {
    color: Theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 26,
    textAlign: "center",
  },
  emptyButton: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: Theme.comfyColors.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 22,
  },
  emptyButtonText: {
    color: Theme.comfyFontColors.green,
    fontSize: 16,
    fontWeight: "900",
  },
  card: {
    backgroundColor: Theme.colors.cardBackground,
    borderColor: Theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 22,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  statusPill: {
    backgroundColor: Theme.comfyColors.green,
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  statusText: {
    color: Theme.comfyFontColors.green,
    fontSize: 16,
    fontWeight: "800",
  },
  classLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: "800",
  },
  currentTitle: {
    color: Theme.colors.surface,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  timerText: {
    color: Theme.comfyColors.green,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "900",
  },
  timerLabel: {
    color: Theme.colors.textTertiary,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 7,
  },
  changeTitle: {
    color: Theme.colors.surface,
    fontSize: 20,
    fontWeight: "900",
  },
  changeSubtitle: {
    color: Theme.colors.surface,
    fontSize: 15,
    marginTop: 4,
    marginBottom: 18,
  },
  actionButton: {
    height: 44,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 11,
  },
  actionText: {
    color: Theme.colors.surface,
    fontSize: 14,
    fontWeight: "800",
  },
  scheduleSection: {
    marginTop: 10,
  },
  sectionTitle: {
    color: Theme.colors.iconPrimary,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.4,
    marginBottom: 10,
    marginLeft: 12,
  },
  timeline: {
    borderLeftColor: Theme.colors.textTertiary,
    borderLeftWidth: 1,
    marginLeft: 22,
    paddingLeft: 15,
    gap: 18,
  },
  nextCard: {
    minHeight: 70,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nextTime: {
    color: Theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  nextTitle: {
    color: Theme.colors.surface,
    fontSize: 15,
    fontWeight: "800",
  },
  saveEnergyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: 12,
    marginTop: 12,
    paddingHorizontal: 16,
    alignSelf: "center",
  },
  saveEnergyButtonText: {
    color: "#2b2d3b",
    fontSize: 14,
    fontWeight: "900",
  },
});
