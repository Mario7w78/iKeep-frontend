import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { DayOfWeek } from "../../../../domain/entities/Activity";
import { Theme } from "../../theme/colors";

type DayButtonProps = {
  day: DayOfWeek;
  letter: string;
  selected: boolean;
  configured: boolean;
  configuredColor?: string;
  configuredTextColor?: string;
  onPress: () => void;
};

export default function DayButton({
  day,
  letter,
  selected,
  configured,
  configuredColor,
  configuredTextColor,
  onPress,
}: DayButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        configured && styles.buttonConfigured,
        configuredColor ? { backgroundColor: configuredColor } : null,
        selected && styles.buttonSelected,
      ]}
    >
      <Text
        style={[
          styles.letter,
          configuredTextColor ? { color: configuredTextColor } : null,
          selected && styles.textSelected,
        ]}
      >
        {letter}
      </Text>
      <Text
        style={[
          styles.name,
          configuredTextColor ? { color: configuredTextColor } : null,
          selected && styles.textSelected,
        ]}
      >
        {day.substring(0, 3)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: Theme.colors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonConfigured: {
    borderWidth: 2,
    borderColor: Theme.colors.iconPrimary,
  },
  buttonSelected: {
    backgroundColor: "#5665dc",
  },
  letter: {
    color: Theme.colors.surface,
    fontSize: 22,
    fontWeight: "900",
  },
  name: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  textSelected: {
    color: Theme.colors.surface,
  },
});
