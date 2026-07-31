import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  NotificationPermissionStatus,
  NotificationScheduler,
  ScheduleWeeklyNotificationInput,
} from '../../application/ports/out/NotificationScheduler';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'Recordatorios de actividades',
    importance: Notifications.AndroidImportance.DEFAULT,
  }).catch((e) => console.error('Error creando canal de notificaciones:', e));
}

function toPermissionStatus(status: Notifications.PermissionStatus): NotificationPermissionStatus {
  switch (status) {
    case Notifications.PermissionStatus.GRANTED:
      return 'granted';
    case Notifications.PermissionStatus.DENIED:
      return 'denied';
    default:
      return 'undetermined';
  }
}

export class ExpoNotificationScheduler implements NotificationScheduler {
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    const current = await Notifications.getPermissionsAsync();
    return toPermissionStatus(current.status);
  }

  async requestPermissions(): Promise<NotificationPermissionStatus> {
    const current = await Notifications.getPermissionsAsync();
    if (current.status !== Notifications.PermissionStatus.UNDETERMINED) {
      return toPermissionStatus(current.status);
    }
    const requested = await Notifications.requestPermissionsAsync();
    return toPermissionStatus(requested.status);
  }

  async cancelAll(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async scheduleWeekly(input: ScheduleWeeklyNotificationInput): Promise<string> {
    return Notifications.scheduleNotificationAsync({
      identifier: input.identifier,
      content: {
        title: input.title,
        body: input.body,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: input.weekday,
        hour: input.hour,
        minute: input.minute,
      },
    });
  }
}
