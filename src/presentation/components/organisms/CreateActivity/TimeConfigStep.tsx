import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { DayOfWeek } from "../../../../domain/entities/Activity";
import { PartitionConfig } from "../../../../domain/entities/activity.types";
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
}: TimeConfigStepProps) {
  const displayDays = selectedDays.length > 0 ? selectedDays : configuredDays;

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

      <View style={styles.dayConfigHeader}>
        <View style={styles.dayConfigTextBlock}>
          <Text style={styles.headerContextLabel}>Días configurados:</Text>
          <View style={styles.chipsRow}>
            {displayDays.map((day) => (
              <View key={day} style={styles.dayChip}>
                <Text style={styles.dayChipText}>{getDayAbbreviation(day)}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.dayConfigSubtitle}>
            Duración total: {totalGroupMinutes} min
          </Text>
        </View>
      </View>

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
  dayConfigTitle: {
    color: Theme.colors.surface,
    fontSize: 18,
    fontWeight: "900",
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
    gap: 8,
    marginBottom: 10,
  },
  dayChip: {
    backgroundColor: "rgba(86, 101, 220, 0.18)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(86, 101, 220, 0.3)",
  },
  dayChipText: {
    color: "#8dccff",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
});
