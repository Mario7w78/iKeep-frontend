import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../../theme/colors";

type PriorityDeadlineStepProps = {
  priority: "baja" | "media" | "alta";
  deadline: Date | null;
  onSetPriority: (priority: "baja" | "media" | "alta") => void;
  onSetDeadline: (deadline: Date | null) => void;
};

const clearTime = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

function CustomCalendar({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  const today = clearTime(new Date());
  const [viewDate, setViewDate] = useState(new Date(value || today));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const changeMonth = (offset: number) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  // Generate days
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
    if (clearTime(date) < today) return; // Prevent selecting past days
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
          <Ionicons name="chevron-back" size={20} color={Theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.calendarMonthTitle}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthNavBtn}>
          <Ionicons name="chevron-forward" size={20} color={Theme.colors.surface} />
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
          
          // Check if in range between today and deadline
          const isInRange = selectedClean && dateClean >= today && dateClean <= selectedClean;

          // Determine cell styles for range
          const isRangeStart = isToday;
          const isRangeEnd = isSelected;
          
          let cellStyle: any[] = [styles.dayCell];
          let bgStyle: any = null;

          if (isInRange) {
            if (isRangeStart && isRangeEnd) {
              // Only one day selected (today)
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
              style={cellStyle}
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

export default function PriorityDeadlineStep({
  priority,
  deadline,
  onSetPriority,
  onSetDeadline,
}: PriorityDeadlineStepProps) {
  const [hasDeadline, setHasDeadline] = useState(deadline !== null);

  const toggleHasDeadline = (value: boolean) => {
    setHasDeadline(value);
    if (value) {
      onSetDeadline(new Date());
    } else {
      onSetDeadline(null);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionTitle}>Prioridad de la actividad</Text>
      <Text style={styles.subtitle}>Indica la importancia para priorizar en el calendario</Text>
      <View style={styles.threeColumnGrid}>
        <TouchableOpacity
          style={[styles.card, priority === "baja" && styles.cardSelected]}
          onPress={() => onSetPriority("baja")}
        >
          <Ionicons
            name="arrow-down-circle-outline"
            size={24}
            color={priority === "baja" ? Theme.colors.surface : Theme.colors.iconPrimary}
          />
          <Text style={[styles.cardTitle, priority === "baja" && styles.cardTitleSelected]}>Baja</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, priority === "media" && styles.cardSelected]}
          onPress={() => onSetPriority("media")}
        >
          <Ionicons
            name="play-circle-outline"
            size={24}
            color={priority === "media" ? Theme.colors.surface : Theme.colors.iconPrimary}
          />
          <Text style={[styles.cardTitle, priority === "media" && styles.cardTitleSelected]}>Media</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, priority === "alta" && styles.cardSelected]}
          onPress={() => onSetPriority("alta")}
        >
          <Ionicons
            name="arrow-up-circle-outline"
            size={24}
            color={priority === "alta" ? Theme.colors.surface : Theme.colors.iconPrimary}
          />
          <Text style={[styles.cardTitle, priority === "alta" && styles.cardTitleSelected]}>Alta</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.deadlineToggleRow}>
        <View style={styles.deadlineTextCol}>
          <Text style={styles.sectionTitleNoMargin}>¿Tiene fecha límite?</Text>
          <Text style={styles.subtitle}>Ideal para tareas con fecha de entrega estricta</Text>
        </View>
        <Switch
          value={hasDeadline}
          onValueChange={toggleHasDeadline}
          trackColor={{ false: Theme.colors.cardBorder, true: "#5665dc" }}
          thumbColor={hasDeadline ? Theme.colors.surface : Theme.colors.iconPrimary}
        />
      </View>

      {hasDeadline && deadline && (
        <View style={styles.datePickerContainer}>
          <CustomCalendar value={deadline} onChange={onSetDeadline} />
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
  sectionTitle: {
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 8,
    marginBottom: 2,
  },
  sectionTitleNoMargin: {
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "900",
  },
  subtitle: {
    color: Theme.colors.iconPrimary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  threeColumnGrid: {
    flexDirection: "row",
    gap: 10,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 8,
  },
  cardSelected: {
    backgroundColor: "#5665dc",
    borderColor: "#8dccff",
  },
  cardTitle: {
    color: Theme.colors.iconPrimary,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  cardTitleSelected: {
    color: Theme.colors.surface,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.cardBorder,
    marginVertical: 12,
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
    backgroundColor: Theme.colors.cardBackground,
    borderColor: Theme.colors.cardBorder,
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
    color: Theme.colors.surface,
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
    color: Theme.colors.textTertiary,
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
    color: Theme.colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
  dayTextPast: {
    color: Theme.colors.cardBorder,
    opacity: 0.4,
  },
  daySelected: {
    backgroundColor: "#5665dc",
    borderRadius: 17,
  },
  dayTextSelected: {
    color: Theme.colors.surface,
    fontWeight: "900",
  },
  dayToday: {
    borderColor: Theme.comfyColors.green,
    borderWidth: 2,
    borderRadius: 17,
  },
  dayTextToday: {
    color: Theme.comfyColors.green,
    fontWeight: "900",
  },
  rangeMiddle: {
    backgroundColor: "rgba(86, 101, 220, 0.18)",
  },
  rangeStart: {
    backgroundColor: "rgba(86, 101, 220, 0.18)",
    borderTopLeftRadius: 17,
    borderBottomLeftRadius: 17,
  },
  rangeEnd: {
    backgroundColor: "rgba(86, 101, 220, 0.18)",
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
    color: Theme.comfyColors.skyBlue,
    fontSize: 14,
    fontWeight: "800",
  },
});
