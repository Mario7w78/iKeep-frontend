import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Theme } from "../../theme/colors";

type TimeChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export default function TimeChip({ label, selected, onPress }: TimeChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.text, selected && styles.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#51546e",
  },
  chipActive: {
    backgroundColor: "#5665dc",
  },
  text: {
    color: Theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: "900",
  },
  textActive: {
    color: Theme.colors.surface,
  },
});
