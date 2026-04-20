import { View, Text, StyleSheet } from "react-native";
import { Theme } from "../../theme/colors";
import AntDesign from "@expo/vector-icons/AntDesign";
import { NumericStepper } from "../../molecules/Time/NumericStepper";
import { Divider } from "../../atoms/Common/Divider";
import Ionicons from "@expo/vector-icons/Ionicons";
import { timeType } from "../../../../domain/entities/activity.types";

interface props {
  durationTimeValue: number;
  travelTimeValue: number;
  selectedTimeTypeDuration: timeType;
  selectedTimeTypeTravel: timeType;
  setSelectedTypeDuration: React.Dispatch<React.SetStateAction<timeType>>;
  setSelectedTimeTypeTravel: React.Dispatch<React.SetStateAction<timeType>>;
  onAddDuration: () => void;
  onSubstractDuration: () => void;
  onAddTravel: () => void;
  onSubstractTravel: () => void;
}

export const TimeSection = ({
  durationTimeValue,
  travelTimeValue,
  selectedTimeTypeDuration,
  selectedTimeTypeTravel,
  setSelectedTypeDuration,
  setSelectedTimeTypeTravel,
  onAddDuration,
  onAddTravel,
  onSubstractDuration,
  onSubstractTravel,
}: props) => {
  return (
    <View style={styles.timeSection}>
      <Text style={styles.labelSmall}>Tiempo</Text>
      <View style={styles.timeInnerSection}>
        <View style={styles.section}>
          <View style={styles.inputSection}>
            <View style={styles.iconContainer}>
              <AntDesign name="clock-circle" size={12} color="white" />
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
        <Divider orientation="vertical" color={Theme.colors.surface} />
        <View style={styles.section}>
          <View style={styles.inputSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="location-outline" size={16} color="white" />
            </View>
            <Text style={styles.subLabelSmall}>Traslado</Text>
          </View>

          <NumericStepper
            value={travelTimeValue}
            selectedTimeType={selectedTimeTypeTravel}
            onSelectType={setSelectedTimeTypeTravel}
            onAdd={onAddTravel}
            onSubstract={onSubstractTravel}
          />
        </View>
      </View>
    </View>
  );
};

export const styles = StyleSheet.create({
  section: {
    width: "50%",
  },
  timeSection: {
    flexDirection: "column",
    backgroundColor: Theme.colors.lightBackground,
    borderRadius: Theme.generalBorder,
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
    backgroundColor: Theme.colors.border,
    borderRadius: 7,
    width: 25,
    height: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  icon2Container: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 7,
    width: 35,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  labelSmall: {
    fontSize: 20,
    color: Theme.colors.textSecondary,
    fontWeight: "700",
    marginBottom: 10,
  },
  label: {
    fontSize: 20,
    color: Theme.colors.textSecondary,
    fontWeight: "700",
  },
  subLabelSmall: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    fontWeight: "700",
  },
});
