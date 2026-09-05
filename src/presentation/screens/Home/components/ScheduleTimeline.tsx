import React from "react";
import { View, Text, ViewStyle, TextStyle } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../components/theme/colors";
import { DAY_DISPLAY_NAMES, areaTituloDe } from "../HomeView.utils";
import { ScheduledActivity } from "../../../../domain/entities/Schedule";
import { ExtendedViewStyle } from "./styles";
import { SwipeableActivityCard } from "../../../components/atoms/SwipeableActivityCard";
import { AreaIcon, areaColorMap } from "../../Activity/areaIcon";

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
  const navigation = useNavigation<any>();
  const styles = React.useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);

  const hasItems = nextActivities.length > 0 || nextDayWithItems || todayItems.length > 0;

  if (!hasItems) return null;

  const getActionsFor = (item: ScheduledActivity) => [
    {
      key: "editar",
      label: "Editar",
      icono: "create-outline" as const,
      color: colors.secondaryAccent,
      onPress: () => {
        if (item.activity) {
          navigation.navigate("CreateActivityModal", { activityId: item.activity.id });
        }
      },
    },
    {
      key: "ver",
      label: "Ver detalle",
      icono: "eye-outline" as const,
      color: colors.accent,
      onPress: () => onPressActivity(item),
    },
  ];

  const renderSwipeableCard = (item: ScheduledActivity, key: string) => (
    <SwipeableActivityCard
      key={key}
      actions={getActionsFor(item)}
      onPress={() => item.activity && onPressActivity(item)}
    >
      <View style={styles.nextCardContent}>
        {item.activity && (
          <View style={[styles.cardIcon, { backgroundColor: areaColorMap[item.activity.area] }]}>
            <AreaIcon area={item.activity.area} size={20} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.nextTime}>
            {item.assignedStartTime} - {item.assignedEndTime}
          </Text>
          {item.activity ? (
            <>
              <Text style={styles.nextTitle}>{areaTituloDe(item.activity.area)}</Text>
              <Text style={styles.nextActivityTitle} numberOfLines={1}>
                {item.activity.title}
              </Text>
            </>
          ) : (
            <Text style={styles.nextTitle}>
              {item.tipo === 'trabajo' || item.tipo === 'viaje' ? '🚗 Viaje' : 'Actividad'}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.iconSecondary} />
      </View>
    </SwipeableActivityCard>
  );

  return (
    <GestureHandlerRootView style={styles.scheduleSection}>
      <Text style={styles.sectionTitle}>PRÓXIMO EN TU HORARIO</Text>
      <View style={styles.timeline}>
        {nextActivities.length > 0 ? (
          nextActivities.slice(0, 3).map((item, index) =>
            renderSwipeableCard(item, `${item.activity?.id ?? item.tipo ?? index}-${index}`)
          )
        ) : nextDayWithItems ? (
          <>
            <Text style={styles.nextDayLabel}>{DAY_DISPLAY_NAMES[nextDayWithItems.day]}</Text>
            {nextDayWithItems.items.slice(0, 3).map((item, index) =>
              renderSwipeableCard(item, `nextday-${item.activity?.id ?? item.tipo ?? index}-${index}`)
            )}
          </>
        ) : (
          <View style={styles.nextCardStatic}>
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
    </GestureHandlerRootView>
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

    },
    timeline: {
      gap: 18,
    },
    nextCardStatic: {
      minHeight: 70,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    nextCardContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    cardIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      paddingTop: 4,
      alignItems: "center",
      justifyContent: "center",
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
    nextActivityTitle: {
      color: colors.textTertiary,
      fontSize: 13,
      fontWeight: "600",
      marginTop: 2,
    },
  };
}
