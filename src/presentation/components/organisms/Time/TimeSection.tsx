import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme, ThemeColors } from "../../theme/colors";
import AntDesign from "@expo/vector-icons/AntDesign";
import { NumericStepper } from "../../molecules/Time/NumericStepper";
import { Divider } from "../../atoms/Common/Divider";
import Ionicons from "@expo/vector-icons/Ionicons";
import { timeType } from "../../../../domain/entities/activity.types";

interface props {
  durationTimeValue: number;
  travelToValue: number | null;
  travelFromValue: number | null;
  selectedTimeTypeDuration: timeType;
  selectedTimeTypeTravel: timeType;
  setSelectedTypeDuration: React.Dispatch<React.SetStateAction<timeType>>;
  setSelectedTimeTypeTravel: React.Dispatch<React.SetStateAction<timeType>>;
  onAddDuration: () => void;
  onSubstractDuration: () => void;
  onAddTravelTo: () => void;
  onSubstractTravelTo: () => void;
  onAddTravelFrom: () => void;
  onSubstractTravelFrom: () => void;
}

export const TimeSection = ({
  durationTimeValue,
  travelToValue,
  travelFromValue,
  selectedTimeTypeDuration,
  selectedTimeTypeTravel,
  setSelectedTypeDuration,
  setSelectedTimeTypeTravel,
  onAddDuration,
  onAddTravelTo,
  onSubstractTravelTo,
  onAddTravelFrom,
  onSubstractTravelFrom,
  onSubstractDuration,
}: props) => {
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);
  return (
    <View style={styles.timeSection}>
      <Text style={styles.labelSmall}>Tiempo</Text>
      <View style={styles.timeInnerSection}>
        <View style={styles.section}>
          <View style={styles.inputSection}>
            <View style={styles.iconContainer}>
              <AntDesign name="clock-circle" size={12} color={colors.iconPrimary} />
            </View>
            <Text style={styles.subLabelSmall}>Duración</Text>
          </View>

          <NumericStepper
            value={durationTimeValue}
            selectedTimeType={selectedTimeTypeDuration}
            onSelectType={setSelectedTypeDuration}
            onAdd={onAddDuration}
            onSubstract={onSubstractDuration}
          />
        </View>
        <Divider orientation="vertical" color={colors.surface} />
        <View style={styles.section}>
          <View style={styles.inputSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="location-outline" size={16} color={colors.iconPrimary} />
            </View>
            <Text style={styles.subLabelSmall}>Viaje antes</Text>
          </View>

          <NumericStepper
            value={travelToValue ?? 0}
            selectedTimeType={selectedTimeTypeTravel}
            onSelectType={setSelectedTimeTypeTravel}
            onAdd={onAddTravelTo}
            onSubstract={onSubstractTravelTo}
          />
        </View>
        <Divider orientation="vertical" color={colors.surface} />
        <View style={styles.section}>
          <View style={styles.inputSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="location-outline" size={16} color={colors.iconPrimary} />
            </View>
            <Text style={styles.subLabelSmall}>Viaje después</Text>
          </View>

          <NumericStepper
            value={travelFromValue ?? 0}
            selectedTimeType={selectedTimeTypeTravel}
            onSelectType={setSelectedTimeTypeTravel}
            onAdd={onAddTravelFrom}
            onSubstract={onSubstractTravelFrom}
          />
        </View>
      </View>
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
    footer: {
      paddingHorizontal: 24,
      paddingBottom: 30,
      paddingTop: 10,
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
  });
}
