// utils/calendarUtils.ts
import { DayOfWeek } from '../../domain/entities/Activity';

export const HOUR_HEIGHT = 56;
export const START_HOUR = 0;
export const END_HOUR = 24;
export const LABEL_WIDTH = 48;

export const JS_DAY_TO_DAYOFWEEK: Record<number, DayOfWeek> = {
  0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miercoles',
  4: 'Jueves',  5: 'Viernes', 6: 'Sabado',
};

export const DAYOFWEEK_TO_JS_DAY: Record<DayOfWeek, number> = {
  Domingo: 0, Lunes: 1, Martes: 2, Miercoles: 3, Jueves: 4, Viernes: 5, Sabado: 6,
};

// Convención Expo/Apple (UNCalendarNotificationTrigger / WeeklyTriggerInput): 1=Domingo...7=Sábado
export function dayOfWeekToExpoWeekday(day: DayOfWeek): number {
  return DAYOFWEEK_TO_JS_DAY[day] + 1;
}

export const DAYS_ORDER: DayOfWeek[] = [
  'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'
];

export const DAYS_SHORT: Record<DayOfWeek | 'Diario', string> = {
  'Diario': 'Di', 'Lunes': 'Lu', 'Martes': 'Ma', 'Miercoles': 'Mi',
  'Jueves': 'Ju', 'Viernes': 'Vi', 'Sabado': 'Sá', 'Domingo': 'Do',
};

export function minutesToTop(minutes: number): number {
  return ((minutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
}

export function hhmmToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function durationToHeight(startMin: number, endMin: number, hourHeight: number = HOUR_HEIGHT, minHeight: number = 30): number {
  return Math.max(((endMin - startMin) / 60) * hourHeight, minHeight);
}

export function formatDisplayTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h12}:${m < 10 ? '0' + m : m} ${ampm}`;
}

export function formatHour(h: number): string {
  const wrapped = h % 24;
  return `${wrapped.toString().padStart(2, '0')}:00`;
}
