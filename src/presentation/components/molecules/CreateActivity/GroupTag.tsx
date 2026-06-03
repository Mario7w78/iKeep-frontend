import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DayOfWeek } from "../../../../domain/entities/Activity";
import { DayConfig, PartitionConfig } from "../../../../domain/entities/activity.types";
import { Theme } from "../../theme/colors";

const formatTime = (date: Date) =>
  new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

type GroupTagProps = {
  groupId: number;
  days: DayOfWeek[];
  config: DayConfig;
  isEditing: boolean;
  isFixed: boolean;
  onPress: () => void;
  onDiscard: () => void;
};

export default function GroupTag({
  groupId,
  days,
  config,
  isEditing,
  isFixed,
  onPress,
  onDiscard,
}: GroupTagProps) {
  const color = Theme.groupColors[groupId % Theme.groupColors.length];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.tag,
        { backgroundColor: color.bg, borderColor: color.text },
        isEditing && styles.tagEditing,
      ]}
    >
      <View style={styles.tagHeader}>
        <Text style={[styles.tagDays, { color: color.text }]}>
          {days.map((day) => day.substring(0, 3)).join(" · ")}
        </Text>
        <TouchableOpacity onPress={onDiscard}>
          <Ionicons name="trash-outline" size={18} color={color.text} />
        </TouchableOpacity>
      </View>

      {config.partitions.map((partition, index) => (
        <Text key={index} style={[styles.tagInfo, { color: color.text }]}>
          {isFixed ? `${formatTime(partition.startHour)} · ` : "Horario optimizable · "}
          {partition.durationTime} min
          {partition.travelTime > 0
            ? ` · +${partition.travelTime} traslado`
            : ""}
        </Text>
      ))}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 4,
  },
  tagEditing: {
    borderWidth: 3,
  },
  tagHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  tagDays: {
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
  },
  tagInfo: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.85,
  },
});
