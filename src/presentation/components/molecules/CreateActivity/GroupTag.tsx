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

const formatMinutes = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h}h ${m}min`;
};

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
        <View style={styles.daysContainer}>
          {days.map((day) => (
            <View key={day} style={[styles.dayBadge, { backgroundColor: color.text + "15" }]}>
              <Text style={[styles.dayBadgeText, { color: color.text }]}>
                {day.substring(0, 3)}
              </Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.discardButton} onPress={onDiscard}>
          <Ionicons name="trash-outline" size={18} color={color.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.divider, { backgroundColor: color.text + "20" }]} />

      <View style={styles.partitionsList}>
        {config.partitions.map((partition, index) => {
          const timeRangeOrStatus = isFixed
            ? `${formatTime(partition.startHour)} - ${formatTime(partition.endHour)}`
            : `Horario optimizable`;

          const durationStr = formatMinutes(partition.durationTime);

          return (
            <View key={index} style={styles.partitionItem}>
              <View style={styles.partitionTimeRow}>
                <Ionicons name="layers-outline" size={14} color={color.text} style={styles.icon} />
                <Text style={[styles.tagInfo, { color: color.text }]}>
                  {timeRangeOrStatus} {!isFixed && `(${durationStr})`}
                </Text>
              </View>
              {partition.travelTime > 0 && (
                <View style={styles.partitionTravelRow}>
                  <Ionicons name="walk-outline" size={14} color={color.text} style={styles.icon} />
                  <Text style={[styles.tagSubInfo, { color: color.text }]}>
                    +{formatMinutes(partition.travelTime)} de traslado
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    marginBottom: 8,
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
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
  },
  dayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  discardButton: {
    padding: 6,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    width: "100%",
  },
  partitionsList: {
    gap: 8,
  },
  partitionItem: {
    gap: 2,
  },
  partitionTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  partitionTravelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 20,
  },
  icon: {
    opacity: 0.8,
  },
  tagInfo: {
    fontSize: 13,
    fontWeight: "800",
  },
  tagSubInfo: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.8,
  },
});
