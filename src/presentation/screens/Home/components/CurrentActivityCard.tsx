import React from "react";
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../components/theme/colors";
import { formatMinutesRemaining } from "../HomeView.utils";
import { ScheduledActivity } from "../../../../domain/entities/Schedule";

interface CurrentActivityCardProps {
  currentActivity: ScheduledActivity | null;
  firstNext: ScheduledActivity | null;
  freeTimeMinutes: number | null;
  todayItems: ScheduledActivity[];
  cardStatus: {
    pill: string;
    pillColor: string;
    pillText: string;
    label: string;
  };
  currentCardTitle: string;
  minutesLeft: number | null;
  onPress: () => void;
  disabled: boolean;
}

export const CurrentActivityCard = ({
  currentActivity,
  firstNext,
  freeTimeMinutes,
  todayItems,
  cardStatus,
  currentCardTitle,
  minutesLeft,
  onPress,
  disabled,
}: CurrentActivityCardProps) => {
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);

  const isCurrentTravel = currentActivity && (currentActivity.tipo === 'viaje' || !currentActivity.activity);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled}
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
          <Text style={[styles.timerText, { color: comfyColors.skyBlue }]}>
            {firstNext.assignedStartTime}
          </Text>
          <Text style={styles.timerLabel}>hora de inicio</Text>
        </View>
      ) : freeTimeMinutes !== null ? (
        <View style={styles.timerRow}>
          <Text style={[styles.timerText, { color: comfyColors.green }]}>
            {formatMinutesRemaining(freeTimeMinutes)}
          </Text>
          <Text style={styles.timerLabel}>
            {todayItems.length > 0 ? "hasta fin del día" : "libres hoy"}
          </Text>
        </View>
      ) : (
        <View style={styles.timerRow}>
          <Text style={[styles.timerText, { color: comfyColors.green }]}>
            Listo
          </Text>
          <Text style={styles.timerLabel}>¡Día completado!</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

function createStyles(
  colors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['colors'],
  comfyColors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['comfyColors'],
  comfyFontColors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['comfyFontColors']
): Record<string, ViewStyle | TextStyle> {
  return {
    card: {
      backgroundColor: colors.cardBackground,
      borderColor: colors.cardBorder,
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
      backgroundColor: comfyColors.green,
      borderRadius: 18,
      paddingHorizontal: 15,
      paddingVertical: 8,
    },
    statusText: {
      color: comfyFontColors.green,
      fontSize: 16,
      fontWeight: "800",
    },
    classLabel: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: "800",
    },
    currentTitle: {
      color: colors.surface,
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
      color: comfyColors.green,
      fontSize: 42,
      lineHeight: 48,
      fontWeight: "900",
    },
    timerLabel: {
      color: colors.textTertiary,
      fontSize: 17,
      fontWeight: "700",
      marginBottom: 7,
    },
  };
}