import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { Theme } from "../../theme/colors";
import { Activity, DayOfWeek } from "../../../../domain/entities/Activity";

type ActivityCardProps = {
  activity: Activity;
  onPress: () => void;
  onDelete: () => void;
  onEdit: () => void;
};

export default function ActivityCard({
  activity,
  onPress,
  onDelete,
  onEdit,
}: ActivityCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={styles.card}
      >
        <View>

        <View>
          <View style={styles.textContainer}>
            <Text style={styles.titleText}>{activity.title}</Text>
            <View style={styles.dayContainer}>
              {activity.daysEnabled.map((day, index) => (
                <Text key={index} style={styles.dayText}>{day.substring(0, 1)}</Text>
              ))}
            </View>
          </View>
        </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    flexDirection: "row",
    justifyContent: 'space-between',
    alignItems: "center",
    backgroundColor: Theme.colors.lightBackground,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'space-between'
  },
  timeText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Theme.colors.surface,
  },
  dayContainer: {
    flexDirection: "row",
    gap: 4,
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
    color: Theme.colors.surface,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 8,
  },
  actionText: {
    color: Theme.colors.surface,
    fontWeight: "600",
    fontSize: 14,
  },
});
