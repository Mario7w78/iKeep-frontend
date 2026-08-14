import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "../../theme/colors";
import { AreaSelector } from '../../molecules/CreateActivity/AreaSelector';
import { AreaDeVida } from '../../../../domain/entities/lifeArea';
import { BehaviorSelector } from "../../molecules/CreateActivity/BehaviorSelector";
import { ComportamientoActividad } from "../../../../domain/entities/activityBehavior";
import { FieldError } from "../../atoms/Common/FieldError";
import { StepContainer } from "../../atoms/Common/StepContainer";

type NameIdentityStepProps = {
  activityName: string;
  isFixed: boolean;
  difficulty: "baja" | "media" | "alta";
  priority: "baja" | "media" | "alta";
  deadline: Date | null;
  onSetActivityName: (name: string) => void;
  area: AreaDeVida;
  onSetArea: (area: AreaDeVida) => void;
  onSetIsFixed: (fixed: boolean) => void;
  errorNombre?: string;
  comportamiento: ComportamientoActividad;
  onSetComportamiento: (valor: ComportamientoActividad) => void;
  onSetDifficulty: (difficulty: "baja" | "media" | "alta") => void;
  onSetPriority: (priority: "baja" | "media" | "alta") => void;
  onSetDeadline: (deadline: Date | null) => void;
  isAnchor?: boolean;
  onToggleAnchor?: (value: boolean) => void;
  header?: React.ReactNode;  embebido?: boolean;
};

const clearTime = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

function CustomCalendar({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  const today = clearTime(new Date());
  const [viewDate, setViewDate] = useState(new Date(value || today));
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const changeMonth = (offset: number) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0: Dom, 1: Lun, ...
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Align to Lun: 0
  const totalDays = new Date(year, month + 1, 0).getDate();

  const days: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    days.push(new Date(year, month, d));
  }

  const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const handleSelectDay = (date: Date) => {
    if (clearTime(date) < today) return;
    onChange(date);
  };

  const selectedClean = value ? clearTime(value) : null;
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const isPrevMonthDisabled = year <= todayYear && month <= todayMonth;

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity 
          onPress={() => !isPrevMonthDisabled && changeMonth(-1)} 
          style={[styles.monthNavBtn, isPrevMonthDisabled && { opacity: 0.35 }]}
          disabled={isPrevMonthDisabled}
        >
          <Ionicons name="chevron-back" size={20} color={colors.surface} />
        </TouchableOpacity>
        <Text style={styles.calendarMonthTitle}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavBtn}>
          <Ionicons name="chevron-forward" size={20} color={colors.surface} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDaysHeader}>
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <Text key={i} style={styles.weekDayLabel}>{d}</Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {days.map((date, index) => {
          if (!date) {
            return <View key={`empty-${index}`} style={styles.dayCellEmpty} />;
          }

          const dateClean = clearTime(date);
          const isSelected = selectedClean && dateClean.getTime() === selectedClean.getTime();
          const isToday = dateClean.getTime() === today.getTime();
          const isPast = dateClean < today;
          
          const isInRange = selectedClean && dateClean >= today && dateClean <= selectedClean;
          const isRangeStart = isToday;
          const isRangeEnd = isSelected;
          
          let bgStyle: any = null;

          if (isInRange) {
            if (isRangeStart && isRangeEnd) {
              bgStyle = styles.rangeSingle;
            } else if (isRangeStart) {
              bgStyle = styles.rangeStart;
            } else if (isRangeEnd) {
              bgStyle = styles.rangeEnd;
            } else {
              bgStyle = styles.rangeMiddle;
            }
          }

          return (
            <TouchableOpacity
              key={date.toISOString()}
              disabled={isPast}
              onPress={() => handleSelectDay(date)}
              style={styles.dayCell}
              activeOpacity={0.8}
            >
              <View style={[styles.dayCellBg, bgStyle]}>
                <View style={[
                  styles.dayTextContainer,
                  isSelected && styles.daySelected,
                  isToday && !isSelected && styles.dayToday
                ]}>
                  <Text style={[
                    styles.dayText,
                    isPast && styles.dayTextPast,
                    isSelected && styles.dayTextSelected,
                    isToday && !isSelected && styles.dayTextToday
                  ]}>
                    {date.getDate()}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      {selectedClean && (
        <View style={styles.daysDiffContainer}>
          <Text style={styles.daysDiffText}>
            {selectedClean.getTime() === today.getTime()
              ? "Vence hoy"
              : `Plazo: ${Math.round((selectedClean.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) + 1} días para realizarlo`
            }
          </Text>
        </View>
      )}
    </View>
  );
}

export default function NameIdentityStep({
  activityName,
  isFixed,
  difficulty,
  priority,
  deadline,
  onSetActivityName,
  onSetIsFixed,
  errorNombre,
  comportamiento,
  area,
  onSetArea,
  onSetComportamiento,
  onSetDifficulty,
  onSetPriority,
  onSetDeadline,
  isAnchor,
  onToggleAnchor,
  header,
  embebido,
}: NameIdentityStepProps) {
  const [hasDeadline, setHasDeadline] = useState(deadline !== null);
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);

  useEffect(() => {
    setHasDeadline(deadline !== null);
  }, [deadline]);

  const toggleHasDeadline = (value: boolean) => {
    setHasDeadline(value);
    if (value) {
      onSetDeadline(new Date());
    } else {
      onSetDeadline(null);
    }
  };

  const getDynamicIconName = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("uni") || lowerName.includes("clase") || lowerName.includes("estudiar")) {
      return "school-outline";
    }
    if (lowerName.includes("trabajo") || lowerName.includes("reunion")) {
      return "briefcase-outline";
    }
    return "document-text-outline";
  };

  const dynamicIconName = getDynamicIconName(activityName);

  return (
    <StepContainer
      embebido={embebido}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {header}
      <Text style={styles.sectionTitle}>Nombre de la actividad</Text>
      <View style={styles.inputContainer}>
        <Ionicons
          name={dynamicIconName as any}
          size={24}
          color={colors.iconPrimary}
          style={styles.inputIcon}
        />
        <TextInput
          value={activityName}
          onChangeText={onSetActivityName}
          placeholder="Ej. Seminario, Trabajo..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          style={styles.nameInput}
          returnKeyType="next"
          autoCorrect={false}
        />
      </View>

      <FieldError mensaje={errorNombre} testID="error-nombre" />

      {/* Antes aca habia tres tarjetas —Clase, Trabajo, Tarea— y elegir
          "Clase" ademas ponia la actividad en fija y le reescribia la
          prioridad y la dificultad al usuario sin avisar. Eran dos preguntas
          mezcladas en una: el CUANDO ahora lo decide el selector de
          comportamiento de abajo, y esto pregunta solo el DE QUE. */}
      <Text style={styles.sectionTitle}>¿De qué parte de tu vida es?</Text>
      <AreaSelector valor={area} onChange={onSetArea} />

      {/* Antes habia dos tarjetas, "Fijo" y "Flexible", que ademas se
          deshabilitaban si la identidad era "clase" y al tocarlas escribian
          prioridad y dificultad por su cuenta. El selector unico reemplaza a
          eso y al toggle "Anclaje de dia" que vivia mucho mas abajo diciendo
          lo contrario. */}
      <BehaviorSelector valor={comportamiento} onChange={onSetComportamiento} />

      {/* La dificultad se muestra siempre. Antes desaparecia al pasar a
          fija, justo despues de que el codigo se la hubiera reescrito:
          el usuario perdia el valor y ademas el control donde verlo. */}
      {true && (
        <>
          <Text style={styles.sectionTitle}>Dificultad de la actividad</Text>
          <View style={styles.threeColumnGrid}>
            <TouchableOpacity
              style={[
                styles.card,
                difficulty === "baja" && styles.cardSelected,
                isFixed && difficulty !== "baja" && styles.cardDisabled,
              ]}
              disabled={isFixed}
              onPress={() => onSetDifficulty("baja")}
            >
              <Ionicons
                name="leaf-outline"
                size={24}
                color={difficulty === "baja" ? colors.secondaryAccentText : colors.iconPrimary}
              />
              <Text style={[styles.cardTitle, difficulty === "baja" && styles.cardTitleSelected]}>Baja</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.card,
                difficulty === "media" && styles.cardSelected,
                isFixed && difficulty !== "media" && styles.cardDisabled,
              ]}
              disabled={isFixed}
              onPress={() => onSetDifficulty("media")}
            >
              <Ionicons
                name="speedometer-outline"
                size={24}
                color={difficulty === "media" ? colors.secondaryAccentText : colors.iconPrimary}
              />
              <Text style={[styles.cardTitle, difficulty === "media" && styles.cardTitleSelected]}>Normal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.card,
                difficulty === "alta" && styles.cardSelected,
                isFixed && difficulty !== "alta" && styles.cardDisabled,
              ]}
              disabled={isFixed}
              onPress={() => onSetDifficulty("alta")}
            >
              <Ionicons
                name="flame-outline"
                size={24}
                color={difficulty === "alta" ? colors.secondaryAccentText : colors.iconPrimary}
              />
              <Text style={[styles.cardTitle, difficulty === "alta" && styles.cardTitleSelected]}>Alta</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Prioridad de la actividad</Text>
          <Text style={styles.subtitle}>Indica la importancia para priorizar en el calendario</Text>
          <View style={styles.threeColumnGrid}>
            <TouchableOpacity
              style={[
                styles.card,
                priority === "baja" && styles.cardSelected,
                isFixed && priority !== "baja" && styles.cardDisabled,
              ]}
              disabled={isFixed}
              onPress={() => onSetPriority("baja")}
            >
              <Ionicons
                name="arrow-down-circle-outline"
                size={24}
                color={priority === "baja" ? colors.secondaryAccentText : colors.iconPrimary}
              />
              <Text style={[styles.cardTitle, priority === "baja" && styles.cardTitleSelected]}>Baja</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.card,
                priority === "media" && styles.cardSelected,
                isFixed && priority !== "media" && styles.cardDisabled,
              ]}
              disabled={isFixed}
              onPress={() => onSetPriority("media")}
            >
              <Ionicons
                name="play-circle-outline"
                size={24}
                color={priority === "media" ? colors.secondaryAccentText : colors.iconPrimary}
              />
              <Text style={[styles.cardTitle, priority === "media" && styles.cardTitleSelected]}>Media</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.card,
                priority === "alta" && styles.cardSelected,
                isFixed && priority !== "alta" && styles.cardDisabled,
              ]}
              disabled={isFixed}
              onPress={() => onSetPriority("alta")}
            >
              <Ionicons
                name="arrow-up-circle-outline"
                size={24}
                color={priority === "alta" ? colors.secondaryAccentText : colors.iconPrimary}
              />
              <Text style={[styles.cardTitle, priority === "alta" && styles.cardTitleSelected]}>Alta</Text>
            </TouchableOpacity>
          </View>

          {/* El toggle "Anclaje de dia" vivia aca, a ciento cuarenta lineas
              de la tarjeta "Fijo" que se describia como "anclado a una
              hora": dos controles con el mismo nombre significando cosas
              opuestas. Ahora es la opcion "Yo elijo el dia, tu la hora"
              del selector de arriba. */}
        </>
      )}

      <View style={styles.deadlineToggleRow}>
        <View style={styles.deadlineTextCol}>
          <Text style={styles.sectionTitleNoMargin}>¿Tiene fecha límite?</Text>
          <Text style={styles.subtitle}>Ideal para tareas con fecha de entrega estricta</Text>
        </View>
        <Switch
          value={hasDeadline}
          onValueChange={toggleHasDeadline}
          trackColor={{ false: colors.cardBorder, true: colors.secondaryAccent }}
          thumbColor={hasDeadline ? colors.surface : colors.iconPrimary}
        />
      </View>

      {hasDeadline && deadline && (
        <View style={styles.datePickerContainer}>
          <CustomCalendar value={deadline} onChange={onSetDeadline} />
        </View>
      )}
    </StepContainer>
  );
}

function createStyles(colors: ThemeColors, comfyColors: Record<string, string>, comfyFontColors: Record<string, string>) {
  return StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  sectionTitle: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitleNoMargin: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.iconPrimary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  nameInput: {
    flex: 1,
    color: colors.surface,
    fontSize: 16,
    fontWeight: "800",
    paddingVertical: 14,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  twoColumnGrid: {
    flexDirection: "row",
    gap: 14,
  },
  threeColumnGrid: {
    flexDirection: "row",
    gap: 10,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    backgroundColor: colors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 6,
  },
  cardSelected: {
    backgroundColor: colors.secondaryAccent,
    borderColor: colors.secondaryAccent,
  },
  cardDisabled: {
    opacity: 0.35,
  },
  cardTitle: {
    color: colors.iconPrimary,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  cardTitleSelected: {
    color: colors.secondaryAccentText,
  },
  cardDesc: {
    color: colors.iconPrimary,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    opacity: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: 12,
  },
  anchorToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  anchorToggleActive: {
    borderColor: comfyColors.green,
    backgroundColor: `${comfyColors.green}14`,
  },
  anchorToggleText: {
    flex: 1,
  },
  anchorToggleTitle: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "800",
  },
  anchorToggleTitleActive: {
    color: comfyColors.green,
  },
  anchorToggleSubtitle: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  deadlineToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deadlineTextCol: {
    flex: 1,
    paddingRight: 16,
  },
  datePickerContainer: {
    marginTop: 10,
  },
  calendarContainer: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.cardBorder,
    borderWidth: 2,
    borderRadius: 24,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarMonthTitle: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "800",
  },
  weekDaysHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDayLabel: {
    width: "14.28%",
    textAlign: "center",
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: "900",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
  dayCellEmpty: {
    width: "14.28%",
    height: 40,
  },
  dayCellBg: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  dayTextContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
  dayTextPast: {
    color: colors.cardBorder,
    opacity: 0.4,
  },
  daySelected: {
    backgroundColor: colors.secondaryAccent,
    borderRadius: 17,
  },
  dayTextSelected: {
    color: colors.surface,
    fontWeight: "900",
  },
  dayToday: {
    borderColor: comfyColors.green,
    borderWidth: 2,
    borderRadius: 17,
  },
  dayTextToday: {
    color: comfyColors.green,
    fontWeight: "900",
  },
  rangeMiddle: {
    backgroundColor: `${colors.secondaryAccent}2e`,
  },
  rangeStart: {
    backgroundColor: `${colors.secondaryAccent}2e`,
    borderTopLeftRadius: 17,
    borderBottomLeftRadius: 17,
  },
  rangeEnd: {
    backgroundColor: `${colors.secondaryAccent}2e`,
    borderTopRightRadius: 17,
    borderBottomRightRadius: 17,
  },
  rangeSingle: {
    backgroundColor: "transparent",
  },
  daysDiffContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  daysDiffText: {
    color: comfyColors.skyBlue,
    fontSize: 14,
    fontWeight: "800",
  },
  });
}
