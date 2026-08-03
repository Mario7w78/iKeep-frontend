import React, { useMemo } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { DayOfWeek } from "../../../../domain/entities/Activity";
import { useTheme } from "../../theme/colors";

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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        // The border marks "this day already has a time configured"; the fill
        // marks "this day is selected right now". Keeping them on separate
        // channels is what makes deselecting visible — previously `configured`
        // won over `selected`, so tapping a configured day to remove it left
        // the button looking identical and the tap seemed to do nothing.
        configured && styles.buttonConfigured,
        selected
          ? configuredColor
            ? { backgroundColor: configuredColor }
            : styles.buttonSelected
          : null,
      ]}
    >
      <Text
        style={[
          styles.letter,
          selected && configuredTextColor
            ? { color: configuredTextColor }
            : selected && styles.textSelected,
        ]}
      >
        {letter}
      </Text>
      <Text
        style={[
          styles.name,
          selected && configuredTextColor
            ? { color: configuredTextColor }
            : selected && styles.textSelected,
        ]}
      >
        {day.substring(0, 3)}
      </Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors) => StyleSheet.create({
  button: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: colors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonConfigured: {
    borderWidth: 2,
    borderColor: colors.iconPrimary,
  },
  buttonSelected: {
    backgroundColor: colors.secondaryAccent,
  },
  letter: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: "900",
  },
  name: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  textSelected: {
    color: colors.secondaryAccentText,
  },
});
