import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { DayOfWeek } from "../../../../domain/entities/Activity";
import { DayConfig } from "../../../../domain/entities/activity.types";
import { useTheme, ThemeColors } from "../../theme/colors";
import GroupList from "../../molecules/CreateActivity/GroupList";

type SummaryStepProps = {
  activityName: string;
  isFixed: boolean;
  isAnchor: boolean;
  identity: "clase" | "trabajo" | "tarea";
  priority: "baja" | "media" | "alta";
  difficulty: "baja" | "media" | "alta";
  deadline: Date | null;
  configuredDays: DayOfWeek[];
  totalMinutes: number;
  groups: Record<number, { days: DayOfWeek[]; config: DayConfig }>;
  editingGroupId: number | null;
  onEditGroup: (group: {
    groupId: number;
    days: DayOfWeek[];
    config: DayConfig;
  }) => void;
  onDiscardGroup: (groupId: number) => void;
};

export default function SummaryStep({
  activityName,
  isFixed,
  isAnchor,
  identity,
  priority,
  difficulty,
  deadline,
  configuredDays,
  totalMinutes,
  groups,
  editingGroupId,
  onEditGroup,
  onDiscardGroup,
}: SummaryStepProps) {
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);
  let totalActivityMinutes = 0;
  let totalTravelMinutes = 0;

  Object.values(groups).forEach(({ days, config }) => {
    const daysCount = (isFixed || isAnchor) ? days.length : 1;
    const dailyDuration = config.partitions.reduce((sum, p) => sum + p.durationTime, 0);
    const dailyTravel = config.partitions.reduce((sum, p) => sum + (p.travelTo ?? 0) + (p.travelFrom ?? 0), 0);

    totalActivityMinutes += dailyDuration * daysCount;
    totalTravelMinutes += dailyTravel * daysCount;
  });

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

  const getIdentityText = (val: string) => {
    switch (val) {
      case "clase": return "Clase";
      case "trabajo": return "Trabajo";
      case "tarea": return "Tarea";
      default: return val;
    }
  };

  const getDifficultyText = (val: string) => {
    switch (val) {
      case "baja": return "Baja";
      case "media": return "Normal";
      case "alta": return "Alta";
      default: return val;
    }
  };

  const formatDeadline = (date: Date | null) => {
    if (!date) return "Sin fecha límite";
    return date.toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.stepTitle}>Resumen</Text>
      <Text style={styles.stepSubtitle}>
        Confirma la actividad antes de crearla
      </Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Nombre de la actividad</Text>
        <Text style={styles.summaryValue}>{activityName}</Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCardHalf}>
          <Text style={styles.summaryLabel}>Identidad</Text>
          <Text style={[styles.summaryValue, styles.capitalize]}>
            {getIdentityText(identity)}
          </Text>
        </View>
        <View style={styles.summaryCardHalf}>
          <Text style={styles.summaryLabel}>Tipo</Text>
          <Text style={styles.summaryValue}>
            {isFixed ? "Fijo" : "Flexible"}
          </Text>
        </View>
      </View>

      {!isFixed && (
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCardHalf}>
            <Text style={styles.summaryLabel}>Prioridad</Text>
            <Text style={[styles.summaryValue, styles.capitalize]}>
              {priority}
            </Text>
          </View>
          <View style={styles.summaryCardHalf}>
            <Text style={styles.summaryLabel}>Dificultad</Text>
            <Text style={styles.summaryValue}>
              {getDifficultyText(difficulty)}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCardHalf}>
          <Text style={styles.summaryLabel}>Fecha Límite</Text>
          <Text style={styles.summaryValue}>
            {formatDeadline(deadline)}
          </Text>
        </View>
        <View style={styles.summaryCardHalf}>
          <Text style={styles.summaryLabel}>
            {isFixed || isAnchor ? "Días" : "Días permitidos"}
          </Text>
          <Text style={styles.summaryValue}>
            {!isFixed && !isAnchor && configuredDays.length === 7
              ? "Cualquier día"
              : `${configuredDays.length} día(s)`}
          </Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Tiempo semanal configurado</Text>
        
        <View style={styles.timeBreakdownRow}>
          <Text style={styles.timeBreakdownText}>Actividad:</Text>
          <Text style={styles.timeBreakdownValue}>{formatTimeSummary(totalActivityMinutes)}</Text>
        </View>
        
        {totalTravelMinutes > 0 && (
          <View style={styles.timeBreakdownRow}>
            <Text style={styles.timeBreakdownText}>Traslado:</Text>
            <Text style={styles.timeBreakdownValue}>{formatTimeSummary(totalTravelMinutes)}</Text>
          </View>
        )}
        
        <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
        
        <View style={styles.timeBreakdownRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{formatTimeSummary(totalActivityMinutes + totalTravelMinutes)}</Text>
        </View>
      </View>

      <GroupList
        groups={groups}
        editingGroupId={editingGroupId}
        isFixed={isFixed}
        isAnchor={isAnchor}
        onEditGroup={onEditGroup}
        onDiscardGroup={onDiscardGroup}
      />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors, comfyColors: Record<string, string>, _comfyFontColors: Record<string, string>) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 16,
    },
    stepTitle: {
      color: colors.surface,
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    stepSubtitle: {
      color: colors.textTertiary,
      fontSize: 15,
      fontWeight: "600",
      marginTop: -10,
    },
    summaryCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 24,
      padding: 16,
      gap: 8,
    },
    summaryGrid: {
      flexDirection: "row",
      gap: 14,
    },
    summaryCardHalf: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      borderRadius: 24,
      padding: 16,
      gap: 8,
    },
    summaryLabel: {
      color: colors.iconPrimary,
      fontSize: 14,
      fontWeight: "900",
    },
    summaryValue: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: "900",
    },
    capitalize: {
      textTransform: "capitalize",
    },
    timeBreakdownRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    timeBreakdownText: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: "700",
    },
    timeBreakdownValue: {
      color: colors.surface,
      fontSize: 15,
      fontWeight: "800",
    },
    divider: {
      height: 1,
      marginVertical: 4,
    },
    totalLabel: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: "900",
    },
    totalValue: {
      color: comfyColors.green,
      fontSize: 18,
      fontWeight: "900",
    },
  });
}
