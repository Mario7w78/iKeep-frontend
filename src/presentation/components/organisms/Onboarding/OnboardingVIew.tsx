// screens/Onboarding/OnBoardingView.tsx
import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ViewToken,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppStore } from "../../../../infrastructure/store/useAppStore";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { Theme } from "../../theme/colors";
import { useScheduleStore } from "../../../../di/Dependencies";
import { dateToMinutes, formatTime } from "../../../utils/timeUtils";
import { onboardingDayLimitPersistence } from "../../../../infrastructure/persistence/OnboardingDayLimitPersistence";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    id: "username",
    title: "¿Cómo te llamas?",
    description: "Por favor, ingresa tu nombre para personalizar tu experiencia.",
    showTimePicker: false,
    showUsernameInput: true,
  },
  {
    id: "1",
    title: "Organiza tus actividades",
    description:
      "Crea y gestiona todas tus actividades fijas u optimizables en un solo lugar.",
    showTimePicker: false,
    showUsernameInput: false,
  },
  {
    id: "2",
    title: "Planifica tu horario",
    description:
      "Visualiza tu semana de un vistazo y deja que el optimizador inteligente arme tu agenda.",
    showTimePicker: false,
    showUsernameInput: false,
  },
  {
    id: "3",
    title: "¡Listo para empezar!",
    description:
      "Establezcamos tus límites diarios para acomodar tus actividades.",
    showTimePicker: false,
    showUsernameInput: false,
  },
  {
    id: "4",
    title: "¿A qué hora empieza tu día?",
    description: "A partir de esta hora planificaremos tu rutina diaria.",
    showTimePicker: true,
    showUsernameInput: false,
  },
  {
    id: "5",
    title: "¿A qué hora termina tu día?",
    description:
      "Intentaremos que todas tus actividades finalicen antes de esta hora.",
    showTimePicker: true,
    showUsernameInput: false,
  },
];

export default function OnBoardingView() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const setHasSeenOnboarding = useAppStore((s) => s.setHasSeenOnboarding);
  const username = useAppStore((s) => s.username);
  const setUsername = useAppStore((s) => s.setUsername);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const { setStartHour, setEndHour } = useScheduleStore();
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index ?? 0);
      }
    }
  ).current;

  const handleNext = (skip: boolean) => {
    if (SLIDES[activeIndex].id === "username") {
      if (!username || username.trim() === "") {
        Alert.alert("Nombre requerido", "Por favor, ingresa tu nombre para continuar.");
        return;
      }
    }
    if (activeIndex < SLIDES.length - 1) {
      if (skip) {
        flatListRef.current?.scrollToIndex({ index: SLIDES.length - 2 });
      } else {
        flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
      }
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    if (!startTime || !endTime) {
      Alert.alert(
        "Horario incompleto",
        "Por favor, selecciona la hora de inicio y de fin de tu día."
      );
      return;
    }
    const startMin = dateToMinutes(startTime);
    const endMin = dateToMinutes(endTime);

    if (startMin === endMin) {
      Alert.alert(
        "Horario inválido",
        "La hora de inicio y de fin no pueden ser iguales"
      );
      return;
    }

    try {
      await onboardingDayLimitPersistence.saveDayLimits(startMin, endMin);
    } catch (e) {
      console.error("Error guardando límites del día:", e);
    }

    setStartHour(startMin);
    setEndHour(endMin);
    setHasSeenOnboarding(true);
    navigation.navigate("MainTabs");
  };

  const getSlideIcon = (id: string) => {
    switch (id) {
      case "username":
        return {
          name: "person-outline",
          color: Theme.comfyColors.green,
          bg: "rgba(141, 255, 104, 0.15)",
        };
      case "1":
        return {
          name: "calendar-outline",
          color: Theme.comfyColors.skyBlue,
          bg: "rgba(165, 178, 235, 0.15)",
        };
      case "2":
        return {
          name: "time-outline",
          color: Theme.comfyColors.yellow,
          bg: "rgba(233, 200, 74, 0.15)",
        };
      case "3":
        return {
          name: "rocket-outline",
          color: Theme.comfyColors.green,
          bg: "rgba(141, 255, 104, 0.15)",
        };
      case "4":
        return {
          name: "sunny-outline",
          color: Theme.comfyColors.orange,
          bg: "rgba(255, 174, 113, 0.15)",
        };
      case "5":
        return {
          name: "moon-outline",
          color: Theme.comfyColors.skyBlue,
          bg: "rgba(165, 178, 235, 0.15)",
        };
      default:
        return {
          name: "sparkles-outline",
          color: Theme.comfyColors.green,
          bg: "rgba(141, 255, 104, 0.15)",
        };
    }
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        scrollEnabled={activeIndex !== 0 || (username !== undefined && username.trim() !== "")}
        renderItem={({ item }) => {
          const iconConfig = getSlideIcon(item.id);

          return (
            <View style={styles.slide}>
              <View
                style={[
                  styles.illustration,
                  {
                    backgroundColor: iconConfig.bg,
                    borderColor: iconConfig.color,
                  },
                ]}
              >
                <Ionicons
                  name={iconConfig.name as any}
                  size={80}
                  color={iconConfig.color}
                />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>

              {item.showUsernameInput && (
                <View style={styles.pickerContainer}>
                  <TextInput
                    style={styles.usernameInput}
                    placeholder="Tu nombre"
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              )}

              {item.showTimePicker && item.id === "4" && (
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={styles.timeInputCard}
                    activeOpacity={0.7}
                    onPress={() => setShowStartPicker((v) => !v)}
                  >
                    <Ionicons
                      name="time-outline"
                      size={24}
                      color={Theme.colors.surface}
                    />
                    <Text style={styles.timeInputText}>
                      {startTime ? formatTime(startTime) : "Seleccionar la hora"}
                    </Text>
                  </TouchableOpacity>

                  {(showStartPicker || Platform.OS === "ios") && (
                    <View style={styles.iosPickerCard}>
                      <DateTimePicker
                        value={startTime || new Date(new Date().setHours(4, 0, 0, 0))}
                        mode="time"
                        display="spinner"
                        themeVariant="dark"
                        textColor={Theme.colors.surface}
                        onChange={(_, selectedDate) => {
                          if (selectedDate) setStartTime(selectedDate);
                          if (Platform.OS !== "ios") setShowStartPicker(false);
                        }}
                        style={styles.iosPicker}
                      />
                    </View>
                  )}
                </View>
              )}

              {item.showTimePicker && item.id === "5" && (
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={styles.timeInputCard}
                    activeOpacity={0.7}
                    onPress={() => setShowEndPicker((v) => !v)}
                  >
                    <Ionicons
                      name="time-outline"
                      size={24}
                      color={Theme.colors.surface}
                    />
                    <Text style={styles.timeInputText}>
                      {endTime ? formatTime(endTime) : "Seleccionar la hora"}
                    </Text>
                  </TouchableOpacity>

                  {(showEndPicker || Platform.OS === "ios") && (
                    <View style={styles.iosPickerCard}>
                      <DateTimePicker
                        value={endTime || new Date(new Date().setHours(22, 0, 0, 0))}
                        mode="time"
                        display="spinner"
                        themeVariant="dark"
                        textColor={Theme.colors.surface}
                        onChange={(_, selectedDate) => {
                          if (selectedDate) setEndTime(selectedDate);
                          if (Platform.OS !== "ios") setShowEndPicker(false);
                        }}
                        style={styles.iosPicker}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />

      <View style={styles.dotsContainer}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        {!isLast && activeIndex !== 0 && (
          <TouchableOpacity
            onPress={() => handleNext(true)}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>Omitir</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => handleNext(false)}
          style={[styles.nextButton, (isLast || activeIndex === 0) && styles.nextButtonFull]}
        >
          <Text style={styles.nextText}>{isLast ? "Empezar" : "Siguiente"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.screenBackground },
  slide: {
    width,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  illustration: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: Theme.colors.surface,
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  pickerContainer: {
    width: "100%",
    marginTop: 24,
    gap: 12,
  },
  usernameInput: {
    width: "100%",
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#4d506c",
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    color: Theme.colors.surface,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  timeInputCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#4d506c",
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    paddingHorizontal: 20,
  },
  timeInputText: {
    color: Theme.colors.surface,
    fontSize: 20,
    fontWeight: "900",
  },
  iosPickerCard: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#3b3e54",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  iosPicker: {
    height: 120,
    width: "100%",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  dotActive: {
    width: 20,
    backgroundColor: Theme.comfyColors.green,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  skipButton: { paddingVertical: 14, paddingHorizontal: 8 },
  skipText: { fontSize: 16, color: Theme.colors.textSecondary, fontWeight: "700" },
  nextButton: {
    flex: 1,
    backgroundColor: Theme.comfyColors.green,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  nextButtonFull: { flex: 1 },
  nextText: {
    color: Theme.comfyFontColors.green,
    fontSize: 16,
    fontWeight: "900",
  },
});