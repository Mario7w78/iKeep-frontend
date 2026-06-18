import { useMemo } from "react";
import { View, Text, StyleSheet, GestureResponderEvent } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";
import { SwitchRow } from "../../atoms/Common/SwitchRow";
import { useTheme, ThemeColors } from "../../theme/colors";
import { TimePickerSection } from "../../molecules/Time/TimePickerSection";

interface props {
  isFixed: boolean;
  setIsFixed: React.Dispatch<React.SetStateAction<boolean>>;
  updateTime: (
    hourString: string,
    minuteString: string,
    period: string,
  ) => void;
  time?: Date;
  flashTrigger?: number;
  onStartResponderCapture:
    | ((event: GestureResponderEvent) => boolean)
    | undefined;
  onResponderRelease: ((event: GestureResponderEvent) => void) | undefined;
}
export const HourSection = ({
  isFixed,
  setIsFixed,
  updateTime,
  time,
  flashTrigger,
  onStartResponderCapture,
  onResponderRelease,
}: props) => {
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);
  return (
    <View style={styles.timeSection}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={styles.icon2Container}>
            <AntDesign name="clock-circle" size={20} color={colors.iconPrimary} />
          </View>
          <View style={{ flexDirection: "column" }}>
            <Text style={styles.label}>Hora fija</Text>
            <Text style={styles.descriptionLabel}>
              El algoritmo respetará esta hora
            </Text>
          </View>
        </View>
        <SwitchRow
          label="Hora fija"
          value={isFixed}
          onValueChange={setIsFixed}
        />
      </View>

      {isFixed && (
        <View
          onStartShouldSetResponderCapture={onStartResponderCapture}
          onResponderRelease={onResponderRelease}
        >
          <TimePickerSection onTimeChange={updateTime} time={time} flashTrigger={flashTrigger} />
        </View>
      )}

      {!isFixed && (
        <View>
          <Text style={styles.messages}>
            (El algoritmo le asignará un intervalo de tiempo óptimo)
          </Text>
        </View>
      )}
    </View>
  );
};

function createStyles(colors: ThemeColors, _comfyColors: Record<string, string>, _comfyFontColors: Record<string, string>) {
  return StyleSheet.create({
    section: {
      width: "50%",
    },
    timeSection: {
      flexDirection: "column",
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 20,
    },
    timeInnerSection: {
      flexDirection: "row",
    },
    inputSection: {
      flexDirection: "row",
      gap: 5,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 10,
    },
    iconContainer: {
      backgroundColor: colors.cardBorder,
      borderRadius: 7,
      width: 25,
      height: 25,
      justifyContent: "center",
      alignItems: "center",
    },
    icon2Container: {
      backgroundColor: colors.cardBackground,
      borderRadius: 7,
      width: 35,
      height: 35,
      justifyContent: "center",
      alignItems: "center",
    },
    labelSmall: {
      fontSize: 20,
      color: colors.textSecondary,
      fontWeight: "700",
      marginBottom: 10,
    },
    label: {
      fontSize: 20,
      color: colors.textSecondary,
      fontWeight: "700",
    },
    subLabelSmall: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: "700",
    },
    descriptionLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "700",
    },
    messages: {
      fontSize: 15,
      color: colors.textSecondary,
      fontWeight: "700",
      textAlign: "center",
      marginVertical: 20,
    },
    dayListContainer: {
      flexDirection: "row",
      gap: 15,
      marginBottom: 15,
    },
    dayContainer: {
      backgroundColor: colors.cardBorder,
      justifyContent: "center",
      alignItems: "center",
      width: 35,
      height: 25,
      borderRadius: 50,
    },
    dayText: {
      color: colors.surface,
      fontWeight: "bold",
      fontSize: 15,
    },
  });
}
