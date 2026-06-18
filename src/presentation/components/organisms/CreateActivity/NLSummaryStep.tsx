import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DayOfWeek } from "../../../../domain/entities/Activity";
import { DayConfig } from "../../../../domain/entities/activity.types";
import { useTheme, ThemeColors } from "../../theme/colors";
import GroupList from "../../molecules/CreateActivity/GroupList";

type NLSummaryStepProps = {
  activityName: string;
  isFixed: boolean;
  isAnchor: boolean;
  identity: string | null;
  priority: string | null;
  difficulty: string | null;
  configuredDays: DayOfWeek[];
  totalMinutes: number;
  groups: Record<number, { days: DayOfWeek[]; config: DayConfig }>;
  onConfirm: () => void;
  onEdit: () => void;
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

export default function NLSummaryStep({
  activityName,
  isFixed,
  isAnchor,
  identity,
  priority,
  difficulty,
  configuredDays,
  totalMinutes,
  groups,
  onConfirm,
  onEdit,
}: NLSummaryStepProps) {
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);
  const identityLabel = identity
    ? identity === "clase"
      ? "Clase"
      : identity === "trabajo"
        ? "Trabajo"
        : "Tarea"
    : "—";
  const priorityLabel = priority
    ? priority === "alta"
      ? "Alta"
      : priority === "media"
        ? "Media"
        : "Baja"
    : "—";
  const difficultyLabel = difficulty
    ? difficulty === "alta"
      ? "Alta"
      : difficulty === "media"
        ? "Normal"
        : "Baja"
    : "—";

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Resumen</Text>
      <Text style={styles.subtitle}>Confirmá la actividad antes de crearla</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nombre de la actividad</Text>
        <Text style={styles.value}>{activityName}</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.half}>
          <Text style={styles.label}>Identidad</Text>
          <Text style={[styles.value, styles.capitalize]}>
            {identityLabel}
          </Text>
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Tipo</Text>
          <Text style={styles.value}>
            {isFixed ? "Fijo" : "Optimizable"}
          </Text>
        </View>
      </View>

      {!isFixed && (
        <View style={styles.grid}>
          <View style={styles.half}>
            <Text style={styles.label}>Prioridad</Text>
            <Text style={[styles.value, styles.capitalize]}>
              {priorityLabel}
            </Text>
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Dificultad</Text>
            <Text style={styles.value}>
              {difficultyLabel}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.grid}>
        <View style={styles.half}>
          <Text style={styles.label}>Fecha Límite</Text>
          <Text style={styles.value}>Sin fecha límite</Text>
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>
            {isFixed || isAnchor ? "Días programados" : "Días permitidos"}
          </Text>
          <Text style={styles.value}>
            {configuredDays.length === 7 && !isFixed && !isAnchor
              ? "Cualquier día"
              : `${configuredDays.length} día(s)`}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Tiempo semanal configurado</Text>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownText}>Actividad:</Text>
          <Text style={styles.breakdownValue}>
            {formatTimeSummary(totalMinutes)}
          </Text>
        </View>
        <View style={[styles.breakdownDivider, { backgroundColor: colors.cardBorder }]} />
        <View style={styles.breakdownRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>
            {formatTimeSummary(totalMinutes)}
          </Text>
        </View>
      </View>

      {(isFixed || isAnchor) && Object.keys(groups).length > 0 && (
        <GroupList
          groups={groups}
          editingGroupId={null}
          isFixed={isFixed}
          isAnchor={isAnchor}
          onEditGroup={() => {}}
          onDiscardGroup={() => {}}
        />
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={onConfirm}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark" size={20} color={colors.accentText} />
          <Text style={styles.confirmText}>Confirmar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          onPress={onEdit}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={20} color={colors.secondaryAccent} />
          <Text style={styles.editText}>Editar manualmente</Text>
        </TouchableOpacity>
      </View>
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
    title: {
      color: colors.surface,
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    subtitle: {
      color: colors.textTertiary,
      fontSize: 15,
      fontWeight: "600",
      marginTop: -10,
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 24,
      padding: 16,
      gap: 8,
    },
    grid: {
      flexDirection: "row",
      gap: 14,
    },
    half: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      borderRadius: 24,
      padding: 16,
      gap: 8,
    },
    capitalize: {
      textTransform: "capitalize",
    },
    label: {
      color: colors.iconPrimary,
      fontSize: 14,
      fontWeight: "900",
    },
    value: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: "900",
    },
    breakdownRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    breakdownText: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: "700",
    },
    breakdownValue: {
      color: colors.surface,
      fontSize: 15,
      fontWeight: "800",
    },
    breakdownDivider: {
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
    actions: {
      gap: 12,
      paddingBottom: 24,
    },
    confirmButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: colors.accent,
      borderRadius: 24,
      paddingVertical: 16,
      minHeight: 56,
    },
    confirmText: {
      color: colors.accentText,
      fontSize: 18,
      fontWeight: "900",
    },
    editButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: colors.cardBackground,
      borderRadius: 24,
      paddingVertical: 16,
      minHeight: 56,
      borderWidth: 2,
      borderColor: colors.cardBorder,
    },
    editText: {
      color: colors.secondaryAccent,
      fontSize: 16,
      fontWeight: "900",
    },
  });
}
