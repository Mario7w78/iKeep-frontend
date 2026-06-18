import React, { useMemo } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/colors";

type SelectableCardProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
};

export default function SelectableCard({
  title,
  description,
  icon,
  selected,
  onPress,
}: SelectableCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={30} color={selected ? colors.secondaryAccentText : colors.surface} />
      <Text style={[styles.title, selected && { color: colors.secondaryAccentText }]}>{title}</Text>
      <Text style={[styles.description, selected && { color: colors.secondaryAccentText, opacity: 0.8 }]}>{description}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors) => StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 112,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    backgroundColor: colors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    gap: 6,
  },
  cardSelected: {
    backgroundColor: colors.secondaryAccent,
    borderColor: colors.cardBorder,
  },
  title: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  description: {
    color: colors.iconPrimary,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
});
