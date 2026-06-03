import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { DayOfWeek } from "../../../../domain/entities/Activity";
import { PartitionConfig } from "../../../../domain/entities/activity.types";
import { Theme } from "../../theme/colors";
import TimePartitionForm from "../../molecules/CreateActivity/TimePartitionForm";

type TimeConfigStepProps = {
  selectedDays: DayOfWeek[];
  configuredDays: DayOfWeek[];
  partitions: PartitionConfig[];
  activePartitionIndex: number;
  startTime: Date;
  durationTimeValue: number;
  travelTimeValue: number;
  isFixed: boolean;
  onSetActivePartition: (index: number) => void;
  onAddPartition: () => void;
  onDiscardPartition: () => void;
  onSetStartTime: (date: Date) => void;
  onSetDurationTime: (value: number) => void;
  onSetTravelTime: (value: number) => void;
};

export default function TimeConfigStep({
  selectedDays,
  configuredDays,
  partitions,
  activePartitionIndex,
  startTime,
  durationTimeValue,
  travelTimeValue,
  isFixed,
  onSetActivePartition,
  onAddPartition,
  onDiscardPartition,
  onSetStartTime,
  onSetDurationTime,
  onSetTravelTime,
}: TimeConfigStepProps) {
  const displayDays = selectedDays.length > 0 ? selectedDays : configuredDays;
  const firstDay = (displayDays[0] || "Día") as string;

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
        <View style={styles.dayBadge}>
          <Text style={styles.dayBadgeText}>{firstDay.charAt(0)}</Text>
        </View>
        <View style={styles.dayConfigTextBlock}>
          <Text style={styles.dayConfigTitle}>
            {selectedDays.length > 0
              ? selectedDays.join(" · ")
              : "Edita un grupo configurado"}
          </Text>
          <Text style={styles.dayConfigSubtitle}>
            Duración total: {totalGroupMinutes} min
          </Text>
        </View>
      </View>

      <TimePartitionForm
        partitions={partitions}
        activePartitionIndex={activePartitionIndex}
        startTime={startTime}
        durationTimeValue={durationTimeValue}
        travelTimeValue={travelTimeValue}
        isFixed={isFixed}
        onSetActivePartition={onSetActivePartition}
        onAddPartition={onAddPartition}
        onDiscardPartition={onDiscardPartition}
        onSetStartTime={onSetStartTime}
        onSetDurationTime={onSetDurationTime}
        onSetTravelTime={onSetTravelTime}
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
  dayBadge: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#b246ff",
  },
  dayBadgeText: {
    color: Theme.colors.surface,
    fontSize: 20,
    fontWeight: "900",
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
});
