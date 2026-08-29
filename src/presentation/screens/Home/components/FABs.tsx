import React from "react";
import { TouchableOpacity, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../../components/theme/colors";
import { ExtendedViewStyle } from "./styles";

interface FABsProps {}

export const FABs = () => {
  const navigation = useNavigation<any>();
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);

  return (
    <>
      <TouchableOpacity
        style={styles.fabChatBtn}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("AIChatView")}
      >
        <Ionicons name="chatbubbles-outline" size={26} color={comfyColors.green} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.fabCreateBtn}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("CreateActivityModal")}
      >
        <Ionicons name="add" size={32} color={comfyFontColors.green} />
      </TouchableOpacity>
    </>
  );
};

function createStyles(
  colors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['colors'],
  comfyColors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['comfyColors'],
  comfyFontColors: ReturnType<typeof import("../../../components/theme/colors").useTheme>['comfyFontColors']
): Record<string, ViewStyle> {
  return {
    fabChatBtn: {
      position: 'absolute',
      bottom: 84,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.cardBackground,
      borderWidth: 1.5,
      borderColor: comfyColors.green,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 6,
    },
    fabCreateBtn: {
      position: 'absolute',
      bottom: 16,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: comfyColors.green,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 6,
    },
  };
}