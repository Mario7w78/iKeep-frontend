export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface ScheduleWeeklyNotificationInput {
  identifier: string;
  title: string;
  body?: string;
  weekday: number; // convención Expo/Apple: 1=Domingo ... 7=Sábado
  hour: number;
  minute: number;
}

export interface ScheduleDailyNotificationInput {
  identifier: string;
  title: string;
  body?: string;
  hour: number;
  minute: number;
}

export interface NotificationScheduler {
  /** Todos los días a la misma hora. Reprogramar con el mismo id reemplaza. */
  scheduleDaily(input: ScheduleDailyNotificationInput): Promise<string>;
  cancel(identifier: string): Promise<void>;
  requestPermissions(): Promise<NotificationPermissionStatus>;
  getPermissionStatus(): Promise<NotificationPermissionStatus>;
  cancelAll(): Promise<void>;
  scheduleWeekly(input: ScheduleWeeklyNotificationInput): Promise<string>;
}
