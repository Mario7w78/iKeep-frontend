import React from "react";
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../components/theme/colors";

interface ChangeActionsProps {}

export const ChangeActions = () => {
  const navigation = useNavigation<any>();
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);

  return (
    <View style={styles.card}>
      <Text style={styles.changeTitle}>¿Algo cambió hoy?</Text>
      <Text style={styles.changeSubtitle}>
        Crea una actividad o administra las que ya tienes
      </Text>
      <TouchableOpacity
        style={styles.actionButton}
        activeOpacity={0.75}
        onPress={() => navigation.navigate("CreateActivityModal")}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.surface} />
        <Text style={styles.actionText}>Crear nueva actividad</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        activeOpacity={0.75}
        onPress={() => navigation.navigate("Activities")}
      >
        <Ionicons name="list-outline" size={20} color={colors.surface} />
        <Text style={styles.actionText}>Ver mis actividades</Text>
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
    card: {
      backgroundColor: colors.cardBackground,
      borderColor: colors.cardBorder,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 18,
      marginBottom: 22,
    },
    changeTitle: {
      color: colors.surface,
      fontSize: 20,
      fontWeight: "900",
    },
    changeSubtitle: {
      color: colors.surface,
      fontSize: 15,
      marginTop: 4,
      marginBottom: 18,
    },
    actionButton: {
      height: 44,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      marginTop: 11,
    },
    actionText: {
      color: colors.surface,
      fontSize: 14,
      fontWeight: "800",
    },
  };
}