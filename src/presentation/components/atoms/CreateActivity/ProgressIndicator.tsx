import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme, ThemeColors } from "../../theme/colors";

type ProgressIndicatorProps = {
  totalSteps: number;
  currentStep: number;
};

export default function ProgressIndicator({
  totalSteps,
  currentStep,
}: ProgressIndicatorProps) {
  const { colors, comfyColors } = useTheme();
  const styles = useMemo(() => createStyles(colors, comfyColors), [colors]);

  return (
    <View style={styles.row}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.segment,
            index + 1 <= currentStep && styles.segmentActive,
          ]}
        />
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors, comfyColors: ReturnType<typeof useTheme>['comfyColors']) => StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 14,
  },
  segment: {
    flex: 1,
    height: 5,
    borderRadius: 10,
    backgroundColor: colors.cardBorder,
  },
  segmentActive: {
    backgroundColor: comfyColors.green,
  },
});
