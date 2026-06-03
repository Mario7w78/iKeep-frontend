import React from "react";
import { View, StyleSheet } from "react-native";
import { DayOfWeek } from "../../../../domain/entities/Activity";
import { DayConfig } from "../../../../domain/entities/activity.types";
import { Theme } from "../../theme/colors";
import DayButton from "../../atoms/CreateActivity/DayButton";

const DAY_LETTERS: Record<DayOfWeek, string> = {
  Lunes: "L",
  Martes: "M",
  Miercoles: "X",
  Jueves: "J",
  Viernes: "V",
  Sabado: "S",
  Domingo: "D",
};

const DAYS: DayOfWeek[] = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

type DayPickerGridProps = {
  selectedDays: DayOfWeek[];
  daysDict: Partial<Record<DayOfWeek, DayConfig>>;
  onSelect: (day: DayOfWeek) => void;
  isDayConfigured: (day: DayOfWeek) => boolean;
};

export default function DayPickerGrid({
  selectedDays,
  daysDict,
  onSelect,
  isDayConfigured,
}: DayPickerGridProps) {
  return (
    <View style={styles.grid}>
      {DAYS.map((day) => {
        const selected = selectedDays.includes(day);
        const configured = isDayConfigured(day);
        const config = daysDict[day];
        const configuredColor = config
          ? Theme.groupColors[config.groupId % Theme.groupColors.length].bg
          : undefined;

        return (
          <DayButton
            key={day}
            day={day}
            letter={DAY_LETTERS[day]}
            selected={selected}
            configured={configured}
            configuredColor={configuredColor}
            onPress={() => onSelect(day)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
  },
});
