export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface ScheduleWeeklyNotificationInput {
  identifier: string;
  title: string;
  body?: string;
  weekday: number; // convención Expo/Apple: 1=Domingo ... 7=Sábado
  hour: number;
  minute: number;
}

export interface NotificationScheduler {
  requestPermissions(): Promise<NotificationPermissionStatus>;
  getPermissionStatus(): Promise<NotificationPermissionStatus>;
  cancelAll(): Promise<void>;
  scheduleWeekly(input: ScheduleWeeklyNotificationInput): Promise<string>;
}
