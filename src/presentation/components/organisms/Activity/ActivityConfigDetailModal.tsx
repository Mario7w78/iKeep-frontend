import React, { useMemo } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { Activity, DayOfWeek } from "../../../../domain/entities/Activity";
import { DayConfig } from "../../../../domain/entities/activity.types";
import { useTheme, groupColors } from "../../theme/colors";
import type { ThemeColors } from "../../theme/colors";

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
  const navigation = useNavigation<any>();
  const { colors, comfyColors } = useTheme();
  const styles = useMemo(() => createStyles(colors, comfyColors), [colors, comfyColors]);

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

  const getIdentityColor = (identity: string) => {
    switch (identity) {
      case "clase": return comfyColors.skyBlue;
      case "trabajo": return comfyColors.orange;
      default: return comfyColors.green;
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
        return comfyColors.green;
      case "media":
        return comfyColors.yellow;
      case "alta":
        return "#FF6B6B";
      default:
        return colors.surface;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return "#FF6B6B";
    if (priority >= 3) return comfyColors.skyBlue;
    return comfyColors.green;
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

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getGroupsForActivity = (act: Activity) => {
    const groups: Record<number, { days: DayOfWeek[]; config: DayConfig }> = {};
    (Object.entries(act.daysConfig) as [string, DayConfig][]).forEach(
      ([day, cfg]) => {
        if (cfg) {
          if (!groups[cfg.groupId]) {
            groups[cfg.groupId] = { days: [], config: cfg };
          }
          groups[cfg.groupId].days.push(day as DayOfWeek);
        }
      }
    );
    return groups;
  };

  const groups = getGroupsForActivity(activity);

  const configuredDays = activity.daysEnabled.length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlayContainer}>
        <Pressable style={styles.closeArea} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.indicator} />

          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconContainer, { backgroundColor: getIdentityColor(activity.identity) + '20' }]}>
                <Ionicons
                  name={getIdentityIcon(activity.identity)}
                  size={24}
                  color={getIdentityColor(activity.identity)}
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
              <Ionicons name="close" size={24} color={colors.surface} />
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
                      color={colors.surface}
                    />
                    <Text style={styles.badgeText}>
                      {activity.isFixed() ? "Fijo" : "Flexible"}
                    </Text>
                  </View>
                </View>

                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Prioridad</Text>
                  <View style={styles.badge}>
                    <Ionicons
                      name="flag"
                      size={16}
                      color={getPriorityColor(activity.priority)}
                    />
                    <Text style={styles.badgeText}>
                      {getPriorityLabel(activity.priority)}
                    </Text>
                  </View>
                </View>

                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Dificultad</Text>
                  <View style={styles.badge}>
                    <Ionicons
                      name="speedometer-outline"
                      size={16}
                      color={getDifficultyColor(activity.difficulty)}
                    />
                    <Text style={styles.badgeText}>
                      {getDifficultyText(activity.difficulty)}
                    </Text>
                  </View>
                </View>

                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Fecha Límite</Text>
                  <View style={styles.badge}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={colors.iconPrimary}
                    />
                    <Text style={styles.badgeText}>
                      {formatDeadline(activity.deadline)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DÍAS CONFIGURADOS</Text>
              <View style={styles.daysSummaryCard}>
                <Ionicons name="calendar-outline" size={22} color={comfyColors.skyBlue} />
                <Text style={styles.daysSummaryText}>
                  {configuredDays} día{configuredDays !== 1 ? 's' : ''} configurado{configuredDays !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>GRUPOS Y HORARIOS</Text>
              <View style={styles.groupsContainer}>
                {Object.entries(groups).map(([gidStr, { days, config }]) => {
                  const gid = Number(gidStr);
                  const color = groupColors[gid % groupColors.length];

                  return (
                    <View key={gid} style={styles.groupTag}>
                      <View style={styles.daysRow}>
                        <Ionicons name="calendar" size={14} color={color.bg} />
                        {days.map((day) => (
                          <View key={day} style={[styles.dayBadge, { backgroundColor: color.bg + '30' }]}>
                            <Text style={[styles.dayBadgeText, { color: color.bg }]}>
                              {day.substring(0, 3)}
                            </Text>
                          </View>
                        ))}
                      </View>
                      {config.partitions.map((partition, idx) => {
                        const timeRange = activity.isFixed()
                          ? `${formatTime(partition.startHour)} - ${formatTime(partition.endHour)}`
                          : 'Horario optimizable';
                        const durMinutes = partition.durationTime;
                        const durStr = durMinutes < 60 ? `${durMinutes}min` : `${Math.floor(durMinutes / 60)}h ${durMinutes % 60}min`;

                        return (
                          <View key={idx} style={styles.partitionItem}>
                            <View style={styles.partitionRow}>
                              <Ionicons name="time-outline" size={14} color={color.bg} />
                              <Text style={[styles.partitionText, { color: color.bg }]}>
                                {timeRange} ({durStr})
                              </Text>
                            </View>
                            {(partition.travelTo ?? 0) > 0 && (
                              <View style={styles.travelRow}>
                                <Ionicons name="walk-outline" size={13} color={color.bg} />
                                <Text style={[styles.travelText, { color: color.bg }]}>
                                  +{partition.travelTo}min viaje antes
                                </Text>
                              </View>
                            )}
                            {(partition.travelFrom ?? 0) > 0 && (
                              <View style={styles.travelRow}>
                                <Ionicons name="walk-outline" size={13} color={color.bg} />
                                <Text style={[styles.travelText, { color: color.bg }]}>
                                  +{partition.travelFrom}min viaje después
                                </Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButtonSecondary]}
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                navigation.navigate("CreateActivityModal", { activityId: activity.id });
              }}
            >
              <Ionicons name="create-outline" size={20} color={colors.secondaryAccentText} />
              <Text style={[styles.actionButtonText, { color: colors.secondaryAccentText }]}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.closeButtonSecondary]}
              activeOpacity={0.8}
              onPress={onClose}
            >
              <Text style={styles.actionButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors, comfyColors: Record<string, string>) => StyleSheet.create({
  overlayContainer: {
    flex: 1,
    backgroundColor: colors.overlayBackground,
  },
  closeArea: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.screenBackground,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.85,
    gap: 16,
  },
  indicator: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.cardBorder,
    alignSelf: "center",
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
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrapper: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.screenBackground,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  scroll: {
    flexGrow: 1,
  },
  scrollContent: {
    gap: 20,
    paddingBottom: 16,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.iconPrimary,
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
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: "800",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.screenBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "800",
  },
  daysSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.cardBackground,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  daysSummaryText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "800",
  },
  groupsContainer: {
    gap: 10,
  },
  groupTag: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  partitionItem: {
    gap: 4,
    paddingLeft: 4,
  },
  partitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  partitionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  travelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 20,
  },
  travelText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  actionButton: {
    borderRadius: 18,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "900",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  editButtonSecondary: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.secondaryAccent,
  },
  closeButtonSecondary: {
    flex: 1.2,
    backgroundColor: colors.cardBorder,
  },
});
