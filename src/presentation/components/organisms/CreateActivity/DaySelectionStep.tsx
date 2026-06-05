import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DayOfWeek } from "../../../../domain/entities/Activity";
import { DayConfig } from "../../../../domain/entities/activity.types";
import { Theme } from "../../theme/colors";
import DayPickerGrid from "../../molecules/CreateActivity/DayPickerGrid";

type DaySelectionStepProps = {
  selectedDays: DayOfWeek[];
  daysDict: Partial<Record<DayOfWeek, DayConfig>>;
  configuredDaysCount: number;
  isFixed: boolean;
  onSelectDay: (day: DayOfWeek) => void;
  isDayConfigured: (day: DayOfWeek) => boolean;
};

export default function DaySelectionStep({
  selectedDays,
  daysDict,
  configuredDaysCount,
  isFixed,
  onSelectDay,
  isDayConfigured,
}: DaySelectionStepProps) {
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
          color={Theme.comfyColors.green}
        />
      </View>
      <Text style={styles.heroTitle}>Días</Text>
      <Text style={styles.heroSubtitle}>Selecciona los días para la actividad</Text>

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
            : `${configuredDaysCount} día${configuredDaysCount !== 1 ? "s" : ""} configurado${configuredDaysCount !== 1 ? "s" : ""}`}
        </Text>
      </View>
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
  iconHero: {
    alignItems: "center",
    marginTop: 8,
  },
  heroTitle: {
    color: Theme.colors.surface,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  heroSubtitle: {
    color: Theme.colors.iconPrimary,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  selectionSummary: {
    backgroundColor: "rgba(141,255,104,0.14)",
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  selectionSummaryText: {
    color: Theme.colors.surface,
    fontSize: 15,
    fontWeight: "900",
  },
});
