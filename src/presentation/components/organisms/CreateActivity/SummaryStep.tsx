import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { DayOfWeek } from "../../../../domain/entities/Activity";
import { DayConfig } from "../../../../domain/entities/activity.types";
import { Theme } from "../../theme/colors";
import GroupList from "../../molecules/CreateActivity/GroupList";

type SummaryStepProps = {
  activityName: string;
  isFixed: boolean;
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
        Confirmá la actividad antes de crearla
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
            {isFixed ? "Fijo" : "Optimizable"}
          </Text>
        </View>
      </View>

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

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCardHalf}>
          <Text style={styles.summaryLabel}>Fecha Límite</Text>
          <Text style={styles.summaryValue}>
            {formatDeadline(deadline)}
          </Text>
        </View>
        <View style={styles.summaryCardHalf}>
          <Text style={styles.summaryLabel}>Días configurados</Text>
          <Text style={styles.summaryValue}>{configuredDays.length} día(s)</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Tiempo semanal configurado</Text>
        <Text style={styles.summaryValue}>{totalMinutes} min</Text>
      </View>

      <GroupList
        groups={groups}
        editingGroupId={editingGroupId}
        isFixed={isFixed}
        onEditGroup={onEditGroup}
        onDiscardGroup={onDiscardGroup}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    color: Theme.colors.surface,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  stepSubtitle: {
    color: Theme.colors.textTertiary,
    fontSize: 15,
    fontWeight: "600",
    marginTop: -10,
  },
  summaryCard: {
    backgroundColor: Theme.colors.cardBackground,
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
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 24,
    padding: 16,
    gap: 8,
  },
  summaryLabel: {
    color: Theme.colors.iconPrimary,
    fontSize: 14,
    fontWeight: "900",
  },
  summaryValue: {
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "900",
  },
  capitalize: {
    textTransform: "capitalize",
  },
});
