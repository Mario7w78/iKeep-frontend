import React from "react";
import { View, Text } from "react-native";
import { useTheme, ThemeColors } from "../../../components/theme/colors";
import { DailyProgress } from "../../../components/atoms/Rewards/DailyProgress";
import { PESO, TEXTO } from "../../../components/theme/tokens";

interface ProgressCardProps {
  completadas: number;
  total: number;
  fraccion: number;
}

export const ProgressCard = ({ completadas, total, fraccion }: ProgressCardProps) => {
  const { comfyColors, comfyFontColors, colors } = useTheme();
  const styles = React.useMemo(() => createStyles(comfyColors, comfyFontColors, colors), [comfyColors, comfyFontColors, colors]);

  return (
    <View style={styles.progresoDelDia}>
      <Text style={styles.texto}>
        Progreso del día
      </Text>
      <DailyProgress
        completadas={completadas}
        total={total}
        fraccion={fraccion}
      />
    </View>
  );
};

function createStyles(
  comfyColors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['comfyColors'],
  comfyFontColors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['comfyFontColors'],
  colors: ThemeColors
) {
  return {
    progresoDelDia: {
      marginBottom: 18,
    },
    texto: {
          fontSize: TEXTO.destacado,
          fontWeight: PESO.fuerte,
          color: colors.success,
        },
  };
}