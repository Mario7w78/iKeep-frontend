import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  StyleSheet,
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
  onSetActivePartition: (index: number) => void;
  onAddPartition: () => void;
  onDiscardPartition: () => void;
  onSetStartTime: (date: Date) => void;
  onSetDurationTime: (value: number) => void;
  onSetTravelTime: (value: number) => void;
};

export default function TimePartitionForm({
  partitions,
  activePartitionIndex,
  startTime,
  durationTimeValue,
  travelTimeValue,
  isFixed,
  onSetActivePartition,
  onAddPartition,
  onDiscardPartition,
  onSetStartTime,
  onSetDurationTime,
  onSetTravelTime,
}: TimePartitionFormProps) {
  const [showStartPicker, setShowStartPicker] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Horarios del día</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddPartition}>
          <Ionicons name="add" size={20} color={Theme.colors.surface} />
          <Text style={styles.addButtonText}>Añadir bloque</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.helperText}>
        Si Realizas esta actividad en más de un momento el mismo día (Ej: mañana y tarde), Añade otros bloques para configurarlos.
      </Text>

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

      <Text style={styles.fieldLabel}>
        Duración <Text style={styles.fieldUnit}>(minutos)</Text>
      </Text>
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
      <TextInput
        value={String(durationTimeValue || "")}
        onChangeText={(value) => onSetDurationTime(Number(value) || 0)}
        keyboardType="number-pad"
        placeholder="60"
        placeholderTextColor="#a8a9bb"
        style={styles.minutesInput}
      />

      <Text style={styles.fieldLabel}>
        Traslado <Text style={styles.fieldUnit}>(minutos)</Text>
      </Text>
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
      <TextInput
        value={travelTimeValue === 0 ? "" : String(travelTimeValue)}
        onChangeText={(value) => onSetTravelTime(Number(value) || 0)}
        keyboardType="number-pad"
        placeholder="Sin traslado"
        placeholderTextColor="#a8a9bb"
        style={styles.minutesInput}
      />
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
  helperText: {
    color: Theme.colors.iconPrimary,
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 16,
    marginTop: -8,
    marginBottom: 4,
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
  },
  iosPicker: {
    height: 128,
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
});
