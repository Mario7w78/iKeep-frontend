import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DaySelector } from '../../molecules/Schedule/DaySelector';
import { DayOfWeek } from '../../../../domain/entities/Activity';
import { useTheme, ThemeColors } from '../../theme/colors';

interface Props {
  selectedDay: DayOfWeek;
  activityCount: number;
  onSelectDay: (day: DayOfWeek) => void;
  onRefresh?: () => void;
  viewMode: 'grid' | 'list' | 'mes';
  onToggleViewMode: () => void;
}

const getFormattedDateForDay = (day: DayOfWeek) => {
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0: Dom, 1: Lun, ...
  
  const daysOrder = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  const targetIndex = daysOrder.indexOf(day);
  
  const diff = targetIndex - currentDayOfWeek;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + diff);

  return targetDate.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long"
  });
};

export function ScheduleHeader({ selectedDay, activityCount, onSelectDay, onRefresh, viewMode, onToggleViewMode }: Props) {
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const s = useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors, comfyColors, comfyFontColors]);
  const dateText = getFormattedDateForDay(selectedDay);

  return (
    <View style={s.header}>
      <View style={s.titleRow}>
        <View style={s.titleBlock}>
          <Text style={s.title}>
            {selectedDay.toUpperCase()}
            <Text style={s.dateText}> · {dateText}</Text>
          </Text>
          <View style={s.activityCountRow}>
            <Text style={s.activityCountText}>
              {activityCount} {activityCount === 1 ? 'actividad' : 'actividades'}
            </Text>
          </View>
        </View>
        <View style={s.actionButtons}>
          <TouchableOpacity style={s.toggleBtn} onPress={onToggleViewMode} hitSlop={12}>
            {/* El icono muestra a donde vas, no donde estas: es lo que
                hace el ciclo predecible. */}
            <Ionicons
              name={
                viewMode === 'grid' ? 'list-outline'
                : viewMode === 'list' ? 'calendar-outline'
                : 'grid-outline'
              }
              size={24}
              color={comfyColors.green}
            />
          </TouchableOpacity>
          {onRefresh && (
            <TouchableOpacity style={s.refreshBtn} onPress={onRefresh} hitSlop={12}>
              <Ionicons name="refresh" size={24} color={comfyColors.green} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <DaySelector selectedDay={selectedDay} onSelectDay={onSelectDay} />
    </View>
  );
}

function createStyles(colors: ThemeColors, comfyColors: Record<string, string>, _comfyFontColors: Record<string, string>) {
  return StyleSheet.create({
    header: {
      backgroundColor: colors.cardBackground,
      paddingTop: 52,
      paddingBottom: 12,
      borderBottomWidth: 1.5,
      borderBottomColor: colors.cardBorder,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingRight: 20,
      marginBottom: 12,
    },
    titleBlock: {
      paddingHorizontal: 20,
      gap: 4,
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.surface,
      letterSpacing: -0.5,
    },
    dateText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    activityCountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    activityCountText: {
      fontSize: 14,
      color: comfyColors.green,
      fontWeight: '800',
    },
    refreshBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      justifyContent: 'center',
      alignItems: 'center',
    },
    actionButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    toggleBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
}