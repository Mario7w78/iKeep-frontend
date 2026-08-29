import React from "react";
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../components/theme/colors";
import { CompleteToggle } from "../../../components/atoms/Rewards/CompleteToggle";
import { DAY_DISPLAY_NAMES } from "../HomeView.utils";
import { ScheduledActivity } from "../../../../domain/entities/Schedule";
import { ExtendedViewStyle } from "./styles";

interface ScheduleTimelineProps {
  nextActivities: ScheduledActivity[];
  nextDayWithItems: { day: string; items: ScheduledActivity[] } | null;
  todayItems: ScheduledActivity[];
  completadas: string[];
  alternarCompletada: (id: string) => void;
  onPressActivity: (activity: ScheduledActivity) => void;
}

export const ScheduleTimeline = ({
  nextActivities,
  nextDayWithItems,
  todayItems,
  completadas,
  alternarCompletada,
  onPressActivity,
}: ScheduleTimelineProps) => {
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);

  const hasItems = nextActivities.length > 0 || nextDayWithItems || todayItems.length > 0;

  if (!hasItems) return null;

  return (
    <View style={styles.scheduleSection}>
      <Text style={styles.sectionTitle}>PRÓXIMO EN TU HORARIO</Text>
      <View style={styles.timeline}>
        {nextActivities.length > 0 ? (
          nextActivities.slice(0, 3).map((item, index) => (
            <TouchableOpacity
              key={`${item.activity?.id ?? item.tipo ?? index}-${index}`}
              style={styles.nextCard}
              activeOpacity={0.75}
              onPress={() => item.activity && onPressActivity(item)}
            >
              {item.activity && (
                <CompleteToggle
                  completada={completadas.includes(String(item.activity.id))}
                  nombre={item.activity.title}
                  onToggle={() => alternarCompletada(String(item.activity!.id))}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.nextTime}>
                  {item.assignedStartTime} - {item.assignedEndTime}
                </Text>
                <Text
                  style={[
                    styles.nextTitle,
                    item.activity &&
                      completadas.includes(String(item.activity.id)) &&
                      styles.nextTitleHecha,
                  ]}
                >
                  {item.activity?.title ?? (item.tipo === 'trabajo' || item.tipo === 'viaje' ? '🚗 Viaje' : 'Actividad')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.iconSecondary} />
            </TouchableOpacity>
          ))
        ) : nextDayWithItems ? (
          <>
            <Text style={styles.nextDayLabel}>{DAY_DISPLAY_NAMES[nextDayWithItems.day]}</Text>
            {nextDayWithItems.items.slice(0, 3).map((item, index) => (
              <TouchableOpacity
                key={`nextday-${item.activity?.id ?? item.tipo ?? index}-${index}`}
                style={styles.nextCard}
                activeOpacity={0.75}
                onPress={() => item.activity && onPressActivity(item)}
              >
                <View>
                  <Text style={styles.nextTime}>
                    {item.assignedStartTime} - {item.assignedEndTime}
                  </Text>
                  <Text style={styles.nextTitle}>{item.activity?.title ?? (item.tipo === 'trabajo' || item.tipo === 'viaje' ? '🚗 Viaje' : 'Actividad')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.iconSecondary} />
              </TouchableOpacity>
            ))}
          </>
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
              color={todayItems.length > 0 ? comfyColors.green : colors.iconSecondary}
            />
          </View>
        )}
      </View>
    </View>
  );
};

function createStyles(
  colors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['colors'],
  comfyColors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['comfyColors'],
  comfyFontColors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['comfyFontColors']
): Record<string, ExtendedViewStyle | TextStyle> {
  return {
    scheduleSection: {
      marginTop: 10,
    },
    sectionTitle: {
      color: colors.iconPrimary,
      fontSize: 14,
      fontWeight: "900",
      letterSpacing: 0.4,
      marginBottom: 10,
      marginLeft: 12,
    },
    timeline: {
      borderLeftColor: colors.textTertiary,
      borderLeftWidth: 1,
      marginLeft: 22,
      paddingLeft: 15,
      gap: 18,
    },
    nextCard: {
      minHeight: 70,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
      paddingHorizontal: 12,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    nextDayLabel: {
      color: comfyColors.skyBlue,
      fontSize: 13,
      fontWeight: "900",
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    nextTime: {
      color: colors.textTertiary,
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 4,
    },
    nextTitle: {
      color: colors.surface,
      fontSize: 15,
      fontWeight: "800",
    },
    nextTitleHecha: {
      textDecorationLine: 'line-through',
      opacity: 0.55,
    },
  };
}