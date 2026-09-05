import React from "react";
import { View, Text, TextStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme, ThemeColors } from "../../../components/theme/colors";
import { DailyProgress } from "../../../components/atoms/Rewards/DailyProgress";
import { PESO, TEXTO } from "../../../components/theme/tokens";
import { ExtendedViewStyle } from "./styles";

interface ProgressCardProps {
  completadas: number;
  total: number;
  fraccion: number;
}

export const ProgressCard = ({ completadas, total, fraccion }: ProgressCardProps) => {
  const { comfyColors, colors } = useTheme();
  const styles = React.useMemo(
    () => createStyles(comfyColors, colors),
    [comfyColors, colors]
  );

  return (
    <View style={styles.progresoDelDia}>
      <View style={styles.contenido}>
        <View style={styles.iconoContenedor}>
          <Svg width={30} height={30} viewBox="0 0 127 127">
            <Path
              d="M63.5 3.5C69.8782 3.5 76.0173 4.49725 81.7764 6.33691L70.4551 48.5938L68.8857 54.4502L74.7412 52.8809L119.133 40.9854C121.948 47.9338 123.5 55.5318 123.5 63.5C123.5 96.6371 96.6371 123.5 63.5 123.5C30.3629 123.5 3.5 96.6371 3.5 63.5C3.5 30.3629 30.3629 3.5 63.5 3.5Z"
              fill="#BDFCA3"
              stroke="white"
              strokeWidth={7}
            />
          </Svg>
        </View>
        <View style={styles.info}>
          <Text style={styles.texto}>Progreso del día</Text>
          <DailyProgress
            completadas={completadas}
            total={total}
            fraccion={fraccion}
          />
        </View>
      </View>
    </View>
  );
};

function createStyles(
  comfyColors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['comfyColors'],
  colors: ThemeColors
): Record<string, ExtendedViewStyle | TextStyle> {
  return {
    progresoDelDia: {
      padding: 16,
      backgroundColor: comfyColors.green,
      borderRadius: 12,
      marginBottom: 18,
    },
    contenido: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    iconoContenedor: {
      alignItems: "center",
      justifyContent: "center",
    },
    info: {
      flex: 1,
    },
    texto: {
      fontSize: TEXTO.cuerpo,
      fontWeight: PESO.fuerte,
      color: colors.screenBackground,
      marginBottom: 8,
    },
  };
}
