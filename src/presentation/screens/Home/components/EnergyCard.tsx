import React from "react";
import { View, Text, Pressable, TouchableOpacity, ViewStyle, TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../components/theme/colors";
import { EnergyLevelConfig } from "../HomeView.utils";
import { Reflexion } from "../../../../domain/services/energyReflection";

interface EnergyCardProps {
  selectedEnergy: EnergyLevelConfig & { gradient: readonly [string, string] };
  energyIndex: number;
  savedEnergyIndex: number;
  reflexion: Reflexion | null;
  moveEnergy: (direction: -1 | 1) => void;
  handleSaveEnergy: () => void;
}

export const EnergyCard = ({
  selectedEnergy,
  energyIndex,
  savedEnergyIndex,
  reflexion,
  moveEnergy,
  handleSaveEnergy,
}: EnergyCardProps) => {
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);

  return (
    <LinearGradient
      colors={selectedEnergy.gradient}
      style={[styles.card, styles.energyCard]}
    >
      <Text style={styles.cardTitle}>¿Cómo está tu nivel de energía hoy?</Text>
      <View style={styles.energySelector}>
        <Pressable onPress={() => moveEnergy(-1)} hitSlop={12}>
          <Ionicons name="chevron-back" size={34} color={colors.surface} />
        </Pressable>
        <View style={styles.energyOrb}>
          <Ionicons
            name={selectedEnergy.icon as any}
            size={40}
            color={selectedEnergy.iconColor}
          />
        </View>
        <Pressable onPress={() => moveEnergy(1)} hitSlop={12}>
          <Ionicons name="chevron-forward" size={34} color={colors.surface} />
        </Pressable>
      </View>
      <Text style={styles.energyLabel}>{selectedEnergy.label}</Text>

      {energyIndex !== savedEnergyIndex && (
        <TouchableOpacity
          style={[
            styles.saveEnergyButton,
            { backgroundColor: selectedEnergy.iconColor },
          ]}
          activeOpacity={0.8}
          onPress={handleSaveEnergy}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={18}
            color={colors.screenBackground}
          />
          <Text style={styles.saveEnergyButtonText}>Guardar</Text>
        </TouchableOpacity>
      )}

      {reflexion?.texto && (
        <View style={styles.reflexion} testID="reflexion-energia">
          <View style={styles.huecoSapo} testID="hueco-sapo" />
          <Text style={styles.reflexionTexto}>{reflexion.texto}</Text>
        </View>
      )}
    </LinearGradient>
  );
};

function createStyles(
  colors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['colors'],
  comfyColors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['comfyColors'],
  comfyFontColors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['comfyFontColors']
): Record<string, ViewStyle | TextStyle> {
  return {
    card: {
      backgroundColor: colors.cardBackground,
      borderColor: colors.cardBorder,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 18,
      marginBottom: 22,
    },
    energyCard: {
      minHeight: 200,
    },
    cardTitle: {
      color: colors.surface,
      fontSize: 18,
      fontWeight: "800",
      textAlign: "center",
    },
    energySelector: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      marginTop: 18,
    },
    energyOrb: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: "#000",
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    energyLabel: {
      color: colors.surface,
      fontSize: 13,
      fontWeight: "800",
      textAlign: "center",
    },
    saveEnergyButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      height: 38,
      borderRadius: 12,
      marginTop: 12,
      paddingHorizontal: 16,
      alignSelf: "center",
    },
    saveEnergyButtonText: {
      color: "#2b2d3b",
      fontSize: 14,
      fontWeight: "900",
    },
    reflexion: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 16,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
    },
    huecoSapo: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.cardBorder,
    },
    reflexionTexto: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
  };
}