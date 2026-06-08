import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DayOfWeek } from "../../../../domain/entities/Activity";
import { DayConfig } from "../../../../domain/entities/activity.types";
import { Theme } from "../../theme/colors";
import DayPickerGrid from "../../molecules/CreateActivity/DayPickerGrid";

type DaySelectionStepProps = {
  selectedDays: DayOfWeek[];
  daysDict: Partial<Record<DayOfWeek, DayConfig>>;
  configuredDaysCount: number;
  isFixed: boolean;
  isAnchor: boolean;
  optionalDay: boolean;
  onSelectDay: (day: DayOfWeek) => void;
  isDayConfigured: (day: DayOfWeek) => boolean;
  onToggleOptionalDay?: (value: boolean) => void;
  dayFrom?: number | null;
  dayTo?: number | null;
  onSetDayFrom?: (day: number) => void;
  onSetDayTo?: (day: number) => void;
};

const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const SHORT_DAY_LABELS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

export default function DaySelectionStep({
  selectedDays,
  daysDict,
  configuredDaysCount,
  isFixed,
  isAnchor,
  optionalDay,
  onSelectDay,
  isDayConfigured,
  onToggleOptionalDay,
  dayFrom,
  dayTo,
  onSetDayFrom,
  onSetDayTo,
}: DaySelectionStepProps) {
  const [showDayRange, setShowDayRange] = useState(false);

  const handleToggleDayRange = () => {
    if (!showDayRange) {
      setShowDayRange(true);
      onSetDayFrom?.(0);
      onSetDayTo?.(6);
    } else {
      setShowDayRange(false);
    }
  };

  const handleSelectRangeDay = (picker: 'from' | 'to', dayIndex: number) => {
    const currentFrom = dayFrom ?? 0;
    const currentTo = dayTo ?? 6;
    if (picker === 'from') {
      const newFrom = Math.min(dayIndex, currentTo);
      onSetDayFrom?.(newFrom);
    } else {
      const newTo = Math.max(dayIndex, currentFrom);
      onSetDayTo?.(newTo);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.iconHero}>
        <Ionicons
          name="calendar-outline"
          size={42}
          color={Theme.comfyColors.green}
        />
      </View>
      <Text style={styles.heroTitle}>Días</Text>
      {!optionalDay && !isAnchor && (
        <Text style={styles.heroSubtitle}>Selecciona los días para la actividad</Text>
      )}
      {isAnchor && (
        <Text style={styles.heroSubtitle}>Elige el día fijo para esta actividad</Text>
      )}

      {!optionalDay && !showDayRange && (
        <DayPickerGrid
          selectedDays={selectedDays}
          daysDict={daysDict}
          onSelect={onSelectDay}
          isDayConfigured={isDayConfigured}
        />
      )}
      {!optionalDay && showDayRange && (
        <View style={styles.rangeSummary}>
          <Ionicons name="options-outline" size={22} color={Theme.comfyColors.skyBlue} />
          <Text style={styles.rangeSummaryText}>
            Programar en rango de {DAY_LABELS[dayFrom ?? 0].toLowerCase()} a {DAY_LABELS[dayTo ?? 6].toLowerCase()}
          </Text>
        </View>
      )}
      {optionalDay && (
        <View style={styles.optionalDayInfo}>
          <Ionicons name="calendar-clear-outline" size={32} color={Theme.comfyColors.yellow} />
          <Text style={styles.optionalDayInfoText}>
            El scheduler asignará la tarea al mejor día disponible
          </Text>
        </View>
      )}

      {!isFixed && !isAnchor && onToggleOptionalDay && (
        <TouchableOpacity
          style={[styles.optionalDayToggle, optionalDay && styles.optionalDayToggleActive]}
          activeOpacity={0.7}
          onPress={() => onToggleOptionalDay(!optionalDay)}
        >
          <Ionicons
            name={optionalDay ? "checkmark-circle" : "ellipse-outline"}
            size={22}
            color={optionalDay ? Theme.comfyColors.green : Theme.colors.textTertiary}
          />
          <View style={styles.optionalDayToggleText}>
            <Text style={[styles.optionalDayToggleTitle, optionalDay && styles.optionalDayToggleTitleActive]}>
              Sin fecha fija
            </Text>
            <Text style={styles.optionalDayToggleSubtitle}>
              El scheduler elige el mejor día
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {!isFixed && !isAnchor && !optionalDay && onSetDayFrom && onSetDayTo && (
        <>
          <TouchableOpacity
            style={[styles.optionalDayToggle, showDayRange && styles.optionalDayToggleActive]}
            activeOpacity={0.7}
            onPress={handleToggleDayRange}
          >
            <Ionicons
              name={showDayRange ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={showDayRange ? Theme.comfyColors.green : Theme.colors.textTertiary}
            />
            <View style={styles.optionalDayToggleText}>
              <Text style={[styles.optionalDayToggleTitle, showDayRange && styles.optionalDayToggleTitleActive]}>
                Rango de días
              </Text>
              <Text style={styles.optionalDayToggleSubtitle}>
                Programar en un rango de días
              </Text>
            </View>
          </TouchableOpacity>

          {showDayRange && (
            <View style={styles.rangePickersRow}>
              <View style={styles.rangePickerColumn}>
                <Text style={styles.rangePickerLabel}>Desde</Text>
                <View style={styles.rangeDayRow}>
                  {SHORT_DAY_LABELS.map((label, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.rangeDayBtn,
                        (dayFrom ?? 0) === idx && styles.rangeDayBtnActive,
                      ]}
                      onPress={() => handleSelectRangeDay('from', idx)}
                    >
                      <Text style={[
                        styles.rangeDayBtnText,
                        (dayFrom ?? 0) === idx && styles.rangeDayBtnTextActive,
                      ]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.rangePickerColumn}>
                <Text style={styles.rangePickerLabel}>Hasta</Text>
                <View style={styles.rangeDayRow}>
                  {SHORT_DAY_LABELS.map((label, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.rangeDayBtn,
                        (dayTo ?? 6) === idx && styles.rangeDayBtnActive,
                      ]}
                      onPress={() => handleSelectRangeDay('to', idx)}
                    >
                      <Text style={[
                        styles.rangeDayBtnText,
                        (dayTo ?? 6) === idx && styles.rangeDayBtnTextActive,
                      ]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </>
      )}

      {!optionalDay && (
        <View style={styles.selectionSummary}>
          <Text style={styles.selectionSummaryText}>
            {showDayRange
              ? `Rango: ${DAY_LABELS[dayFrom ?? 0]} - ${DAY_LABELS[dayTo ?? 6]}`
              : selectedDays.length > 0
              ? `${selectedDays.length} día${selectedDays.length > 1 ? "s" : ""} seleccionado${selectedDays.length > 1 ? "s" : ""}`
              : `${configuredDaysCount} día${configuredDaysCount !== 1 ? "s" : ""} configurado${configuredDaysCount !== 1 ? "s" : ""}`}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  iconHero: {
    alignItems: "center",
    marginTop: 8,
  },
  heroTitle: {
    color: Theme.colors.surface,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  heroSubtitle: {
    color: Theme.colors.iconPrimary,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  selectionSummary: {
    backgroundColor: "rgba(141,255,104,0.14)",
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  selectionSummaryText: {
    color: Theme.colors.surface,
    fontSize: 15,
    fontWeight: "900",
  },
  optionalDayToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionalDayToggleActive: {
    borderColor: Theme.comfyColors.green,
    backgroundColor: "rgba(141,255,104,0.08)",
  },
  optionalDayToggleText: {
    flex: 1,
  },
  optionalDayToggleTitle: {
    color: Theme.colors.surface,
    fontSize: 15,
    fontWeight: "800",
  },
  optionalDayToggleTitleActive: {
    color: Theme.comfyColors.green,
  },
  optionalDayToggleSubtitle: {
    color: Theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  optionalDayInfo: {
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,183,77,0.10)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.comfyColors.yellow,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  optionalDayInfoText: {
    color: Theme.colors.surface,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
  rangeSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(141,204,255,0.10)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.comfyColors.skyBlue,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  rangeSummaryText: {
    color: Theme.colors.surface,
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  rangePickersRow: {
    flexDirection: "column",
    gap: 16,
  },
  rangePickerColumn: {
    gap: 8,
  },
  rangePickerLabel: {
    color: Theme.colors.iconPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  rangeDayRow: {
    flexDirection: "row",
    gap: 6,
  },
  rangeDayBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#4d506c",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  rangeDayBtnActive: {
    backgroundColor: Theme.comfyColors.green,
    borderColor: "rgba(141,255,104,0.3)",
  },
  rangeDayBtnText: {
    color: Theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: "800",
  },
  rangeDayBtnTextActive: {
    color: Theme.comfyFontColors.green,
  },
});
