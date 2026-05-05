import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../../theme/colors";

interface Props {
  title: string;
  appName: string;
}

export const HeaderTitle = ({ title, appName }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
    <View
      style={{
        gap: 5,
      }}
    >
      <Text style={styles.headerTitle}>{title}</Text>
      <Text
        style={{
          color: Theme.colors.lightPrimary,
          fontWeight: "bold",
        }}
      >
        4 actividades - 1 flexibles
      </Text>
    </View>

    <Text style={styles.headerApp}>{appName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
    backgroundColor: Theme.colors.headerCard,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: Theme.colors.surface,
  },
  headerApp: {
    fontSize: 32,
    fontWeight: "bold",
    padding: 10,
    marginRight: 5,
    color: Theme.colors.primary,
  },
});
