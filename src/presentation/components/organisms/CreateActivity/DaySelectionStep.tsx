import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DayOfWeek } from "../../../../domain/entities/Activity";
import { DayConfig } from "../../../../domain/entities/activity.types";
import { useTheme, comfyColors } from "../../theme/colors";
import DayPickerGrid from "../../molecules/CreateActivity/DayPickerGrid";

type DaySelectionStepProps = {
  selectedDays: DayOfWeek[];
  daysDict: Partial<Record<DayOfWeek, DayConfig>>;
  configuredDaysCount: number;
  isFixed: boolean;
  isAnchor: boolean;
  onSelectDay: (day: DayOfWeek) => void;
  isDayConfigured: (day: DayOfWeek) => boolean;
};

export default function DaySelectionStep({
  selectedDays,
  daysDict,
  configuredDaysCount,
  isFixed,
  isAnchor,
  onSelectDay,
  isDayConfigured,
}: DaySelectionStepProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const getSubtitle = () => {
    if (isFixed) {
      return "Selecciona los días para la actividad";
    }
    if (isAnchor) {
      return "Selecciona los días en los que se realizará la actividad (se repetirá cada día en el horario óptimo)";
    }
    return "Selecciona los días permitidos (el planificador elegirá un único día entre ellos. Deja vacío para cualquier día)";
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.iconHero}>
        <Ionicons
          name="calendar-outline"
          size={42}
          color={comfyColors.green}
        />
      </View>
      <Text style={styles.heroTitle}>Días</Text>
      <Text style={styles.heroSubtitle}>{getSubtitle()}</Text>

      <DayPickerGrid
        selectedDays={selectedDays}
        daysDict={daysDict}
        onSelect={onSelectDay}
        isDayConfigured={isDayConfigured}
      />

      <View style={styles.selectionSummary}>
        <Text style={styles.selectionSummaryText}>
          {selectedDays.length > 0
            ? `${selectedDays.length} día${selectedDays.length > 1 ? "s" : ""} seleccionado${selectedDays.length > 1 ? "s" : ""}`
            : !isFixed && !isAnchor
            ? "Cualquier día de la semana"
            : `${configuredDaysCount} día${configuredDaysCount !== 1 ? "s" : ""} configurado${configuredDaysCount !== 1 ? "s" : ""}`}
        </Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  iconHero: {
    alignItems: "center",
    marginTop: 8,
  },
  heroTitle: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  heroSubtitle: {
    color: colors.iconPrimary,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  selectionSummary: {
    backgroundColor: `${comfyColors.green}24`,
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  selectionSummaryText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "900",
  },
});
