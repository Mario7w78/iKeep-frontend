import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { DayOfWeek } from "../../../../domain/entities/Activity";
import { DayConfig } from "../../../../domain/entities/activity.types";
import { Theme } from "../../theme/colors";
import GroupTag from "./GroupTag";

type GroupListProps = {
  groups: Record<number, { days: DayOfWeek[]; config: DayConfig }>;
  editingGroupId: number | null;
  isFixed: boolean;
  isAnchor: boolean;
  onEditGroup: (group: {
    groupId: number;
    days: DayOfWeek[];
    config: DayConfig;
  }) => void;
  onDiscardGroup: (groupId: number) => void;
};

export default function GroupList({
  groups,
  editingGroupId,
  isFixed,
  isAnchor,
  onEditGroup,
  onDiscardGroup,
}: GroupListProps) {
  if (Object.keys(groups).length === 0) return null;

  const eyebrowText = isFixed || isAnchor ? "Días programados" : "Días permitidos";

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{eyebrowText}</Text>
      {Object.entries(groups).map(([gidStr, { days, config }]) => {
        const gid = Number(gidStr);
        const isEditing = editingGroupId === gid;

        return (
          <GroupTag
            key={gid}
            groupId={gid}
            days={days}
            config={config}
            isEditing={isEditing}
            isFixed={isFixed}
            onPress={() => onEditGroup({ groupId: gid, days, config })}
            onDiscard={() => onDiscardGroup(gid)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  eyebrow: {
    color: Theme.colors.iconPrimary,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 4,
  },
});
