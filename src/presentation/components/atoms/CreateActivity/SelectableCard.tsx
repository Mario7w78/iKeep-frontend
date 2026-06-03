import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../../theme/colors";

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
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={30} color={Theme.colors.surface} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 112,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    gap: 6,
  },
  cardSelected: {
    backgroundColor: "#5665dc",
    borderColor: Theme.colors.cardBorder,
  },
  title: {
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  description: {
    color: Theme.colors.iconPrimary,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
});
