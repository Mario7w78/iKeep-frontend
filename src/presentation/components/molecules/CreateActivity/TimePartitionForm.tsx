import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Switch,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { PartitionConfig } from "../../../../domain/entities/activity.types";
import { Theme } from "../../theme/colors";
import TimeChip from "../../atoms/CreateActivity/TimeChip";

const formatTime = (date: Date) =>
  new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

type TimePartitionFormProps = {
  partitions: PartitionConfig[];
  activePartitionIndex: number;
  startTime: Date;
  durationTimeValue: number;
  travelTimeValue: number;
  isFixed: boolean;
  preferredStartTime: number | null;
  preferredEndTime: number | null;
  onSetActivePartition: (index: number) => void;
  onAddPartition: () => void;
  onDiscardPartition: () => void;
  onSetStartTime: (date: Date) => void;
  onSetDurationTime: (value: number) => void;
  onSetTravelTime: (value: number) => void;
  onSetPreferredStartTime: (val: number | null) => void;
  onSetPreferredEndTime: (val: number | null) => void;
};

export default function TimePartitionForm({
  partitions,
  activePartitionIndex,
  startTime,
  durationTimeValue,
  travelTimeValue,
  isFixed,
  preferredStartTime,
  preferredEndTime,
  onSetActivePartition,
  onAddPartition,
  onDiscardPartition,
  onSetStartTime,
  onSetDurationTime,
  onSetTravelTime,
  onSetPreferredStartTime,
  onSetPreferredEndTime,
}: TimePartitionFormProps) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showPrefStartPicker, setShowPrefStartPicker] = useState(false);
  const [showPrefEndPicker, setShowPrefEndPicker] = useState(false);
  const [showHelper, setShowHelper] = useState(true);
  const [durationHoursText, setDurationHoursText] = useState("");
  const [durationMinutesText, setDurationMinutesText] = useState("");
  const [travelHoursText, setTravelHoursText] = useState("");
  const [travelMinutesText, setTravelMinutesText] = useState("");

  useEffect(() => {
    const h = Math.floor(durationTimeValue / 60);
    const m = durationTimeValue % 60;

    if (Number(durationHoursText) !== h) {
      setDurationHoursText(String(h));
    }
    if (Number(durationMinutesText) !== m) {
      setDurationMinutesText(String(m));
    }
  }, [durationTimeValue]);

  useEffect(() => {
    const h = Math.floor(travelTimeValue / 60);
    const m = travelTimeValue % 60;

    if (Number(travelHoursText) !== h) {
      setTravelHoursText(String(h));
    }
    if (Number(travelMinutesText) !== m) {
      setTravelMinutesText(String(m));
    }
  }, [travelTimeValue]);

  const handleDurationHoursChange = (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, "");
    setDurationHoursText(cleanText);
    const h = Number(cleanText) || 0;
    const currentM = Number(durationMinutesText) || 0;
    onSetDurationTime(h * 60 + currentM);
  };

  const handleDurationMinutesChange = (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, "");
    setDurationMinutesText(cleanText);
    const m = Number(cleanText) || 0;
    const currentH = Number(durationHoursText) || 0;
    onSetDurationTime(currentH * 60 + m);
  };

  const handleTravelHoursChange = (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, "");
    setTravelHoursText(cleanText);
    const h = Number(cleanText) || 0;
    const currentM = Number(travelMinutesText) || 0;
    onSetTravelTime(h * 60 + currentM);
  };

  const handleTravelMinutesChange = (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, "");
    setTravelMinutesText(cleanText);
    const m = Number(cleanText) || 0;
    const currentH = Number(travelHoursText) || 0;
    onSetTravelTime(currentH * 60 + m);
  };

  const handleToggleRestriction = (val: boolean) => {
    if (val) {
      onSetPreferredStartTime(540); // 09:00 default
      onSetPreferredEndTime(660);   // 11:00 default
    } else {
      onSetPreferredStartTime(null);
      onSetPreferredEndTime(null);
    }
  };

  const minutesToTimeStr = (minutes: number | null): string => {
    if (minutes === null) return "00:00";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const hStr = h < 10 ? `0${h}` : `${h}`;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return `${hStr}:${mStr}`;
  };

  const minutesToDateObject = (minutes: number | null): Date => {
    const d = new Date();
    if (minutes === null) {
      d.setHours(0, 0, 0, 0);
    } else {
      d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    }
    return d;
  };

  const formatWindowDuration = (start: number, end: number) => {
    const diff = end - start;
    if (diff <= 0) return "0min";
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h === 0) return `${m}min`;
    return m === 0 ? `${h}h` : `${h}h ${m}min`;
  };

  const isRestricted = preferredStartTime !== null && preferredEndTime !== null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Horarios del día</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddPartition}>
          <Ionicons name="add" size={20} color={Theme.colors.surface} />
          <Text style={styles.addButtonText}>Añadir bloque</Text>
        </TouchableOpacity>
      </View>
      {showHelper && (
        <View style={styles.helperCard}>
          <Ionicons name="bulb-outline" size={18} color="#8dccff" style={styles.helperIcon} />
          <Text style={styles.helperText}>
            Si realizas esta actividad más de una vez en el mismo día (ej. mañana y tarde), puedes añadir otros bloques para configurarlos.
          </Text>
          <TouchableOpacity onPress={() => setShowHelper(false)} hitSlop={12}>
            <Ionicons name="close" size={18} color={Theme.colors.textTertiary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.segmentTabs}>
        {partitions.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.segmentTab,
              activePartitionIndex === index && styles.segmentTabActive,
            ]}
            onPress={() => onSetActivePartition(index)}
          >
            <Text style={styles.segmentTabText}>{index + 1}</Text>
          </TouchableOpacity>
        ))}
        {partitions.length > 1 && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onDiscardPartition}
          >
            <Ionicons name="trash-outline" size={18} color={Theme.colors.surface} />
          </TouchableOpacity>
        )}
      </View>

      {isFixed ? (
        <>
          <Text style={styles.fieldLabel}>Hora de inicio</Text>
          <TouchableOpacity
            style={styles.timeInputCard}
            onPress={() => setShowStartPicker((v) => !v)}
          >
            <Ionicons name="time-outline" size={26} color={Theme.colors.surface} />
            <Text style={styles.timeInputText}>{formatTime(startTime)}</Text>
          </TouchableOpacity>

          {(showStartPicker || Platform.OS === "ios") && (
            <View style={styles.iosPickerCard}>
              <DateTimePicker
                value={startTime}
                mode="time"
                display="spinner"
                themeVariant="dark"
                minuteInterval={5}
                textColor={Theme.colors.surface}
                onChange={(_, selectedDate) => {
                  if (selectedDate) onSetStartTime(selectedDate);
                  if (Platform.OS !== "ios") setShowStartPicker(false);
                }}
                style={styles.iosPicker}
              />
            </View>
          )}
        </>
      ) : (
        <View style={styles.optimizableMessageCard}>
          <Ionicons name="sparkles-outline" size={22} color="#8dccff" />
          <Text style={styles.optimizableMessageText}>
            Esta actividad es optimizable. El algoritmo inteligente elegirá el mejor horario por vos.
          </Text>
        </View>
      )}

      <Text style={styles.fieldLabel}>Duración</Text>
      <View style={styles.chipRow}>
        {[30, 60, 90, 120].map((minutes) => (
          <TimeChip
            key={minutes}
            label={String(minutes)}
            selected={durationTimeValue === minutes}
            onPress={() => onSetDurationTime(minutes)}
          />
        ))}
      </View>
      <View style={styles.timeInputRow}>
        <View style={styles.timeInputColumn}>
          <TextInput
            value={durationHoursText}
            onChangeText={handleDurationHoursChange}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#a8a9bb"
            style={styles.timeInputBox}
          />
          <Text style={styles.timeInputLabel}>Horas</Text>
        </View>

        <View style={styles.timeInputColumn}>
          <TextInput
            value={durationMinutesText}
            onChangeText={handleDurationMinutesChange}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#a8a9bb"
            style={styles.timeInputBox}
          />
          <Text style={styles.timeInputLabel}>Minutos</Text>
        </View>
      </View>

      <Text style={styles.fieldLabel}>Traslado</Text>
      <View style={styles.chipRow}>
        {[0, 10, 15, 20].map((minutes) => (
          <TimeChip
            key={minutes}
            label={minutes === 0 ? "Sin" : String(minutes)}
            selected={travelTimeValue === minutes}
            onPress={() => onSetTravelTime(minutes)}
          />
        ))}
      </View>
      <View style={styles.timeInputRow}>
        <View style={styles.timeInputColumn}>
          <TextInput
            value={travelHoursText}
            onChangeText={handleTravelHoursChange}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#a8a9bb"
            style={styles.timeInputBox}
          />
          <Text style={styles.timeInputLabel}>Horas</Text>
        </View>

        <View style={styles.timeInputColumn}>
          <TextInput
            value={travelMinutesText}
            onChangeText={handleTravelMinutesChange}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#a8a9bb"
            style={styles.timeInputBox}
          />
          <Text style={styles.timeInputLabel}>Minutos</Text>
        </View>
      </View>

      {!isFixed && (
        <View style={styles.restrictionSection}>
          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.restrictionTitle}>Restringir horario</Text>
              <Text style={styles.restrictionSubtitle}>
                Restringe esta actividad dentro de un rango de horas preferido
              </Text>
            </View>
            <Switch
              value={isRestricted}
              onValueChange={handleToggleRestriction}
              disabled={durationTimeValue >= 1440}
              trackColor={{ false: "#525576", true: Theme.comfyColors.green }}
              thumbColor={Theme.colors.surface}
            />
          </View>

          {isRestricted && (
            <View style={styles.restrictionDetails}>
              <View style={styles.timeRangePickerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.timeLabel}>Desde</Text>
                  <TouchableOpacity
                    style={styles.timeSelectorBtn}
                    onPress={() => {
                      setShowPrefStartPicker(true);
                      setShowPrefEndPicker(false);
                    }}
                  >
                    <Ionicons name="time-outline" size={20} color={Theme.colors.surface} />
                    <Text style={styles.timeSelectorText}>
                      {minutesToTimeStr(preferredStartTime)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ width: 16, alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
                  <Text style={{ color: Theme.colors.textSecondary }}>—</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.timeLabel}>Hasta</Text>
                  <TouchableOpacity
                    style={styles.timeSelectorBtn}
                    onPress={() => {
                      setShowPrefEndPicker(true);
                      setShowPrefStartPicker(false);
                    }}
                  >
                    <Ionicons name="time-outline" size={20} color={Theme.colors.surface} />
                    <Text style={styles.timeSelectorText}>
                      {minutesToTimeStr(preferredEndTime)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showPrefStartPicker && (
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={minutesToDateObject(preferredStartTime)}
                    mode="time"
                    display="spinner"
                    themeVariant="dark"
                    textColor={Theme.colors.surface}
                    onChange={(_, selectedDate) => {
                      if (selectedDate) {
                        const mins = selectedDate.getHours() * 60 + selectedDate.getMinutes();
                        onSetPreferredStartTime(mins);
                      }
                      if (Platform.OS !== "ios") setShowPrefStartPicker(false);
                    }}
                  />
                  {Platform.OS === "ios" && (
                    <TouchableOpacity
                      style={styles.doneBtn}
                      onPress={() => setShowPrefStartPicker(false)}
                    >
                      <Text style={styles.doneText}>Aceptar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {showPrefEndPicker && (
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={minutesToDateObject(preferredEndTime)}
                    mode="time"
                    display="spinner"
                    themeVariant="dark"
                    textColor={Theme.colors.surface}
                    onChange={(_, selectedDate) => {
                      if (selectedDate) {
                        const mins = selectedDate.getHours() * 60 + selectedDate.getMinutes();
                        onSetPreferredEndTime(mins);
                      }
                      if (Platform.OS !== "ios") setShowPrefEndPicker(false);
                    }}
                  />
                  {Platform.OS === "ios" && (
                    <TouchableOpacity
                      style={styles.doneBtn}
                      onPress={() => setShowPrefEndPicker(false)}
                    >
                      <Text style={styles.doneText}>Aceptar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <View style={styles.windowInfoContainer}>
                {preferredEndTime! - preferredStartTime! < durationTimeValue ? (
                  <View style={styles.warningContainer}>
                    <Ionicons name="warning" size={16} color={Theme.colors.error} />
                    <Text style={styles.warningText}>
                      La ventana seleccionada ({preferredEndTime! - preferredStartTime!} min) es más corta que la duración estimada ({durationTimeValue} min)
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.windowLengthText}>
                    Ventana: {formatWindowDuration(preferredStartTime!, preferredEndTime!)}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 24,
    padding: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: Theme.colors.surface,
    fontSize: 18,
    fontWeight: "900",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Theme.colors.cardBorder,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    color: Theme.colors.surface,
    fontSize: 12,
    fontWeight: "800",
  },
  helperCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(141, 204, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(141, 204, 255, 0.15)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    marginTop: -4,
    marginBottom: 8,
  },
  helperIcon: {
    marginTop: 1,
  },
  helperText: {
    flex: 1,
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  segmentTabs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  segmentTab: {
    width: 38,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4d506c",
  },
  segmentTabActive: {
    backgroundColor: "#5665dc",
  },
  segmentTabText: {
    color: Theme.colors.surface,
    fontSize: 14,
    fontWeight: "900",
  },
  deleteButton: {
    marginLeft: "auto",
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.error,
  },
  fieldLabel: {
    color: Theme.colors.iconPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  fieldUnit: {
    fontSize: 12,
  },
  timeInputCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: "#545875",
    paddingHorizontal: 16,
  },
  timeInputText: {
    color: Theme.colors.surface,
    fontSize: 18,
    fontWeight: "900",
  },
  iosPickerCard: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#454866",
    alignItems: "center",
    justifyContent: "center",
  },
  iosPicker: {
    height: 128,
    width: "100%",
  },
  chipRow: {
    flexDirection: "row",
    gap: 14,
  },
  minutesInput: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#51546e",
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "800",
    paddingHorizontal: 20,
  },
  optimizableMessageCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(141,204,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(141,204,255,0.22)",
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  optimizableMessageText: {
    flex: 1,
    color: Theme.colors.iconPrimary,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  timeInputRow: {
    flexDirection: "row",
    gap: 16,
  },
  timeInputColumn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#51546e",
    borderRadius: 16,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  timeInputBox: {
    flex: 1,
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "800",
    paddingVertical: 8,
  },
  timeInputLabel: {
    color: "#a8a9bb",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.cardBorder,
    marginVertical: 14,
    opacity: 0.5,
  },
  restrictionSection: {
    marginTop: 8,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  restrictionTitle: {
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "800",
  },
  restrictionSubtitle: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
    lineHeight: 15,
  },
  restrictionDetails: {
    marginTop: 16,
    gap: 12,
  },
  timeRangePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  timeSelectorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Theme.colors.screenBackground,
    borderColor: Theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  timeSelectorText: {
    color: Theme.colors.surface,
    fontSize: 15,
    fontWeight: "700",
  },
  pickerContainer: {
    backgroundColor: Theme.colors.screenBackground,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    marginTop: 4,
  },
  doneBtn: {
    alignSelf: "flex-end",
    backgroundColor: Theme.comfyColors.green,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  doneText: {
    color: Theme.comfyFontColors.green,
    fontWeight: "800",
    fontSize: 12,
  },
  windowInfoContainer: {
    marginTop: 4,
  },
  windowLengthText: {
    color: Theme.comfyColors.green,
    fontSize: 13,
    fontWeight: "800",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 77, 77, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 77, 77, 0.2)",
    borderRadius: 10,
    padding: 10,
  },
  warningText: {
    color: Theme.colors.error,
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
    lineHeight: 16,
  },
});
