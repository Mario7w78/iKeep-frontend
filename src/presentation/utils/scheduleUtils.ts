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

export const DAYS_ORDER: DayOfWeek[] = [
  'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'
];

export const DAYS_SHORT: Record<DayOfWeek, string> = {
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

export function durationToHeight(startMin: number, endMin: number): number {
  return Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT - 4, 28);
}

export function formatDisplayTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h12}:${m < 10 ? '0' + m : m} ${ampm}`;
}

export function formatHour(h: number): string {
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}${h < 12 ? 'AM' : 'PM'}`;
}