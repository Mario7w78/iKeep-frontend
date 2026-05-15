import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Theme } from "../../theme/colors";
import { getTodayFormatted } from "../../../utils/timeUtils";

interface MainHeaderProps {
  children?: React.ReactNode;
  title: string;
}

export const MainHeader = ({ title: title }: MainHeaderProps) => {
  return (
    <View style={styles.container}>
      <AntDesign name={"aliwangwang"} size={28} color={Theme.comfyColors.green} />
      <View style={styles.textContainer}>
        <Text style={styles.name}>{title}</Text>
        <Text style={styles.subtitle}>{getTodayFormatted()}</Text>
      </View>
    </View>
  );
};  

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingTop: 80,
    paddingBottom: 20,
    paddingHorizontal: 20,
    gap: 10,
    alignItems: "center",
  },
  textContainer: {
    flexDirection: "column",
  },
  name: {
    fontSize: 24,
    color: "white",
  },
  subtitle: {
    fontSize: 16,
    color: "lightgray",
  },
});
