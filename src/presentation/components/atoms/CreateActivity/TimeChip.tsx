import React, { useMemo } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useTheme } from "../../theme/colors";

type TimeChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export default function TimeChip({ label, selected, onPress }: TimeChipProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.text, selected && styles.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors) => StyleSheet.create({
  chip: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#51546e",
  },
  chipActive: {
    backgroundColor: colors.secondaryAccent,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "900",
  },
  textActive: {
    color: colors.secondaryAccentText,
  },
});
