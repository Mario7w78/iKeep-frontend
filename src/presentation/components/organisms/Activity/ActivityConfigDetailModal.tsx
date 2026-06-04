import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Activity, DayOfWeek } from "../../../../domain/entities/Activity";
import { DayConfig } from "../../../../domain/entities/activity.types";
import { Theme } from "../../theme/colors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ActivityConfigDetailModalProps {
  visible: boolean;
  activity: Activity | null;
  onClose: () => void;
}

export function ActivityConfigDetailModal({
  visible,
  activity,
  onClose,
}: ActivityConfigDetailModalProps) {
  if (!activity) return null;

  const getIdentityIcon = (identity: string) => {
    switch (identity) {
      case "clase":
        return "school-outline";
      case "trabajo":
        return "briefcase-outline";
      default:
        return "document-text-outline";
    }
  };

  const getIdentityText = (val: string) => {
    switch (val) {
      case "clase":
        return "Clase";
      case "trabajo":
        return "Trabajo";
      case "tarea":
        return "Tarea";
      default:
        return val;
    }
  };

  const getDifficultyText = (val: string) => {
    switch (val) {
      case "baja":
        return "Baja";
      case "media":
        return "Normal";
      case "alta":
        return "Alta";
      default:
        return val;
    }
  };

  const getPriorityLabel = (priority: number) => {
    if (priority <= 1) return "Baja";
    if (priority <= 3) return "Media";
    return "Alta";
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "baja":
        return Theme.comfyColors.green;
      case "media":
        return Theme.comfyColors.yellow;
      case "alta":
        return "#FF6B6B";
      default:
        return Theme.colors.surface;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return "#FF6B6B";
    if (priority >= 3) return Theme.comfyColors.skyBlue;
    return Theme.comfyColors.green;
  };

  const formatDeadline = (dateStr: string | null) => {
    if (!dateStr) return "Sin fecha límite";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatMinutesToHHMM = (totalMinutes: number | null | undefined) => {
    if (totalMinutes === null || totalMinutes === undefined) return "";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}`;
  };

  const formatTimeSummary = (minutes: number) => {
    if (minutes === 0) return "0 min";
    if (minutes < 60) return `${minutes} min`;

    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) {
      return hrs === 1 ? "1 hora" : `${hrs} horas`;
    }

    const hrsStr = hrs === 1 ? "1 hora" : `${hrs} horas`;
    return `${hrsStr} y ${mins} min`;
  };

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h} h` : `${h}h ${m}min`;
  };

  const getGroupsForActivity = (act: Activity) => {
    const groups: Record<number, { days: DayOfWeek[]; config: DayConfig }> = {};
    (Object.entries(act.daysConfig) as [DayOfWeek, DayConfig][]).forEach(
      ([day, cfg]) => {
        if (cfg) {
          if (!groups[cfg.groupId]) {
            groups[cfg.groupId] = { days: [], config: cfg };
          }
          groups[cfg.groupId].days.push(day);
        }
      }
    );
    return groups;
  };

  const groups = getGroupsForActivity(activity);

  let totalActivityMinutes = 0;
  let totalTravelMinutes = 0;

  Object.values(groups).forEach(({ days, config }) => {
    const daysCount = days.length;
    const dailyDuration = config.partitions.reduce(
      (sum, p) => sum + p.durationTime,
      0
    );
    const dailyTravel = config.partitions.reduce(
      (sum, p) => sum + p.travelTime,
      0
    );

    totalActivityMinutes += dailyDuration * daysCount;
    totalTravelMinutes += dailyTravel * daysCount;
  });

  const showPreferredHours =
    !activity.isFixed() &&
    activity.preferredStartTime !== null &&
    activity.preferredEndTime !== null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} pointerEvents="auto">
          <View style={styles.indicator} />

          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={getIdentityIcon(activity.identity)}
                  size={24}
                  color={Theme.comfyFontColors.green}
                />
              </View>
              <View style={styles.titleWrapper}>
                <Text style={styles.title} numberOfLines={2}>
                  {activity.title}
                </Text>
                <Text style={styles.subtitle}>
                  {getIdentityText(activity.identity)}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={Theme.colors.surface} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DETALLES</Text>
              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Tipo</Text>
                  <View style={styles.badge}>
                    <Ionicons
                      name={
                        activity.isFixed()
                          ? "lock-closed-outline"
                          : "flash-outline"
                      }
                      size={16}
                      color={Theme.colors.surface}
                    />
                    <Text style={styles.badgeText}>
                      {activity.isFixed() ? "Fijo" : "Optimizable"}
                    </Text>
                  </View>
                </View>

                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Prioridad</Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: "rgba(255,255,255,0.05)" },
                    ]}
                  >
                    <Ionicons
                      name="flag"
                      size={16}
                      color={getPriorityColor(activity.priority)}
                    />
                    <Text
                      style={[
                        styles.badgeText,
                        { color: Theme.colors.surface },
                      ]}
                    >
                      {getPriorityLabel(activity.priority)}
                    </Text>
                  </View>
                </View>

                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Dificultad</Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: "rgba(255,255,255,0.05)" },
                    ]}
                  >
                    <Ionicons
                      name="speedometer-outline"
                      size={16}
                      color={getDifficultyColor(activity.difficulty)}
                    />
                    <Text
                      style={[
                        styles.badgeText,
                        { color: Theme.colors.surface },
                      ]}
                    >
                      {getDifficultyText(activity.difficulty)}
                    </Text>
                  </View>
                </View>

                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Fecha Límite</Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: "rgba(255,255,255,0.05)" },
                    ]}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={Theme.colors.iconPrimary}
                    />
                    <Text style={styles.badgeText}>
                      {formatDeadline(activity.deadline)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {showPreferredHours && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  HORARIO PREFERIDO (OPTIMIZADOR)
                </Text>
                <View style={styles.timeCard}>
                  <Ionicons
                    name="time-outline"
                    size={24}
                    color={Theme.comfyColors.skyBlue}
                  />
                  <View>
                    <Text style={styles.timeText}>
                      {formatMinutesToHHMM(activity.preferredStartTime)} -{" "}
                      {formatMinutesToHHMM(activity.preferredEndTime)}
                    </Text>
                    <Text style={styles.dayText}>Rango de horas preferidas</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                TIEMPO SEMANAL CONFIGURADO
              </Text>
              <View style={styles.summaryCard}>
                <View style={styles.timeBreakdownRow}>
                  <Text style={styles.timeBreakdownText}>Actividad:</Text>
                  <Text style={styles.timeBreakdownValue}>
                    {formatTimeSummary(totalActivityMinutes)}
                  </Text>
                </View>

                {totalTravelMinutes > 0 && (
                  <View style={styles.timeBreakdownRow}>
                    <Text style={styles.timeBreakdownText}>Traslado:</Text>
                    <Text style={styles.timeBreakdownValue}>
                      {formatTimeSummary(totalTravelMinutes)}
                    </Text>
                  </View>
                )}

                <View
                  style={[
                    styles.sectionDivider,
                    { backgroundColor: Theme.colors.cardBorder },
                  ]}
                />

                <View style={styles.timeBreakdownRow}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>
                    {formatTimeSummary(
                      totalActivityMinutes + totalTravelMinutes
                    )}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DÍAS CONFIGURADOS</Text>
              <View style={styles.groupsContainer}>
                {Object.entries(groups).map(([gidStr, { days, config }]) => {
                  const gid = Number(gidStr);
                  const color =
                    Theme.groupColors[gid % Theme.groupColors.length];

                  return (
                    <View
                      key={gid}
                      style={[
                        styles.groupTag,
                        { backgroundColor: color.bg, borderColor: color.text },
                      ]}
                    >
                      <View style={styles.tagHeader}>
                        <View style={styles.daysContainer}>
                          {days.map((day) => (
                            <View
                              key={day}
                              style={[
                                styles.dayBadge,
                                { backgroundColor: color.text + "15" },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.dayBadgeText,
                                  { color: color.text },
                                ]}
                              >
                                {day.substring(0, 3)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      <View
                        style={[
                          styles.tagDivider,
                          { backgroundColor: color.text + "20" },
                        ]}
                      />

                      <View style={styles.partitionsList}>
                        {config.partitions.map((partition, index) => {
                          const timeRangeOrStatus = activity.isFixed()
                            ? `${formatTime(partition.startHour)} - ${formatTime(
                                partition.endHour
                              )}`
                            : `Horario optimizable`;

                          const durationStr = formatMinutes(
                            partition.durationTime
                          );

                          return (
                            <View key={index} style={styles.partitionItem}>
                              <View style={styles.partitionTimeRow}>
                                <Ionicons
                                  name="layers-outline"
                                  size={14}
                                  color={color.text}
                                  style={styles.icon}
                                />
                                <Text
                                  style={[
                                    styles.tagInfo,
                                    { color: color.text },
                                  ]}
                                >
                                  {timeRangeOrStatus}{" "}
                                  {!activity.isFixed() && `(${durationStr})`}
                                </Text>
                              </View>
                              {partition.travelTime > 0 && (
                                <View style={styles.partitionTravelRow}>
                                  <Ionicons
                                    name="walk-outline"
                                    size={14}
                                    color={color.text}
                                    style={styles.icon}
                                  />
                                  <Text
                                    style={[
                                      styles.tagSubInfo,
                                      { color: color.text },
                                    ]}
                                  >
                                    +{formatMinutes(partition.travelTime)} de
                                    traslado
                                  </Text>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
            onPress={onClose}
          >
            <Text style={styles.actionButtonText}>Entendido</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10, 11, 18, 0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Theme.colors.screenBackground,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderColor: Theme.colors.cardBorder,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
    height: SCREEN_HEIGHT * 0.75,
    gap: 16,
  },
  indicator: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Theme.colors.cardBorder,
    alignSelf: "center",
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(141, 255, 104, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrapper: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: Theme.colors.surface,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.cardBorder,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 20,
    paddingBottom: 16,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: Theme.colors.iconPrimary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    flexBasis: "47%",
    flexGrow: 1,
    gap: 6,
  },
  gridLabel: {
    color: Theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: "800",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: Theme.colors.surface,
    fontSize: 13,
    fontWeight: "800",
  },
  timeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: Theme.colors.cardBackground,
    borderColor: Theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  timeText: {
    color: Theme.colors.surface,
    fontSize: 18,
    fontWeight: "800",
  },
  dayText: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  summaryCard: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 20,
    padding: 16,
    gap: 8,
    borderColor: Theme.colors.cardBorder,
    borderWidth: 1,
  },
  timeBreakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeBreakdownText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  timeBreakdownValue: {
    color: Theme.colors.surface,
    fontSize: 14,
    fontWeight: "800",
  },
  sectionDivider: {
    height: 1,
    width: "100%",
  },
  totalLabel: {
    color: Theme.colors.surface,
    fontSize: 15,
    fontWeight: "800",
  },
  totalValue: {
    color: Theme.comfyColors.green,
    fontSize: 15,
    fontWeight: "900",
  },
  groupsContainer: {
    gap: 10,
  },
  groupTag: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  tagHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
  },
  dayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  tagDivider: {
    height: 1,
    width: "100%",
  },
  partitionsList: {
    gap: 8,
  },
  partitionItem: {
    gap: 2,
  },
  partitionTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  partitionTravelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 20,
  },
  icon: {
    opacity: 0.8,
  },
  tagInfo: {
    fontSize: 13,
    fontWeight: "800",
  },
  tagSubInfo: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.8,
  },
  actionButton: {
    backgroundColor: Theme.comfyColors.green,
    borderRadius: 18,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  actionButtonText: {
    color: Theme.comfyFontColors.green,
    fontSize: 16,
    fontWeight: "900",
  },
});
