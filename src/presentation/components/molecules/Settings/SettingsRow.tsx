import { Theme } from "../../theme/colors";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export const SettingsRow = ({
  label,
  value,
  onPress,
  isFirst,
  isLast,
}: {
  label: string;
  value: string;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}) => (
  <>
    <TouchableOpacity
      style={[row.container, isFirst && row.firstRow, isLast && row.lastRow]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Text style={row.label}>{label}</Text>
      <View style={row.right}>
        <Text style={row.value}>{value}</Text>
        <Text style={row.chevron}>›</Text>
      </View>
    </TouchableOpacity>
    {!isLast && <View style={row.separator} />}
  </>
);

const row = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.cardBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  firstRow: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastRow: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  label: {
    fontSize: 16,
    color: Theme.colors.surface,
    fontWeight: "bold",
    flex: 1,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  value: {
    fontSize: 17,
    color: Theme.colors.surface,
    fontWeight: "500",
  },
  chevron: {
    fontSize: 22,
    color: Theme.colors.surface,
    marginLeft: 2,
    lineHeight: 24,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Theme.colors.surface,
    marginLeft: 16,
    opacity: 0.2,
  },
});
