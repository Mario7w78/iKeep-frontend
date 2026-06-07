import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Theme } from "../../components/theme/colors";
import { useScheduleStore } from "../../../di/Dependencies";
import {
  dateToMinutes,
  minutesToDate,
  formatTime,
} from "../../utils/timeUtils";

const SettingsView = () => {
  const {
    startHour,
    endHour,
    setStartHour,
    setEndHour,
    handleGenerateSchedule,
    rollingWeekStartDay,
    rollingWeekTotalDays,
    setRollingWeekStartDay,
    setRollingWeekTotalDays,
  } = useScheduleStore();

  const [isEditing, setIsEditing] = useState(false);
  const [localStartTime, setLocalStartTime] = useState(
    minutesToDate(startHour)
  );
  const [localEndTime, setLocalEndTime] = useState(minutesToDate(endHour));

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [localDiaInicio, setLocalDiaInicio] = useState(rollingWeekStartDay);
  const [localDiasTotales, setLocalDiasTotales] = useState(rollingWeekTotalDays);

  useEffect(() => {
    setLocalStartTime(minutesToDate(startHour));
    setLocalEndTime(minutesToDate(endHour));
    setLocalDiaInicio(rollingWeekStartDay);
    setLocalDiasTotales(rollingWeekTotalDays);
  }, [startHour, endHour, rollingWeekStartDay, rollingWeekTotalDays]);

  const handleSave = () => {
    const startMin = dateToMinutes(localStartTime);
    const endMin = dateToMinutes(localEndTime);

    if (startMin === endMin) {
      Alert.alert(
        "Horario inválido",
        "La hora de inicio y de fin no pueden ser iguales"
      );
      return;
    }

    Alert.alert(
      "Guardar configuración",
      "¿Estás seguro de que quieres actualizar tu horario? Esto recalculará todas tus actividades planificadas.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sí, guardar",
          style: "default",
          onPress: async () => {
            await setStartHour(startMin);
            await setEndHour(endMin);
            await setRollingWeekStartDay(localDiaInicio);
            await setRollingWeekTotalDays(localDiasTotales);
            try {
              await handleGenerateSchedule();
              setIsEditing(false);
              Alert.alert("Éxito", "Configuración guardada correctamente.");
            } catch (e) {
              console.error("Error generating schedule after settings save:", e);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setLocalStartTime(minutesToDate(startHour));
    setLocalEndTime(minutesToDate(endHour));
    setLocalDiaInicio(rollingWeekStartDay);
    setLocalDiasTotales(rollingWeekTotalDays);
    setShowStartPicker(false);
    setShowEndPicker(false);
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Configuración</Text>

        <View style={styles.settingsSection}>
          <Text style={styles.fieldLabel}>Inicio del día</Text>
          <TouchableOpacity
            style={[styles.timeInputCard, !isEditing && { opacity: 0.6 }]}
            activeOpacity={0.7}
            onPress={() => setShowStartPicker((v) => !v)}
            disabled={!isEditing}
          >
            <Ionicons name="time-outline" size={24} color={Theme.colors.surface} />
            <Text style={styles.timeInputText}>
              {formatTime(localStartTime)}
            </Text>
          </TouchableOpacity>

          {isEditing && (showStartPicker || Platform.OS === "ios") && (
            <View style={styles.iosPickerCard}>
              <DateTimePicker
                value={localStartTime}
                mode="time"
                display="spinner"
                themeVariant="dark"
                textColor={Theme.colors.surface}
                onChange={(_, selectedDate) => {
                  if (selectedDate) setLocalStartTime(selectedDate);
                  if (Platform.OS !== "ios") setShowStartPicker(false);
                }}
                style={styles.iosPicker}
              />
            </View>
          )}
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.fieldLabel}>Fin del día</Text>
          <TouchableOpacity
            style={[styles.timeInputCard, !isEditing && { opacity: 0.6 }]}
            activeOpacity={0.7}
            onPress={() => setShowEndPicker((v) => !v)}
            disabled={!isEditing}
          >
            <Ionicons name="time-outline" size={24} color={Theme.colors.surface} />
            <Text style={styles.timeInputText}>{formatTime(localEndTime)}</Text>
          </TouchableOpacity>

          {isEditing && (showEndPicker || Platform.OS === "ios") && (
            <View style={styles.iosPickerCard}>
              <DateTimePicker
                value={localEndTime}
                mode="time"
                display="spinner"
                themeVariant="dark"
                textColor={Theme.colors.surface}
                onChange={(_, selectedDate) => {
                  if (selectedDate) setLocalEndTime(selectedDate);
                  if (Platform.OS !== "ios") setShowEndPicker(false);
                }}
                style={styles.iosPicker}
              />
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Semana móvil</Text>
        <Text style={styles.fieldLabel}>Día de inicio de la semana</Text>
        <View style={styles.dayPickerRow}>
          {['Lu','Ma','Mi','Ju','Vi','Sá','Do'].map((label, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.dayPickerButton,
                localDiaInicio === idx && styles.dayPickerButtonActive,
                !isEditing && { opacity: 0.6 },
              ]}
              disabled={!isEditing}
              onPress={() => setLocalDiaInicio(idx)}
            >
              <Text style={[
                styles.dayPickerText,
                localDiaInicio === idx && styles.dayPickerTextActive,
              ]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Duración de la semana (días)</Text>
        <View style={styles.durationRow}>
          <TouchableOpacity
            style={[styles.durationBtn, !isEditing && { opacity: 0.6 }]}
            disabled={!isEditing}
            onPress={() => setLocalDiasTotales(Math.max(1, localDiasTotales - 1))}
          >
            <Ionicons name="remove" size={24} color={Theme.colors.surface} />
          </TouchableOpacity>
          <Text style={styles.durationValue}>{localDiasTotales}</Text>
          <TouchableOpacity
            style={[styles.durationBtn, !isEditing && { opacity: 0.6 }]}
            disabled={!isEditing}
            onPress={() => setLocalDiasTotales(Math.min(7, localDiasTotales + 1))}
          >
            <Ionicons name="add" size={24} color={Theme.colors.surface} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionFooter}>
          Define el rango de horas en el que se generarán tus bloques de actividad.
        </Text>

        {!isEditing ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.8}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="create-outline" size={20} color={Theme.colors.surface} />
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonContainerEditing}>
            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.8}
              onPress={handleSave}
            >
              <Ionicons name="save-outline" size={20} color={Theme.comfyFontColors.green} />
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              activeOpacity={0.8}
              onPress={handleCancel}
            >
              <Ionicons name="close-circle-outline" size={20} color={Theme.colors.surface} />
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Theme.colors.screenBackground,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 48,
    paddingHorizontal: 20,
    gap: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: Theme.colors.surface,
    marginBottom: 8,
  },
  settingsSection: {
    gap: 10,
    width: "100%",
  },
  fieldLabel: {
    color: Theme.colors.iconPrimary,
    fontSize: 16,
    fontWeight: "900",
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
  sectionTitle: {
    color: Theme.colors.surface,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.cardBorder,
  },
  dayPickerRow: {
    flexDirection: "row",
    gap: 6,
  },
  dayPickerButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#4d506c",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  dayPickerButtonActive: {
    backgroundColor: Theme.comfyColors.green,
    borderColor: "rgba(141,255,104,0.3)",
  },
  dayPickerText: {
    color: Theme.colors.textTertiary,
    fontSize: 14,
    fontWeight: "800",
  },
  dayPickerTextActive: {
    color: Theme.comfyFontColors.green,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  durationBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#4d506c",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  durationValue: {
    color: Theme.colors.surface,
    fontSize: 28,
    fontWeight: "900",
    minWidth: 48,
    textAlign: "center",
  },
  sectionFooter: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 8,
  },
  buttonContainerEditing: {
    width: "100%",
    marginTop: 8,
    gap: 12,
  },
  editButton: {
    backgroundColor: "#4d506c",
    borderColor: Theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: 18,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  editButtonText: {
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "900",
  },
  saveButton: {
    backgroundColor: Theme.comfyColors.green,
    borderRadius: 18,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveButtonText: {
    color: Theme.comfyFontColors.green,
    fontSize: 16,
    fontWeight: "900",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderColor: Theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: 18,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cancelButtonText: {
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "900",
  },
});

export default SettingsView;
