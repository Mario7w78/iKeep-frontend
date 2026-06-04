import React from "react";
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../../theme/colors";

type NameIdentityStepProps = {
  activityName: string;
  identity: "clase" | "trabajo" | "tarea";
  isFixed: boolean;
  difficulty: "baja" | "media" | "alta";
  onSetActivityName: (name: string) => void;
  onSetIdentity: (identity: "clase" | "trabajo" | "tarea") => void;
  onSetIsFixed: (fixed: boolean) => void;
  onSetDifficulty: (difficulty: "baja" | "media" | "alta") => void;
};

export default function NameIdentityStep({
  activityName,
  identity,
  isFixed,
  difficulty,
  onSetActivityName,
  onSetIdentity,
  onSetIsFixed,
  onSetDifficulty,
}: NameIdentityStepProps) {
  // Determine dynamic icon based on keyword detection
  const getDynamicIconName = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("uni") || lowerName.includes("clase") || lowerName.includes("estudiar")) {
      return "school-outline";
    }
    if (lowerName.includes("trabajo") || lowerName.includes("reunion")) {
      return "briefcase-outline";
    }
    return "document-text-outline";
  };

  const dynamicIconName = getDynamicIconName(activityName);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionTitle}>Nombre de la actividad</Text>
      <View style={styles.inputContainer}>
        <Ionicons
          name={dynamicIconName as any}
          size={24}
          color={Theme.colors.iconPrimary}
          style={styles.inputIcon}
        />
        <TextInput
          value={activityName}
          onChangeText={onSetActivityName}
          placeholder="Ej. Seminario de investigación o Trabajo"
          placeholderTextColor="rgba(255,255,255,0.4)"
          style={styles.nameInput}
          returnKeyType="next"
        />
      </View>

      <Text style={styles.sectionTitle}>Identidad de la actividad</Text>
      <View style={styles.threeColumnGrid}>
        <TouchableOpacity
          style={[styles.card, identity === "clase" && styles.cardSelected]}
          onPress={() => {
            onSetIdentity("clase");
            onSetIsFixed(true); // Classes are inherently fixed
            onSetDifficulty("media"); // Default difficulty when locked
          }}
        >
          <Ionicons
            name="school-outline"
            size={24}
            color={identity === "clase" ? Theme.colors.surface : Theme.colors.iconPrimary}
          />
          <Text style={[styles.cardTitle, identity === "clase" && styles.cardTitleSelected]}>Clase</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, identity === "trabajo" && styles.cardSelected]}
          onPress={() => {
            onSetIdentity("trabajo");
          }}
        >
          <Ionicons
            name="briefcase-outline"
            size={24}
            color={identity === "trabajo" ? Theme.colors.surface : Theme.colors.iconPrimary}
          />
          <Text style={[styles.cardTitle, identity === "trabajo" && styles.cardTitleSelected]}>Trabajo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, identity === "tarea" && styles.cardSelected]}
          onPress={() => {
            onSetIdentity("tarea");
            onSetIsFixed(false); // Default to optimizable
          }}
        >
          <Ionicons
            name="checkmark-done-circle-outline"
            size={24}
            color={identity === "tarea" ? Theme.colors.surface : Theme.colors.iconPrimary}
          />
          <Text style={[styles.cardTitle, identity === "tarea" && styles.cardTitleSelected]}>Tarea</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Tipo de actividad</Text>
      <View style={styles.twoColumnGrid}>
        <TouchableOpacity
          style={[
            styles.card,
            isFixed && styles.cardSelected,
            identity === "clase" && styles.cardDisabled,
          ]}
          disabled={identity === "clase"} // Classes cannot be optimizable, hence locked to fixed
          onPress={() => {
            onSetIsFixed(true);
            onSetDifficulty("media"); // Auto set to media if fixed
          }}
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
          style={[
            styles.card,
            difficulty === "baja" && styles.cardSelected,
            isFixed && difficulty !== "baja" && styles.cardDisabled,
          ]}
          disabled={isFixed} // Difficulty is locked/disabled for fixed activities
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
          style={[
            styles.card,
            difficulty === "media" && styles.cardSelected,
            isFixed && difficulty !== "media" && styles.cardDisabled,
          ]}
          disabled={isFixed}
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
          style={[
            styles.card,
            difficulty === "alta" && styles.cardSelected,
            isFixed && difficulty !== "alta" && styles.cardDisabled,
          ]}
          disabled={isFixed}
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Theme.colors.cardBorder,
    borderRadius: 20,
    backgroundColor: Theme.colors.cardBackground,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  nameInput: {
    flex: 1,
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "800",
    paddingVertical: 14,
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
