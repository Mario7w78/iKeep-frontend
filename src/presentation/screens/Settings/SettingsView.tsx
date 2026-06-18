import React, { useState, useEffect, useMemo } from "react";
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
import { useTheme, getThemePresets } from "../../components/theme/colors";
import { useScheduleStore } from "../../../di/Dependencies";
import {
  dateToMinutes,
  minutesToDate,
  formatTime,
} from "../../utils/timeUtils";
import {
  saveEnergyPatternOverride,
  getEnergyPatternOverride,
} from "../../../infrastructure/persistence/EnergyHistoryService";

const PATTERN_OPTIONS = [
  {
    value: null as string | null,
    label: 'Automático',
    desc: 'Deja que iKeep decida según tu historial de los últimos 14 días',
  },
  {
    value: 'TRANSCRIPTORIO',
    label: 'Normal',
    desc: 'Tu energía es normal, día a día variable. Sin restricciones extra.',
  },
  {
    value: 'TENDENCIA',
    label: 'Últimamente bajo',
    desc: 'Vienes con menos energía — el scheduler limita a 1 tarea pesada por día',
  },
  {
    value: 'CRONICO',
    label: 'Siempre bajo',
    desc: 'Tu energía es consistentemente baja — el scheduler es más conservador con tareas difíciles',
  },
];

const SettingsView = () => {
  const {
    startHour,
    endHour,
    setStartHour,
    setEndHour,
    handleGenerateSchedule,
    customEnergyPattern,
    setCustomEnergyPattern,
  } = useScheduleStore();

  const { themeId, setThemeId, colors, comfyColors, comfyFontColors } = useTheme();
  const themePresets = getThemePresets();
  const styles = useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);

  const [localStartTime, setLocalStartTime] = useState(
    minutesToDate(startHour)
  );
  const [localEndTime, setLocalEndTime] = useState(
    minutesToDate(endHour)
  );
  useEffect(() => {
    setLocalStartTime(minutesToDate(startHour));
    setLocalEndTime(minutesToDate(endHour));
  }, [startHour, endHour]);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [localPattern, setLocalPattern] = useState<string | null>(null);
  const [showPatternOptions, setShowPatternOptions] = useState(false);

  useEffect(() => {
    const loadPattern = async () => {
      const saved = await getEnergyPatternOverride();
      setLocalPattern(saved);
    };
    loadPattern();
  }, []);

  useEffect(() => {
    setLocalPattern(customEnergyPattern);
  }, [customEnergyPattern]);

  const handleApplyChanges = () => {
    setShowStartPicker(false);
    setShowEndPicker(false);
    const newStart = dateToMinutes(localStartTime);
    const newEndRaw = dateToMinutes(localEndTime);
    const newEnd = newEndRaw === 0 ? 1440 : newEndRaw;

    Alert.alert(
      "¿Actualizar horario?",
      `¿Quieres cambiar el horario del día a ${formatTime(localStartTime)} - ${formatTime(localEndTime)}? Esto recalculará todas tus actividades planificadas.`,
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => {
            setLocalStartTime(minutesToDate(startHour));
            setLocalEndTime(minutesToDate(endHour));
          },
        },
        {
          text: "Sí, aplicar",
          style: "default",
          onPress: async () => {
            await setStartHour(newStart);
            await setEndHour(newEnd);
            try {
              await handleGenerateSchedule();
            } catch (e) {
              console.error("Error regenerating schedule:", e);
            }
          },
        },
      ]
    );
  };

  const getMinutesForStart = () => dateToMinutes(localStartTime);
  const getMinutesForEnd = () => {
    const mins = dateToMinutes(localEndTime);
    return mins === 0 ? 1440 : mins;
  };
  const hasPendingChanges = getMinutesForStart() !== startHour || getMinutesForEnd() !== endHour;

  const currentPatternLabel = PATTERN_OPTIONS.find(
    (o) => o.value === localPattern
  )?.label ?? 'Automático';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Configuración</Text>

        {/* ═══════════════ HORARIO ═══════════════ */}
        <Text style={styles.sectionHeader}>HORARIO</Text>
        <View style={styles.section}>
          {/* Inicio picker */}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => {
              setShowStartPicker((v) => !v);
              setShowEndPicker(false);
            }}
          >
            <Text style={styles.rowLabel}>Inicio del día</Text>
            <Text style={styles.rowValue}>{formatTime(localStartTime)}</Text>
            <Ionicons
              name={showStartPicker ? "chevron-up" : "chevron-forward"}
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {showStartPicker && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={localStartTime}
                mode="time"
                display="spinner"
                themeVariant="dark"
                textColor={colors.surface}
                onChange={(_, selectedDate) => {
                  if (selectedDate) setLocalStartTime(selectedDate);
                }}
                style={styles.picker}
              />
            </View>
          )}

          <View style={styles.separator} />

          {/* Fin picker */}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => {
              setShowEndPicker((v) => !v);
              setShowStartPicker(false);
            }}
          >
            <Text style={styles.rowLabel}>Fin del día</Text>
            <Text style={styles.rowValue}>{formatTime(localEndTime)}</Text>
            <Ionicons
              name={showEndPicker ? "chevron-up" : "chevron-forward"}
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {showEndPicker && (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={localEndTime}
                mode="time"
                display="spinner"
                themeVariant="dark"
                textColor={colors.surface}
                onChange={(_, selectedDate) => {
                  if (selectedDate) setLocalEndTime(selectedDate);
                }}
                style={styles.picker}
              />
            </View>
          )}

          {hasPendingChanges && (
            <>
              <View style={styles.separator} />
              <TouchableOpacity
                style={styles.globalApplyButton}
                activeOpacity={0.8}
                onPress={handleApplyChanges}
              >
                <Text style={styles.globalApplyButtonText}>Aplicar cambios</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <Text style={styles.sectionFooter}>
          Configura el rango de horas disponible para tu día. Aplica a todos los días de la semana.
        </Text>

        {/* ═══════════════ APARIENCIA ═══════════════ */}
        <Text style={styles.sectionHeader}>APARIENCIA</Text>
        <View style={styles.section}>
          <View style={styles.themeGrid}>
            {themePresets.map((preset) => {
              const isActive = themeId === preset.id;
              return (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.themeCard,
                    isActive && styles.themeCardActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setThemeId(preset.id)}
                >
                  <View style={[styles.themePreview, { backgroundColor: preset.colors.screenBackground }]}>
                    <View style={[styles.themePreviewCard, { backgroundColor: preset.colors.cardBackground, borderColor: preset.colors.cardBorder }]}>
                      <View style={[styles.themePreviewDot, { backgroundColor: preset.accent }]} />
                    </View>
                  </View>
                  <Text style={[
                    styles.themeCardLabel,
                    isActive && styles.themeCardLabelActive,
                  ]}>
                    {preset.name}
                  </Text>
                  {isActive && (
                    <Ionicons name="checkmark-circle" size={18} color={preset.accent} style={styles.themeCheck} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <Text style={styles.sectionFooter}>
          Elegí la combinación de colores que más te guste.
        </Text>

        {/* ═══════════════ ENERGÍA ═══════════════ */}
        <Text style={styles.sectionHeader}>ENERGÍA</Text>
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setShowPatternOptions((v) => !v)}
          >
            <Text style={styles.rowLabel}>Patrón de energía</Text>
            <Text style={styles.rowValue}>{currentPatternLabel}</Text>
            <Ionicons
              name={showPatternOptions ? "chevron-up" : "chevron-forward"}
              size={18}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {showPatternOptions && (
            <View style={styles.patternList}>
              {PATTERN_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value ?? 'auto'}
                  style={[
                    styles.patternRow,
                    localPattern === opt.value && styles.patternRowActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={async () => {
                    setLocalPattern(opt.value);
                    await saveEnergyPatternOverride(opt.value);
                    await setCustomEnergyPattern(opt.value);
                    setShowPatternOptions(false);
                  }}
                >
                  <Ionicons
                    name={localPattern === opt.value ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={localPattern === opt.value ? comfyColors.green : colors.textTertiary}
                  />
                  <View style={styles.patternTextCol}>
                    <Text style={[
                      styles.patternLabel,
                      localPattern === opt.value && styles.patternLabelActive,
                    ]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.patternDesc}>{opt.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <Text style={styles.sectionFooter}>
          El scheduler usa tu nivel de energía para distribuir tareas pesadas sin saturarte.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  comfyColors: ReturnType<typeof useTheme>['comfyColors'],
  _comfyFontColors: ReturnType<typeof useTheme>['comfyFontColors'],
) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 48,
    paddingHorizontal: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.surface,
    marginBottom: 24,
  },

  /* ─── Section headers & footers ─── */
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
  },
  sectionFooter: {
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 16,
    marginTop: 6,
    marginBottom: 24,
    marginLeft: 4,
    paddingHorizontal: 2,
  },

  /* ─── Grouped section container ─── */
  section: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: "hidden",
  },

  /* ─── Row ─── */
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.surface,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textSecondary,
    marginRight: 8,
  },

  /* ─── Separator ─── */
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.cardBorder,
    marginLeft: 16,
  },

  /* ─── Inline picker ─── */
  pickerContainer: {
    backgroundColor: "#3b3e54",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  picker: {
    height: 120,
    width: "100%",
  },

  /* ─── Apply button (iOS) ─── */
  applyButton: {
    backgroundColor: "#4d506c",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.cardBorder,
    paddingVertical: 12,
    alignItems: "center",
  },
  applyButtonText: {
    color: comfyColors.skyBlue,
    fontSize: 15,
    fontWeight: "800",
  },
  globalApplyButton: {
    backgroundColor: "rgba(141, 255, 104, 0.08)",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  globalApplyButtonText: {
    color: comfyColors.green,
    fontSize: 16,
    fontWeight: "800",
  },

  /* ─── Pattern options ─── */
  patternList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.cardBorder,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  patternRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 10,
    marginBottom: 6,
  },
  patternRowActive: {
    backgroundColor: "rgba(141,255,104,0.08)",
  },
  patternTextCol: {
    flex: 1,
  },
  patternLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.surface,
    marginBottom: 2,
  },
  patternLabelActive: {
    color: comfyColors.green,
  },
  patternDesc: {
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 16,
  },

  /* ─── Theme selector ─── */
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 16,
  },
  themeCard: {
    width: '30%',
    flexGrow: 1,
    flexBasis: '30%',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  themeCardActive: {
    borderColor: comfyColors.green,
    backgroundColor: 'rgba(141,255,104,0.08)',
  },
  themePreview: {
    width: 64,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  themePreviewCard: {
    width: 44,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themePreviewDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  themeCardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  themeCardLabelActive: {
    color: comfyColors.green,
  },
  themeCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
});

export default SettingsView;
