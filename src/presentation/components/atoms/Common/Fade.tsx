import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Theme } from "../../theme/colors";
interface FadeProps {
  children?: React.ReactNode;
}

export const Fade = ({ children }: FadeProps) => {
  const bgColor = Theme.componentColors.background;
  const transparentColor = `${bgColor}00`;

  return (
    <View style={styles.container}>
      {children}
      <LinearGradient
        colors={[Theme.componentColors.background, transparentColor]}
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
