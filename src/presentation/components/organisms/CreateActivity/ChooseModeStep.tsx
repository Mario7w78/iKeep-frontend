import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../../theme/colors";

type ChooseModeStepProps = {
  onChooseText: () => void;
  onChooseManual: () => void;
};

export default function ChooseModeStep({
  onChooseText,
  onChooseManual,
}: ChooseModeStepProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Cómo quieres crear la actividad?</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={onChooseText}
        activeOpacity={0.85}
      >
        <View style={styles.cardIcon}>
          <Ionicons name="text-outline" size={28} color="#5665dc" />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>Texto libre</Text>
          <Text style={styles.cardSubtitle}>
            Describe tu actividad en palabras y nosotros la configuramos
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.3)" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={onChooseManual}
        activeOpacity={0.85}
      >
        <View style={styles.cardIcon}>
          <Ionicons name="settings-outline" size={28} color="#5665dc" />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>Manual</Text>
          <Text style={styles.cardSubtitle}>
            Completa los datos paso a paso en el formulario
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.3)" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 20,
    marginBottom: 65,
  },
  title: {
    color: Theme.colors.surface,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 2,
    borderColor: Theme.colors.cardBorder,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(86, 101, 220, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: Theme.colors.surface,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  cardSubtitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
});
