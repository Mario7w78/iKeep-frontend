import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "../../theme/colors";

type NLInputStepProps = {
  nlText: string;
  onChangeText: (text: string) => void;
  nlLoading: boolean;
  nlError: string | null;
  onAnalyze: () => void;
};

const TIP_EXAMPLES = [
  "Gimnasio LUN y MIE 9 a 11, prioridad media",
  "Desayuno 15 min todos los días entre 6am y 8am",
  "Leer 20 min antes de dormir",
  "Estudiar inglés",
];

export default function NLInputStep({
  nlText,
  onChangeText,
  nlLoading,
  nlError,
  onAnalyze,
}: NLInputStepProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIP_EXAMPLES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Describe tu actividad</Text>

      <View style={styles.tipCapsule}>
        <Ionicons name="sparkles" size={14} color="#ffba5e" />
        <Text style={styles.tipText} key={tipIndex}>
          {TIP_EXAMPLES[tipIndex]}
        </Text>
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          multiline
          value={nlText}
          onChangeText={(text) => {
            onChangeText(text);
          }}
          placeholder='Ej: "Estudio de álgebra los martes de 14 a 16"'
          placeholderTextColor="rgba(255,255,255,0.35)"
          editable={!nlLoading}
          autoCorrect={false}
        />
      </View>

      {nlError && (
        <View style={styles.errorBanner}>
          <View style={styles.errorContent}>
            <Ionicons name="alert-circle-outline" size={20} color="#ff6b6b" />
            <Text style={styles.errorText}>{nlError}</Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.analyzeButton,
          (!nlText.trim() || nlLoading) && styles.analyzeButtonDisabled,
        ]}
        onPress={onAnalyze}
        disabled={!nlText.trim() || nlLoading}
      >
        {nlLoading ? (
          <ActivityIndicator size="small" color={colors.secondaryAccentText} />
        ) : (
          <>
            <Ionicons name="sparkles-outline" size={20} color={colors.secondaryAccentText} />
            <Text style={styles.analyzeButtonText}>Analizar con IA</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  title: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: "800",
  },
  tipCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 186, 94, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 186, 94, 0.2)",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  tipText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontWeight: "600",
  },
  inputWrapper: {
    justifyContent: "center",
    minHeight: 220,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    color: colors.surface,
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 16,
    minHeight: 200,
    textAlignVertical: "center",
    paddingVertical: 16,
  },
  errorBanner: {
    backgroundColor: "rgba(255, 107, 107, 0.12)",
    borderWidth: 1,
    borderColor: "#ff6b6b",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorText: {
    flex: 1,
    color: colors.surface,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  analyzeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.secondaryAccent,
    borderRadius: 24,
    paddingVertical: 16,
    minHeight: 56,
  },
  analyzeButtonDisabled: {
    opacity: 0.5,
  },
  analyzeButtonText: {
    color: colors.secondaryAccentText,
    fontSize: 16,
    fontWeight: "900",
  },
});
