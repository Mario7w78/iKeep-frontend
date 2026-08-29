import React from "react";
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../components/theme/colors";

interface EmptyStateProps {}

export const EmptyState = () => {
  const navigation = useNavigation<any>();
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="calendar-outline" size={54} color={comfyColors.skyBlue} />
      </View>
      <Text style={styles.emptyTitle}>No hay actividades</Text>
      <Text style={styles.emptyDescription}>
        Crea tu primera actividad para que Lotus pueda armar tu horario.
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("CreateActivityModal")}
      >
        <Ionicons name="add-circle-outline" size={22} color={comfyFontColors.green} />
        <Text style={styles.emptyButtonText}>Crear actividad manualmente</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.emptyButton, styles.emptyButtonSecondary]}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("AIChatView")}
      >
        <Ionicons name="chatbubbles-outline" size={22} color={comfyColors.green} />
        <Text style={[styles.emptyButtonText, { color: comfyColors.green }]}>Crear actividad con el asistente</Text>
      </TouchableOpacity>
    </View>
  );
};

function createStyles(
  colors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['colors'],
  comfyColors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['comfyColors'],
  comfyFontColors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['comfyFontColors']
): Record<string, ViewStyle | TextStyle> {
  return {
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
    },
    emptyIcon: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(165, 178, 235, 0.15)",
      borderColor: comfyColors.skyBlue,
      borderWidth: 2,
      borderStyle: "dashed",
      marginBottom: 22,
    },
    emptyTitle: {
      color: colors.surface,
      fontSize: 24,
      fontWeight: "900",
      marginBottom: 8,
    },
    emptyDescription: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 26,
      textAlign: "center",
    },
    emptyButton: {
      minHeight: 52,
      borderRadius: 18,
      backgroundColor: comfyColors.green,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 28,
      width: '100%',
    },
    emptyButtonSecondary: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: comfyColors.green,
      marginTop: 12,
    },
    emptyButtonText: {
      color: comfyFontColors.green,
      fontSize: 16,
      fontWeight: "900",
    },
  };
}