import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DayOfWeek } from "../../../../domain/entities/Activity";
import { DayConfig } from "../../../../domain/entities/activity.types";
import { Theme } from "../../theme/colors";
import DayPickerGrid from "../../molecules/CreateActivity/DayPickerGrid";
import GroupList from "../../molecules/CreateActivity/GroupList";

type DaySelectionStepProps = {
  selectedDays: DayOfWeek[];
  daysDict: Partial<Record<DayOfWeek, DayConfig>>;
  groups: Record<number, { days: DayOfWeek[]; config: DayConfig }>;
  editingGroupId: number | null;
  configuredDaysCount: number;
  isFixed: boolean;
  onSelectDay: (day: DayOfWeek) => void;
  isDayConfigured: (day: DayOfWeek) => boolean;
  onEditGroup: (group: {
    groupId: number;
    days: DayOfWeek[];
    config: DayConfig;
  }) => void;
  onDiscardGroup: (groupId: number) => void;
};

export default function DaySelectionStep({
  selectedDays,
  daysDict,
  groups,
  editingGroupId,
  configuredDaysCount,
  isFixed,
  onSelectDay,
  isDayConfigured,
  onEditGroup,
  onDiscardGroup,
}: DaySelectionStepProps) {
  const hasGroups = Object.keys(groups).length > 0;

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
      <Text style={styles.heroTitle}>Selección de días</Text>
      <Text style={styles.heroSubtitle}>¿Qué días tienes esta actividad?</Text>

      <View style={styles.infoCard}>
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={Theme.comfyColors.skyBlue}
        />
        <Text style={styles.infoText}>
          ¿Horarios distintos? Configura un grupo a la vez. Al guardar, regresarás aquí para configurar los días restantes.
        </Text>
      </View>

      {hasGroups && (
        <View style={styles.sectionHeader}>
          <Ionicons name="albums-outline" size={18} color={Theme.colors.iconPrimary} />
          <Text style={styles.sectionHeaderText}>
            Tienes {Object.keys(groups).length} grupo
            {Object.keys(groups).length > 1 ? "s" : ""} configurado
            {Object.keys(groups).length > 1 ? "s" : ""}
          </Text>
        </View>
      )}

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

      {hasGroups && (
        <GroupList
          groups={groups}
          editingGroupId={editingGroupId}
          isFixed={isFixed}
          onEditGroup={onEditGroup}
          onDiscardGroup={onDiscardGroup}
        />
      )}

      {hasGroups && selectedDays.length === 0 && (
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color={Theme.comfyColors.green} />
          <Text style={styles.tipText}>
            Seleccioná más días para crear otro grupo con horarios diferentes
          </Text>
        </View>
      )}
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
    paddingBottom: 16,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  sectionHeaderText: {
    color: Theme.colors.iconPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  selectionSummary: {
    backgroundColor: "rgba(141,255,104,0.14)",
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
  },
  selectionSummaryText: {
    color: Theme.colors.surface,
    fontSize: 15,
    fontWeight: "900",
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(141,255,104,0.08)",
    borderRadius: 16,
    padding: 14,
  },
  tipText: {
    flex: 1,
    color: Theme.colors.iconPrimary,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(165,178,235,0.08)",
    borderWidth: 1,
    borderColor: "rgba(165,178,235,0.22)",
    borderRadius: 18,
    padding: 14,
    marginTop: 4,
    marginBottom: 4,
  },
  infoText: {
    flex: 1,
    color: Theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
});
