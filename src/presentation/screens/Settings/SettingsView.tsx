import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Theme } from "../../components/theme/colors";
import { useScheduleStore } from "../../../di/Dependencies";
import {
  dateToMinutes,
  minutesToDate,
  formatTime,
} from "../../utils/timeUtils";
import { PrimaryButton } from "../../components/atoms/Common/PrimaryButton";
import { TimePickerModal } from "../../components/molecules/Settings/TimePickerModel";
import { SettingsRow } from "../../components/molecules/Settings/SettingsRow";

type TimeTarget = "start" | "end" | null;

const SettingsView = () => {
  const {
    startHour,
    endHour,
    setStartHour,
    setEndHour,
    handleGenerateSchedule,
  } = useScheduleStore();

  const [localStartTime, setLocalStartTime] = useState(
    minutesToDate(startHour),
  );
  const [localEndTime, setLocalEndTime] = useState(minutesToDate(endHour));
  const [draftTime, setDraftTime] = useState<Date>(new Date());
  const [activeModal, setActiveModal] = useState<TimeTarget>(null);

  useEffect(() => {
    setLocalStartTime(minutesToDate(startHour));
    setLocalEndTime(minutesToDate(endHour));
  }, [startHour, endHour]);

  const openModal = (target: TimeTarget) => {
    setDraftTime(
      target === "start" ? new Date(localStartTime) : new Date(localEndTime),
    );
    setActiveModal(target);
  };

  const applyDraftTime = (
    hourString: string,
    minuteString: string,
    period: string,
  ) => {
    const updated = new Date(draftTime);
    let hours = parseInt(hourString, 10);
    if (period === "AM") {
      if (hours === 12) hours = 0;
    } else {
      if (hours !== 12) hours += 12;
    }
    updated.setHours(hours);
    updated.setMinutes(parseInt(minuteString, 10));
    setDraftTime(updated);
  };

  const confirmModal = () => {
    if (activeModal === "start") setLocalStartTime(new Date(draftTime));
    else setLocalEndTime(new Date(draftTime));
    setActiveModal(null);
  };

  const handleSave = async () => {
    const startMin = dateToMinutes(localStartTime);
    const endMin = dateToMinutes(localEndTime);

    if (startMin >= endMin) {
      Alert.alert(
        "Horario inválido",
        "La hora de inicio debe ser anterior a la hora de fin.",
      );
      return;
    }
    await setStartHour(startMin);
    await setEndHour(endMin);
    Alert.alert("Éxito", "Configuración guardada correctamente.");
    await handleGenerateSchedule();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Configuración</Text>
        <View style={styles.group}>
          <SettingsRow
            label="Inicio del día"
            value={formatTime(localStartTime)}
            onPress={() => openModal("start")}
            isFirst
          />
          <SettingsRow
            label="Fin del día"
            value={formatTime(localEndTime)}
            onPress={() => openModal("end")}
            isLast
          />
        </View>
        <Text style={styles.sectionFooter}>
          Define el rango de horas en que se generarán tus bloques de actividad.
        </Text>

        <View style={styles.buttonContainer}>
          <PrimaryButton title="Guardar Configuración" onPress={handleSave} />
        </View>
      </ScrollView>

      <TimePickerModal
        visible={activeModal === "start"}
        title="Inicio del día"
        time={draftTime}
        onTimeChange={applyDraftTime}
        onDone={confirmModal}
        onCancel={() => setActiveModal(null)}
      />
      <TimePickerModal
        visible={activeModal === "end"}
        title="Fin del día"
        time={draftTime}
        onTimeChange={applyDraftTime}
        onDone={confirmModal}
        onCancel={() => setActiveModal(null)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 48,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Theme.colors.surface,
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "400",
    color: Theme.colors.surface,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  group: {
    backgroundColor: Theme.colors.lightBackground,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  sectionFooter: {
    fontSize: 13,
    color: Theme.colors.surface,
    marginTop: 8,
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  buttonContainer: {
    marginHorizontal: 16,
    marginTop: 8,
  },
});

export default SettingsView;
