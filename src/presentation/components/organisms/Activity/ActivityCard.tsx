import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme, activityStyles, ThemeColors } from "../../theme/colors";
import { Activity, DayOfWeek } from "../../../../domain/entities/Activity";

type ActivityCardProps = {
  activity: Activity;
  onPress: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isFixed?: boolean;
};

export default function ActivityCard({
  activity,
  onPress,
  onDelete,
  onEdit,
  isFixed = false,
}: ActivityCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [showActions, setShowActions] = useState(false);

  const isLight = colors.screenBackground === '#F1F6F3' || colors.screenBackground === '#FFFFFF';
  const activityStyle = useMemo(() => {
    if (isLight) {
      return isFixed 
        ? {
            gradient: ['#F3E8FF', '#E9D5FF'] as const,
            borderColor: '#C084FC',
            dayBoxColor: '#D8B4FE',
          }
        : {
            gradient: ['#FAF5FF', '#F3E8FF'] as const,
            borderColor: '#E9D5FF',
            dayBoxColor: '#E9D5FF',
          };
    } else {
      return isFixed ? activityStyles.fixed : activityStyles.flexible;
    }
  }, [isLight, isFixed]);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={activityStyle.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, { borderColor: activityStyle.borderColor }]}
        >
        <View>
          <View>
            <View style={styles.textContainer}>
              <Text style={styles.titleText}>{activity.title}</Text>
              <View style={styles.dayContainer}>
                {activity.daysEnabled.map((day, index) => (
                  <View key={index} style={[styles.dayBox, { backgroundColor: activityStyle.dayBoxColor }]}>
                    <Text style={styles.dayText}>{day.substring(0, 1)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrapper: {
    marginHorizontal: 8,
    marginVertical: 8,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: activityStyles.flexible.borderColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  textContainer: {
    flex: 1,
    justifyContent: "space-between",
    gap: 5
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.surface,
  },
  dayContainer: {
    flexDirection: "row",
    gap: 10,
  },
  actionsContainer: {
    flexDirection: "row",
    backgroundColor: "#F8F8F8",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 16,
  },
  dayText: {
    fontSize: 16,
    color: colors.surface,
    fontWeight: "bold",
    textAlign: "center",
  },
  dayBox: {
    justifyContent: 'center',
    borderRadius: 50,
    backgroundColor: activityStyles.flexible.borderColor,
    width: 30,
    height: 30,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 8,
  },
  actionText: {
    color: colors.surface,
    fontWeight: "600",
    fontSize: 14,
  },
});
