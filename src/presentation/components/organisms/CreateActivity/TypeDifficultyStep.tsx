import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../../theme/colors";

type TypeDifficultyStepProps = {
  isFixed: boolean;
  identity: "clase" | "trabajo" | "tarea";
  difficulty: "baja" | "media" | "alta";
  onSetIsFixed: (fixed: boolean) => void;
  onSetDifficulty: (difficulty: "baja" | "media" | "alta") => void;
};

export default function TypeDifficultyStep({
  isFixed,
  identity,
  difficulty,
  onSetIsFixed,
  onSetDifficulty,
}: TypeDifficultyStepProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionTitle}>Tipo de actividad</Text>
      <View style={styles.twoColumnGrid}>
        <TouchableOpacity
          style={[
            styles.card,
            isFixed && styles.cardSelected,
            identity === "clase" && styles.cardDisabled,
          ]}
          disabled={identity === "clase"} // Classes cannot be optimizable, hence locked to fixed
          onPress={() => onSetIsFixed(true)}
        >
          <Ionicons
            name="time-outline"
            size={26}
            color={isFixed ? Theme.colors.surface : Theme.colors.iconPrimary}
          />
          <Text style={[styles.cardTitle, isFixed && styles.cardTitleSelected]}>Fijo</Text>
          <Text style={styles.cardDesc}>Anclado a una hora</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.card,
            !isFixed && styles.cardSelected,
            identity === "clase" && styles.cardDisabled,
          ]}
          disabled={identity === "clase"}
          onPress={() => onSetIsFixed(false)}
        >
          <Ionicons
            name="sparkles-outline"
            size={26}
            color={!isFixed ? Theme.colors.surface : Theme.colors.iconPrimary}
          />
          <Text style={[styles.cardTitle, !isFixed && styles.cardTitleSelected]}>Optimizable</Text>
          <Text style={styles.cardDesc}>Mejor ubicación</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Dificultad de la actividad</Text>
      <View style={styles.threeColumnGrid}>
        <TouchableOpacity
          style={[styles.card, difficulty === "baja" && styles.cardSelected]}
          onPress={() => onSetDifficulty("baja")}
        >
          <Ionicons
            name="leaf-outline"
            size={24}
            color={difficulty === "baja" ? Theme.colors.surface : Theme.colors.iconPrimary}
          />
          <Text style={[styles.cardTitle, difficulty === "baja" && styles.cardTitleSelected]}>Baja</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, difficulty === "media" && styles.cardSelected]}
          onPress={() => onSetDifficulty("media")}
        >
          <Ionicons
            name="speedometer-outline"
            size={24}
            color={difficulty === "media" ? Theme.colors.surface : Theme.colors.iconPrimary}
          />
          <Text style={[styles.cardTitle, difficulty === "media" && styles.cardTitleSelected]}>Normal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, difficulty === "alta" && styles.cardSelected]}
          onPress={() => onSetDifficulty("alta")}
        >
          <Ionicons
            name="flame-outline"
            size={24}
            color={difficulty === "alta" ? Theme.colors.surface : Theme.colors.iconPrimary}
          />
          <Text style={[styles.cardTitle, difficulty === "alta" && styles.cardTitleSelected]}>Alta</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 24,
    gap: 16,
  },
  sectionTitle: {
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 8,
    marginBottom: 4,
  },
  twoColumnGrid: {
    flexDirection: "row",
    gap: 14,
  },
  threeColumnGrid: {
    flexDirection: "row",
    gap: 10,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 6,
  },
  cardSelected: {
    backgroundColor: "#5665dc",
    borderColor: "#8dccff",
  },
  cardDisabled: {
    opacity: 0.35,
  },
  cardTitle: {
    color: Theme.colors.iconPrimary,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  cardTitleSelected: {
    color: Theme.colors.surface,
  },
  cardDesc: {
    color: Theme.colors.iconPrimary,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    opacity: 0.8,
  },
});
