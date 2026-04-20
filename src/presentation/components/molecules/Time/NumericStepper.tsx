import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
} from "react-native";
import { Theme } from "../../theme/colors";
import AntDesign from "@expo/vector-icons/AntDesign";
import { getHours, getMinutes } from "../../../utils/timeUtils";
import { timeType } from "../../../../domain/entities/activity.types";

interface Props {
  value: number;
  selectedTimeType: timeType;
  onSelectType: (type: timeType) => void;
  onAdd: () => void;
  onSubstract: () => void;
}

export const NumericStepper = ({
  value,
  selectedTimeType,
  onSelectType,
  onAdd,
  onSubstract,
}: Props) => (
  <View style={styles.container}>
    <View style={styles.timeContainer}>
      <TouchableOpacity
        style={[
          styles.timeButton,
          (selectedTimeType === timeType.hour ||
            selectedTimeType === timeType.both) &&
            styles.activeTimeButton,
        ]}
        onPress={() => onSelectType(timeType.hour)}
      >
        <Text
          style={[
            styles.timeText,
            (selectedTimeType === timeType.hour ||
              selectedTimeType === timeType.both) &&
              styles.activeTimeText,
          ]}
        >
          {getHours(value)}h
        </Text>
      </TouchableOpacity>

      <Text style={styles.doubleDots}>:</Text>

      <TouchableOpacity
        style={[
          styles.timeButton,
          (selectedTimeType === timeType.minute ||
            selectedTimeType === timeType.both) &&
            styles.activeTimeButton,
        ]}
        onPress={() => onSelectType(timeType.minute)}
      >
        <Text
          style={[
            styles.timeText,
            (selectedTimeType === timeType.minute ||
              selectedTimeType === timeType.both) &&
              styles.activeTimeText,
          ]}
        >
          {getMinutes(value)}m
        </Text>
      </TouchableOpacity>
    </View>
    <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.iconButton} onPress={onSubstract}>
        <AntDesign name="minus" size={16} color={Theme.colors.surface} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton} onPress={onAdd}>
        <AntDesign name="plus" size={16} color={Theme.colors.surface} />
      </TouchableOpacity>
    </View>
  </View>
);

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    gap: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  mainText: {
    fontWeight: "bold",
    fontSize: 32,
    color: Theme.colors.primary,
    textAlign: "center",
  },
  iconButton: {
    backgroundColor: Theme.colors.primary,
    padding: 10,
    borderRadius: 10,
  },
  timeContainer: {
    flexDirection: "row",
    gap: 5,
  },
  timeButton: {
    backgroundColor: "transparent",
    // padding: 5,
    borderRadius: 10,
    width: 55,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  timeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: Theme.colors.primary,
    alignSelf: "center",
  },
  doubleDots: {
    fontSize: 20,
    fontWeight: "bold",
    color: Theme.colors.surface,
    alignSelf: "center",
  },
  activeTimeButton: {
    backgroundColor: Theme.colors.primary,
  },
  activeTimeText: {
    color: Theme.colors.surface,
  },
});
