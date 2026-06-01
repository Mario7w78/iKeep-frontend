import React, { useMemo, useState } from "react";
import {
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

function remainingMinutes(item?: ScheduledActivity) {
  if (!item) return null;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return Math.max(toMinutes(item.assignedEndTime) - currentMinutes, 0);
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

  const currentActivity = todayItems[0];
  const nextActivities = todayItems.slice(currentActivity ? 1 : 0, 4);
  const minutesLeft = remainingMinutes(currentActivity);
  const selectedEnergy = ENERGY_LEVELS[energyIndex];

  const moveEnergy = (direction: -1 | 1) => {
    setEnergyIndex((current) => {
      const next = current + direction;
      if (next < 0) return ENERGY_LEVELS.length - 1;
      if (next >= ENERGY_LEVELS.length) return 0;
      return next;
    });
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
            <Text style={styles.mascotText}>🥑</Text>
          </View>
          <View>
            <Text style={styles.title}>Hola, Mario. Tu dia esta listo.</Text>
            <Text style={styles.date}>{dayFormatter.format(new Date())}</Text>
          </View>
        </View>

        <LinearGradient
          colors={["#34364c", "#37362d"]}
          style={[styles.card, styles.energyCard]}
        >
          <Text style={styles.cardTitle}>¿Como esta tu nivel de energia hoy?</Text>
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
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>En curso</Text>
            </View>
            <Text style={styles.classLabel}>Clase</Text>
          </View>
          <Text style={styles.currentTitle}>
            {currentActivity?.activity.title ?? "Sin actividad en curso"}
          </Text>
          <View style={styles.timerRow}>
            <Text style={styles.timerText}>
              {minutesLeft !== null
                ? `${String(Math.floor(minutesLeft / 60)).padStart(2, "0")}:${String(minutesLeft % 60).padStart(2, "0")}`
                : "--:--"}
            </Text>
            <Text style={styles.timerLabel}>min restantes</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.changeTitle}>¿Algo cambio hoy ?</Text>
          <Text style={styles.changeSubtitle}>
            Añade un imprevisto o una nueva rutina
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.75}
            onPress={() => navigation.navigate("CreateActivityModal")}
          >
            <Ionicons name="clipboard" size={20} color={Theme.colors.surface} />
            <Text style={styles.actionText}>Nueva Tarea para hoy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.75}
            onPress={() => navigation.navigate("CreateActivityModal")}
          >
            <Ionicons name="calendar" size={20} color={Theme.colors.surface} />
            <Text style={styles.actionText}>Nueva Rutina semanal</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.scheduleSection}>
          <Text style={styles.sectionTitle}>PROXIMO EN TU HORARIO</Text>
          <View style={styles.timeline}>
            {(nextActivities.length ? nextActivities : todayItems.slice(0, 3)).map(
              (item, index) => (
                <View key={`${item.activity.id}-${index}`} style={styles.nextCard}>
                  <View>
                    <Text style={styles.nextTime}>
                      {item.assignedStartTime} - {item.assignedEndTime}
                    </Text>
                    <Text style={styles.nextTitle}>{item.activity.title}</Text>
                  </View>
                  <Ionicons name="lock-closed" size={22} color={Theme.colors.iconSecondary} />
                </View>
              ),
            )}
            {!todayItems.length && (
              <View style={styles.nextCard}>
                <View>
                  <Text style={styles.nextTime}>Sin bloques programados</Text>
                  <Text style={styles.nextTitle}>Genera tu horario</Text>
                </View>
                <Ionicons name="lock-closed" size={22} color={Theme.colors.iconSecondary} />
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
  mascotText: {
    fontSize: 34,
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
