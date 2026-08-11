import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Switch,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { PartitionConfig } from "../../../../domain/entities/activity.types";
import { useTheme } from "../../theme/colors";
import type { ThemeColors } from "../../theme/colors";
import TimeChip from "../../atoms/CreateActivity/TimeChip";
import { calculateDurationAcrossMidnight } from "../../../utils/timeUtils";

const formatTime = (date: Date) =>
  new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

type TimePartitionFormProps = {
  partitions: PartitionConfig[];
  activePartitionIndex: number;
  startTime: Date;
  endTime: Date;
  durationTimeValue: number;
  travelToValue: number | null;
  travelFromValue: number | null;
  isFixed: boolean;
  preferredStartTime: number | null;
  preferredEndTime: number | null;
  onSetActivePartition: (index: number) => void;
  onAddPartition: () => void;
  onDiscardPartition: (index?: number) => void;
  onSetStartTime: (date: Date) => void;
  onSetEndTime: (date: Date) => void;
  onSetDurationTime: (value: number) => void;
  onSetTravelToValue: (value: number, partitionIndex?: number) => void;
  onSetTravelFromValue: (value: number, partitionIndex?: number) => void;
  onSetPreferredStartTime: (val: number | null) => void;
  onSetPreferredEndTime: (val: number | null) => void;
};

export default function TimePartitionForm({
  partitions,
  activePartitionIndex,
  startTime,
  endTime,
  durationTimeValue,
  travelToValue,
  travelFromValue,
  isFixed,
  preferredStartTime,
  preferredEndTime,
  onSetActivePartition,
  onAddPartition,
  onDiscardPartition,
  onSetStartTime,
  onSetEndTime,
  onSetDurationTime,
  onSetTravelToValue,
  onSetTravelFromValue,
  onSetPreferredStartTime,
  onSetPreferredEndTime,
}: TimePartitionFormProps) {
  const [showStartPickerIndex, setShowStartPickerIndex] = useState<number | null>(null);
  const [showEndPickerIndex, setShowEndPickerIndex] = useState<number | null>(null);
  const [showCustomTravelToPickerIndex, setShowCustomTravelToPickerIndex] = useState<number | null>(null);
  const [showCustomTravelFromPickerIndex, setShowCustomTravelFromPickerIndex] = useState<number | null>(null);
  const [showPrefStartPicker, setShowPrefStartPicker] = useState(false);
  const [showPrefEndPicker, setShowPrefEndPicker] = useState(false);
  const [durationHoursText, setDurationHoursText] = useState("");
  const [durationMinutesText, setDurationMinutesText] = useState("");
  const [travelCustomToHoursText, setTravelCustomToHoursText] = useState("");
  const [travelCustomToMinutesText, setTravelCustomToMinutesText] = useState("");
  const [travelCustomFromHoursText, setTravelCustomFromHoursText] = useState("");
  const [travelCustomFromMinutesText, setTravelCustomFromMinutesText] = useState("");

  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors, comfyColors, comfyFontColors]);

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

  const handleTravelCustomHoursChange = (
    text: string,
    setHours: (v: string) => void,
    setMinutes: (v: string) => void,
    currentMinutes: string,
    onSetValue: (v: number, idx?: number) => void,
    partitionIndex: number,
  ) => {
    const cleanText = text.replace(/[^0-9]/g, "");
    setHours(cleanText);
    const h = Number(cleanText) || 0;
    const m = Number(currentMinutes) || 0;
    onSetValue(h * 60 + m, partitionIndex);
  };

  const handleTravelCustomMinutesChange = (
    text: string,
    setMinutes: (v: string) => void,
    currentHours: string,
    onSetValue: (v: number, idx?: number) => void,
    partitionIndex: number,
  ) => {
    const cleanText = text.replace(/[^0-9]/g, "");
    setMinutes(cleanText);
    const m = Number(cleanText) || 0;
    const h = Number(currentHours) || 0;
    onSetValue(h * 60 + m, partitionIndex);
  };

  const initTravelCustomText = (
    value: number | null,
    setHours: (v: string) => void,
    setMinutes: (v: string) => void,
  ) => {
    const v = value ?? 0;
    setHours(String(Math.floor(v / 60)));
    setMinutes(String(v % 60));
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
    const diff = calculateDurationAcrossMidnight(start, end);
    if (diff <= 0) return "0min";
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h === 0) return `${m}min`;
    return m === 0 ? `${h}h` : `${h}h ${m}min`;
  };

  const isRestricted = preferredStartTime !== null && preferredEndTime !== null;

  const getPartitionTitle = (index: number) => {
    const titles = ["Primer Horario", "Segundo Horario", "Tercer Horario", "Cuarto Horario", "Quinto Horario"];
    return titles[index] || `Horario ${index + 1}`;
  };

  const getDurationHours = (partition: PartitionConfig, index: number) => {
    if (activePartitionIndex === index) return durationHoursText;
    return String(Math.floor(partition.durationTime / 60));
  };

  const getDurationMinutes = (partition: PartitionConfig, index: number) => {
    if (activePartitionIndex === index) return durationMinutesText;
    return String(partition.durationTime % 60);
  };

  const travelChips = [
    { label: "Sin", value: 0 },
    { label: "5 min", value: 5 },
    { label: "10 min", value: 10 },
    { label: "15 min", value: 15 },
    { label: "30 min", value: 30 },
    { label: "1 hora", value: 60 },
  ];

  return (
    <View style={styles.card}>
      {partitions.map((partition, index) => {
        return (
          <View key={index} style={styles.partitionCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{getPartitionTitle(index)}</Text>
              {partitions.length > 1 && (
                <TouchableOpacity
                  style={styles.cardDeleteButton}
                  onPress={() => onDiscardPartition(index)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>

            {isFixed ? (
              <View>
                <View style={styles.timeInputsContainer}>
                  <View style={styles.timeInputCol}>
                    <Text style={styles.cardFieldLabel}>Hora de inicio</Text>
                    <TouchableOpacity
                      style={styles.timeInputCard}
                      onPress={() => {
                        onSetActivePartition(index);
                        setShowStartPickerIndex(index);
                        setShowEndPickerIndex(null);
                        setShowCustomTravelToPickerIndex(null);
                        setShowCustomTravelFromPickerIndex(null);
                      }}
                    >
                      <Ionicons name="time-outline" size={22} color={colors.surface} />
                      <Text style={styles.timeInputText}>{formatTime(partition.startHour)}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.timeInputCol}>
                    <Text style={styles.cardFieldLabel}>Hora de fin</Text>
                    <TouchableOpacity
                      style={styles.timeInputCard}
                      onPress={() => {
                        onSetActivePartition(index);
                        setShowEndPickerIndex(index);
                        setShowStartPickerIndex(null);
                        setShowCustomTravelToPickerIndex(null);
                        setShowCustomTravelFromPickerIndex(null);
                      }}
                    >
                      <Ionicons name="time-outline" size={22} color={colors.surface} />
                      <Text style={styles.timeInputText}>{formatTime(partition.endHour)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {showStartPickerIndex === index && (
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={partition.startHour}
                      mode="time"
                      display="spinner"
                      themeVariant="dark"
                      minuteInterval={5}
                      textColor={colors.surface}
                      onChange={(_, selectedDate) => {
                        if (selectedDate) onSetStartTime(selectedDate);
                        if (Platform.OS !== "ios") setShowStartPickerIndex(null);
                      }}
                      style={styles.pickerInner}
                    />
                    {Platform.OS === "ios" && (
                      <TouchableOpacity
                        style={styles.doneBtn}
                        onPress={() => setShowStartPickerIndex(null)}
                      >
                        <Text style={styles.doneText}>Aceptar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {showEndPickerIndex === index && (
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={partition.endHour}
                      mode="time"
                      display="spinner"
                      themeVariant="dark"
                      minuteInterval={5}
                      textColor={colors.surface}
                      onChange={(_, selectedDate) => {
                        if (selectedDate) onSetEndTime(selectedDate);
                        if (Platform.OS !== "ios") setShowEndPickerIndex(null);
                      }}
                      style={styles.pickerInner}
                    />
                    {Platform.OS === "ios" && (
                      <TouchableOpacity
                        style={styles.doneBtn}
                        onPress={() => setShowEndPickerIndex(null)}
                      >
                        <Text style={styles.doneText}>Aceptar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.durationInputContainer}>
                <Text style={styles.cardFieldLabel}>Duración</Text>
                <View style={styles.timeInputRow}>
                  <View style={styles.timeInputColumn}>
                    <TextInput
                      value={getDurationHours(partition, index)}
                      onChangeText={(text) => {
                        onSetActivePartition(index);
                        handleDurationHoursChange(text);
                      }}
                      onFocus={() => onSetActivePartition(index)}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#a8a9bb"
                      style={styles.timeInputBox}
                      autoCorrect={false}
                    />
                    <Text style={styles.timeInputLabel}>Horas</Text>
                  </View>

                  <View style={styles.timeInputColumn}>
                    <TextInput
                      value={getDurationMinutes(partition, index)}
                      onChangeText={(text) => {
                        onSetActivePartition(index);
                        handleDurationMinutesChange(text);
                      }}
                      onFocus={() => onSetActivePartition(index)}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#a8a9bb"
                      style={styles.timeInputBox}
                      autoCorrect={false}
                    />
                    <Text style={styles.timeInputLabel}>Minutos</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Traslado antes */}
            <View style={styles.trasladoContainer}>
              <Text style={styles.cardFieldLabel}>Traslado antes</Text>
              <View style={styles.chipsRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                  <TouchableOpacity
                    style={[styles.quickChip, partition.travelTo !== null && !travelChips.some(c => c.value === partition.travelTo) && styles.quickChipSelected]}
                    onPress={() => {
                      onSetActivePartition(index);
                      setShowCustomTravelToPickerIndex(index);
                      setShowCustomTravelFromPickerIndex(null);
                      setShowStartPickerIndex(null);
                      setShowEndPickerIndex(null);
                      initTravelCustomText(partition.travelTo, setTravelCustomToHoursText, setTravelCustomToMinutesText);
                    }}
                  >
                    <Text style={[styles.quickChipText, partition.travelTo !== null && !travelChips.some(c => c.value === partition.travelTo) && styles.quickChipTextSelected]}>
                      {partition.travelTo !== null && !travelChips.some(c => c.value === partition.travelTo) ? `${partition.travelTo} min` : "Personalizar..."}
                    </Text>
                  </TouchableOpacity>
                  {travelChips.map((chip) => {
                    const isSelected = partition.travelTo === chip.value;
                    return (
                      <TouchableOpacity
                        key={chip.value}
                        style={[styles.quickChip, isSelected && styles.quickChipSelected]}
                        onPress={() => {
                          onSetActivePartition(index);
                          onSetTravelToValue(chip.value, index);
                          setShowCustomTravelToPickerIndex(null);
                        }}
                      >
                        <Text style={[styles.quickChipText, isSelected && styles.quickChipTextSelected]}>
                          {chip.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {showCustomTravelToPickerIndex === index && (
                <View style={styles.pickerContainer}>
                  <View style={styles.timeInputRow}>
                    <View style={styles.timeInputColumn}>
                      <TextInput
                        value={travelCustomToHoursText}
                        onChangeText={(text) =>
                          handleTravelCustomHoursChange(
                            text,
                            setTravelCustomToHoursText,
                            setTravelCustomToMinutesText,
                            travelCustomToMinutesText,
                            onSetTravelToValue,
                            index,
                          )
                        }
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor="#a8a9bb"
                        style={styles.timeInputBox}
                        autoCorrect={false}
                      />
                      <Text style={styles.timeInputLabel}>Horas</Text>
                    </View>
                    <View style={styles.timeInputColumn}>
                      <TextInput
                        value={travelCustomToMinutesText}
                        onChangeText={(text) =>
                          handleTravelCustomMinutesChange(
                            text,
                            setTravelCustomToMinutesText,
                            travelCustomToHoursText,
                            onSetTravelToValue,
                            index,
                          )
                        }
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor="#a8a9bb"
                        style={styles.timeInputBox}
                        autoCorrect={false}
                      />
                      <Text style={styles.timeInputLabel}>Minutos</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Viaje después */}
            <View style={styles.trasladoContainer}>
              <Text style={styles.cardFieldLabel}>Viaje después</Text>
              <View style={styles.chipsRow}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                  <TouchableOpacity
                    style={[styles.quickChip, partition.travelFrom !== null && !travelChips.some(c => c.value === partition.travelFrom) && styles.quickChipSelected]}
                    onPress={() => {
                      onSetActivePartition(index);
                      setShowCustomTravelFromPickerIndex(index);
                      setShowCustomTravelToPickerIndex(null);
                      setShowStartPickerIndex(null);
                      setShowEndPickerIndex(null);
                      initTravelCustomText(partition.travelFrom, setTravelCustomFromHoursText, setTravelCustomFromMinutesText);
                    }}
                  >
                    <Text style={[styles.quickChipText, partition.travelFrom !== null && !travelChips.some(c => c.value === partition.travelFrom) && styles.quickChipTextSelected]}>
                      {partition.travelFrom !== null && !travelChips.some(c => c.value === partition.travelFrom) ? `${partition.travelFrom} min` : "Personalizar..."}
                    </Text>
                  </TouchableOpacity>
                  {travelChips.map((chip) => {
                    const isSelected = partition.travelFrom === chip.value;
                    return (
                      <TouchableOpacity
                        key={chip.value}
                        style={[styles.quickChip, isSelected && styles.quickChipSelected]}
                        onPress={() => {
                          onSetActivePartition(index);
                          onSetTravelFromValue(chip.value, index);
                          setShowCustomTravelFromPickerIndex(null);
                        }}
                      >
                        <Text style={[styles.quickChipText, isSelected && styles.quickChipTextSelected]}>
                          {chip.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {showCustomTravelFromPickerIndex === index && (
                <View style={styles.pickerContainer}>
                  <View style={styles.timeInputRow}>
                    <View style={styles.timeInputColumn}>
                      <TextInput
                        value={travelCustomFromHoursText}
                        onChangeText={(text) =>
                          handleTravelCustomHoursChange(
                            text,
                            setTravelCustomFromHoursText,
                            setTravelCustomFromMinutesText,
                            travelCustomFromMinutesText,
                            onSetTravelFromValue,
                            index,
                          )
                        }
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor="#a8a9bb"
                        style={styles.timeInputBox}
                        autoCorrect={false}
                      />
                      <Text style={styles.timeInputLabel}>Horas</Text>
                    </View>
                    <View style={styles.timeInputColumn}>
                      <TextInput
                        value={travelCustomFromMinutesText}
                        onChangeText={(text) =>
                          handleTravelCustomMinutesChange(
                            text,
                            setTravelCustomFromMinutesText,
                            travelCustomFromHoursText,
                            onSetTravelFromValue,
                            index,
                          )
                        }
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor="#a8a9bb"
                        style={styles.timeInputBox}
                        autoCorrect={false}
                      />
                      <Text style={styles.timeInputLabel}>Minutos</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        );
      })}

      <TouchableOpacity style={styles.ghostButton} onPress={onAddPartition}>
        <Ionicons name="add" size={22} color={colors.secondaryAccent} />
        <Text style={styles.ghostButtonText}>+ Añadir otro turno este mismo día</Text>
      </TouchableOpacity>

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
              trackColor={{ false: colors.cardBorder, true: comfyColors.green }}
              thumbColor={colors.surface}
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
                    <Ionicons name="time-outline" size={20} color={colors.surface} />
                    <Text style={styles.timeSelectorText}>
                      {minutesToTimeStr(preferredStartTime)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ width: 16, alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
                  <Text style={{ color: colors.textSecondary }}>—</Text>
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
                    <Ionicons name="time-outline" size={20} color={colors.surface} />
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
                    textColor={colors.surface}
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
                    textColor={colors.surface}
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
                {calculateDurationAcrossMidnight(preferredStartTime!, preferredEndTime!) < durationTimeValue ? (
                  <View style={styles.warningContainer}>
                    <Ionicons name="warning" size={16} color={colors.error} />
                    <Text style={styles.warningText}>
                      La ventana seleccionada ({calculateDurationAcrossMidnight(preferredStartTime!, preferredEndTime!)} min) es más corta que la duración estimada ({durationTimeValue} min)
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

const createStyles = (colors: ThemeColors, comfyColors: Record<string, string>, comfyFontColors: Record<string, string>) => StyleSheet.create({
  card: {
    gap: 16,
  },
  partitionCard: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.cardBorder,
    borderWidth: 2,
    borderRadius: 24,
    padding: 16,
    gap: 16,
    position: "relative",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: "900",
  },
  cardDeleteButton: {
    padding: 6,
    borderRadius: 8,
  },
  timeInputsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  timeInputCol: {
    flex: 1,
    gap: 6,
  },
  cardFieldLabel: {
    color: colors.iconPrimary,
    fontSize: 14,
    fontWeight: "900",
  },
  durationInputContainer: {
    gap: 6,
  },
  trasladoContainer: {
    gap: 8,
  },
  quickChip: {
    backgroundColor: colors.screenBackground,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  quickChipSelected: {
    backgroundColor: `${colors.iconPrimary}20`,
    borderColor: colors.iconPrimary,
  },
  quickChipText: {
    color: colors.textTertiary,
    fontSize: 13,
    fontWeight: "800",
  },
  quickChipTextSelected: {
    color: colors.surface,
  },
  chipsRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  chipsScroll: {
    gap: 8,
    paddingRight: 16,
  },
  ghostButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: colors.secondaryAccent,
    borderRadius: 20,
    paddingVertical: 14,
    marginTop: 8,
    backgroundColor: "transparent",
  },
  ghostButtonText: {
    color: colors.secondaryAccent,
    fontSize: 15,
    fontWeight: "900",
  },
  timeInputCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: colors.screenBackground,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    paddingHorizontal: 20,
  },
  timeInputText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: "900",
  },
  pickerInner: {
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
    backgroundColor: colors.screenBackground,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    color: colors.surface,
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
    color: colors.iconPrimary,
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
    backgroundColor: colors.screenBackground,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  timeInputBox: {
    flex: 1,
    color: colors.surface,
    fontSize: 16,
    fontWeight: "800",
    paddingVertical: 8,
  },
  timeInputLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
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
    color: colors.surface,
    fontSize: 16,
    fontWeight: "800",
  },
  restrictionSubtitle: {
    color: colors.textSecondary,
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
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  timeSelectorBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.screenBackground,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  timeSelectorText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "700",
  },
  pickerContainer: {
    backgroundColor: colors.screenBackground,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginTop: 4,
  },
  doneBtn: {
    alignSelf: "flex-end",
    backgroundColor: comfyColors.green,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 6,
    marginRight: 4,
  },
  doneText: {
    color: comfyFontColors.green,
    fontWeight: "800",
    fontSize: 12,
  },
  windowInfoContainer: {
    marginTop: 4,
  },
  windowLengthText: {
    color: comfyColors.green,
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
    color: colors.error,
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
    lineHeight: 16,
  },
});
