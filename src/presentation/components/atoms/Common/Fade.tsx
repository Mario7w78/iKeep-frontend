import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/colors";
interface FadeProps {
  children?: React.ReactNode;
}

export const Fade = ({ children }: FadeProps) => {
  const { colors } = useTheme();
  const bgColor = colors.screenBackground;
  const transparentColor = `${bgColor}00`;

  return (
    <View style={styles.container}>
      {children}
      <LinearGradient
        colors={[colors.screenBackground, transparentColor]}
        style={styles.topGradient}
        pointerEvents="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 50,
  },
});
