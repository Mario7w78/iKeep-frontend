import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DaySelector } from '../../molecules/Schedule/DaySelector';
import { DayOfWeek } from '../../../../domain/entities/Activity';
import { Theme } from '../../theme/colors';

interface Props {
  selectedDay: DayOfWeek;
  activityCount: number;
  onSelectDay: (day: DayOfWeek) => void;
  onRefresh?: () => void;
  viewMode: 'grid' | 'list';
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
  const navigation = useNavigation<any>();
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
          <TouchableOpacity style={s.chatBtn} onPress={() => navigation.navigate("AIChatView")} hitSlop={12}>
            <Ionicons name="chatbubbles-outline" size={24} color={Theme.comfyColors.green} />
          </TouchableOpacity>
          <TouchableOpacity style={s.toggleBtn} onPress={onToggleViewMode} hitSlop={12}>
            <Ionicons name={viewMode === 'grid' ? 'list-outline' : 'calendar-outline'} size={24} color={Theme.comfyColors.green} />
          </TouchableOpacity>
          {onRefresh && (
            <TouchableOpacity style={s.refreshBtn} onPress={onRefresh} hitSlop={12}>
              <Ionicons name="refresh" size={24} color={Theme.comfyColors.green} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <DaySelector selectedDay={selectedDay} onSelectDay={onSelectDay} />
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: '#1F212C',
    paddingTop: 52,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(21, 93, 252, 0.2)', // Glowing blue bottom border
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
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a8a9bb',
  },
  activityCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityCountText: {
    fontSize: 14,
    color: '#98FF60', // Comfy green
    fontWeight: '800',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
});