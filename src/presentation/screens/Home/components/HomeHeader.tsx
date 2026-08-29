import React from "react";
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Sapo } from "../../../components/atoms/Mascot/Sapo";
import { StreakBadge } from "../../../components/atoms/Rewards/StreakBadge";
import { useTheme } from "../../../components/theme/colors";
import { dayFormatter } from "../HomeView.utils";
import { ExtendedViewStyle } from "./styles";

interface HomeHeaderProps {
  username: string;
  racha: { actual: number; enRiesgo: boolean };
  rachaNueva: boolean;
  progreso: { terminado: boolean };
}

export const HomeHeader = ({
  username,
  racha,
  rachaNueva,
  progreso,
}: HomeHeaderProps) => {
  const navigation = useNavigation<any>();
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.mascot}
        activeOpacity={0.75}
        onPress={() => navigation.navigate("AIChatView")}
      >
        <Sapo estado="idle" size={72} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Hola, {username || "Usuario"}. Tu día está listo.</Text>
        <Text style={styles.date}>{dayFormatter.format(new Date())}</Text>
      </View>
      <StreakBadge dias={racha.actual} enRiesgo={racha.enRiesgo} />
    </View>
  );
};

function createStyles(
  colors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['colors'],
  comfyColors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['comfyColors'],
  comfyFontColors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['comfyFontColors']
): Record<string, ViewStyle | TextStyle> {
  return {
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginBottom: 28,
    },
    mascot: {
      width: 58,
      height: 58,
      borderRadius: 29,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: `${comfyColors.green}24`,
      shadowColor: comfyColors.green,
      shadowOpacity: 0.45,
      shadowRadius: 18,
    },
    title: {
      color: colors.surface,
      fontSize: 20,
      fontStyle: "italic",
      fontWeight: "800",
    },
    date: {
      color: colors.textTertiary,
      fontSize: 14,
      marginTop: 2,
    },
  };
}