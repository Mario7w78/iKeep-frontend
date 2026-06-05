import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DayOfWeek } from "../../../../domain/entities/Activity";
import { PartitionConfig, DayConfig } from "../../../../domain/entities/activity.types";
import { Theme } from "../../theme/colors";
import TimePartitionForm from "../../molecules/CreateActivity/TimePartitionForm";

const getDayAbbreviation = (day: string) => {
  switch (day) {
    case "Lunes": return "Lun";
    case "Martes": return "Mar";
    case "Miercoles": return "Mié";
    case "Jueves": return "Jue";
    case "Viernes": return "Vie";
    case "Sabado": return "Sáb";
    case "Domingo": return "Dom";
    default: return day;
  }
};

type TimeConfigStepProps = {
  selectedDays: DayOfWeek[];
  configuredDays: DayOfWeek[];
  partitions: PartitionConfig[];
  activePartitionIndex: number;
  startTime: Date;
  endTime: Date;
  durationTimeValue: number;
  travelTimeValue: number;
  isFixed: boolean;
  preferredStartTime: number | null;
  preferredEndTime: number | null;
  onSetActivePartition: (index: number) => void;
  onAddPartition: () => void;
  onDiscardPartition: () => void;
  onSetStartTime: (date: Date) => void;
  onSetEndTime: (date: Date) => void;
  onSetDurationTime: (value: number) => void;
  onSetTravelTime: (value: number) => void;
  onSetPreferredStartTime: (val: number | null) => void;
  onSetPreferredEndTime: (val: number | null) => void;

  groups: Record<number, { days: DayOfWeek[]; config: DayConfig }>;
  activeGroupId: number | null;
  onSwitchGroup: (groupId: number) => void;
  onCopyConfig: (fromDay: DayOfWeek) => void;
};

export default function TimeConfigStep({
  selectedDays,
  configuredDays,
  partitions,
  activePartitionIndex,
  startTime,
  endTime,
  durationTimeValue,
  travelTimeValue,
  isFixed,
  preferredStartTime,
  preferredEndTime,
  onSetActivePartition,
  onAddPartition,
  onDiscardPartition,
  onSetStartTime,
  onSetEndTime,
  onSetDurationTime,
  onSetTravelTime,
  onSetPreferredStartTime,
  onSetPreferredEndTime,
  
  groups,
  activeGroupId,
  onSwitchGroup,
  onCopyConfig,
}: TimeConfigStepProps) {
  const activeGroup = groups[activeGroupId ?? -1];
  const displayDays = activeGroup ? activeGroup.days : [];

  const otherConfiguredDays = configuredDays.filter(
    (day) => !displayDays.includes(day)
  );

  const totalGroupMinutes = partitions.reduce(
    (sum, p) => sum + p.durationTime + p.travelTime,
    0
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.stepTitle}>Configuración detallada</Text>
      <Text style={styles.stepSubtitle}>Ajusta los parámetros de horario</Text>

      {/* Group Tabs Selection */}
      {Object.keys(groups).length > 1 && (
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsContainer}
            contentContainerStyle={styles.tabsContent}
          >
            {Object.entries(groups).map(([idStr, gp]) => {
              const id = Number(idStr);
              const isActive = id === activeGroupId;
              const daysLabel = gp.days.map(getDayAbbreviation).join(", ");
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  onPress={() => onSwitchGroup(id)}
                >
                  <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                    {daysLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={styles.dayConfigHeader}>
        <View style={styles.dayConfigTextBlock}>
          <Text style={styles.headerContextLabel}>Día:</Text>
          <View style={styles.chipsRow}>
            {displayDays.map((day) => {
              return (
                <View key={day} style={styles.dayChipContainer}>
                  <View style={styles.dayChip}>
                    <Text style={styles.dayChipText}>{getDayAbbreviation(day)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
          <Text style={styles.dayConfigSubtitle}>
            Duración total: {totalGroupMinutes} min
          </Text>
        </View>
      </View>

      {otherConfiguredDays.length > 0 && (
        <View style={styles.copyConfigSection}>
          <Text style={styles.copyConfigTitle}>Copiar horario de:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.copyConfigRow}
          >
            {otherConfiguredDays.map((day) => (
              <TouchableOpacity
                key={day}
                style={styles.copyDayButton}
                onPress={() => onCopyConfig(day)}
              >
                <Ionicons name="copy-outline" size={14} color="#8dccff" style={{ marginRight: 4 }} />
                <Text style={styles.copyDayButtonText}>{getDayAbbreviation(day)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <TimePartitionForm
        partitions={partitions}
        activePartitionIndex={activePartitionIndex}
        startTime={startTime}
        endTime={endTime}
        durationTimeValue={durationTimeValue}
        travelTimeValue={travelTimeValue}
        isFixed={isFixed}
        preferredStartTime={preferredStartTime}
        preferredEndTime={preferredEndTime}
        onSetActivePartition={onSetActivePartition}
        onAddPartition={onAddPartition}
        onDiscardPartition={onDiscardPartition}
        onSetStartTime={onSetStartTime}
        onSetEndTime={onSetEndTime}
        onSetDurationTime={onSetDurationTime}
        onSetTravelTime={onSetTravelTime}
        onSetPreferredStartTime={onSetPreferredStartTime}
        onSetPreferredEndTime={onSetPreferredEndTime}
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
    paddingBottom: 16,
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
  tabsWrapper: {
    marginVertical: 4,
  },
  tabsLabel: {
    color: Theme.colors.iconPrimary,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },
  tabsContainer: {
    flexDirection: "row",
  },
  tabsContent: {
    gap: 8,
    paddingBottom: 4,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 2,
    borderColor: Theme.colors.cardBorder,
  },
  tabButtonActive: {
    backgroundColor: "#5665dc",
    borderColor: "#8dccff",
  },
  tabButtonText: {
    color: Theme.colors.iconPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  tabButtonTextActive: {
    color: Theme.colors.surface,
    fontWeight: "900",
  },
  dayConfigHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 24,
    padding: 16,
    gap: 16,
  },
  dayConfigTextBlock: {
    flex: 1,
  },
  dayConfigSubtitle: {
    color: Theme.colors.textSecondary,
    fontSize: 15,
    fontWeight: "800",
  },
  headerContextLabel: {
    color: Theme.colors.iconPrimary,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  dayChipContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(86, 101, 220, 0.12)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(86, 101, 220, 0.25)",
    gap: 6,
  },
  dayChip: {
    backgroundColor: "transparent",
  },
  dayChipText: {
    color: "#8dccff",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  copyConfigSection: {
    marginVertical: 4,
  },
  copyConfigTitle: {
    color: Theme.colors.iconPrimary,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },
  copyConfigRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 4,
  },
  copyDayButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 2,
    borderColor: Theme.colors.cardBorder,
  },
  copyDayButtonText: {
    color: Theme.colors.surface,
    fontSize: 13,
    fontWeight: "800",
  },
});
