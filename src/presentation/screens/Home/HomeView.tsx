import React, { useMemo, useState, useEffect } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

const ENERGY_LEVELS = [
  { label: "Baja energia", color: Theme.comfyColors.yellow },
  { label: "Energia estable", color: Theme.comfyColors.green },
  { label: "Alta energia", color: Theme.comfyColors.skyBlue },
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
  const activities = useActivityStore((s) => s.activities);
  const loadActivities = useActivityStore((s) => s.loadActivities);
  const [energyIndex, setEnergyIndex] = useState(0);


  useFocusEffect(
    React.useCallback(() => {
      loadActivities();
    }, [loadActivities]),
  );

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
        <View style={styles.headerContainer}>
          <View style={styles.sapoWrapper}>
            <Image
              source={{ uri: SAPO_BASE64 }}
              style={styles.sapoIcon}
            />
          </View>
        </View>

        <LinearGradient
          colors={["#34364c", "#37362d"]}
          style={[styles.card, styles.energyCard]}
        >
          <Text style={styles.cardTitle}>¿Cómo está tu nivel de energía hoy?</Text>
          <View style={styles.energySelector}>
            <Pressable onPress={() => moveEnergy(-1)} hitSlop={12}>
              <Ionicons name="chevron-back" size={34} color={Theme.colors.surface} />
            </Pressable>
            <View
              style={[
                styles.energyOrb,
                { backgroundColor: selectedEnergy.color },
              ]}
            />
            <Pressable onPress={() => moveEnergy(1)} hitSlop={12}>
              <Ionicons name="chevron-forward" size={34} color={Theme.colors.surface} />
            </Pressable>
          </View>
          <Text style={styles.energyLabel}>{selectedEnergy.label}</Text>
        </LinearGradient>

        <View style={styles.card}>
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
        </View>

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
                <View key={`${item.activity.id}-${index}`} style={styles.nextCard}>
                  <View>
                    <Text style={styles.nextTime}>
                      {item.assignedStartTime} - {item.assignedEndTime}
                    </Text>
                    <Text style={styles.nextTitle}>{item.activity.title}</Text>
                  </View>
                  <Ionicons name="lock-closed" size={22} color={Theme.colors.iconSecondary} />
                </View>
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
      </ScrollView>
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
    paddingBottom: 112,
  },
  headerContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    marginTop: 10,
  },
  sapoWrapper: {
    shadowColor: "#8dff68",
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  sapoIcon: {
    width: 90,
    height: 96,
    resizeMode: "contain",
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
});
