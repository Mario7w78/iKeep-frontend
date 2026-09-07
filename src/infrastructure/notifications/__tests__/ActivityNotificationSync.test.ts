import { Activity, ActivityType } from '../../../domain/entities/Activity';
import { ScheduledActivity, Schedule } from '../../../domain/entities/Schedule';
import { selectNotifiableOccurrences, syncActivityNotifications } from '../ActivityNotificationSync';
import {
  NotificationPermissionStatus,
  NotificationScheduler,
  ScheduleDailyNotificationInput,
  ScheduleWeeklyNotificationInput,
} from '../../../application/ports/out/NotificationScheduler';

function makeActivity(overrides: Partial<{ id: string; priority: number; isAnchor: boolean; title: string }> = {}): Activity {
  return new Activity({
    id: overrides.id ?? 'act-1',
    title: overrides.title ?? 'Actividad',
    type: ActivityType.FLEXIBLE,
    identity: 'tarea',
    priority: overrides.priority ?? 0,
    difficulty: 'media',
    deadline: null,
    daysConfig: {},
    daysEnabled: [],
    isAnchor: overrides.isAnchor ?? false,
  });
}

function makeItem(overrides: Partial<ScheduledActivity> & { activity?: Activity | undefined } = {}): ScheduledActivity {
  return {
    activity: overrides.activity,
    assignedStartTime: overrides.assignedStartTime ?? '08:00',
    assignedEndTime: overrides.assignedEndTime ?? '09:00',
    day: overrides.day ?? 'Lunes',
    tipo: overrides.tipo,
    nombre: overrides.nombre,
  };
}

describe('selectNotifiableOccurrences', () => {
  it('excludes items without a linked activity (travel/transit blocks)', () => {
    const withActivity = makeItem({ activity: makeActivity({ id: 'a1' }) });
    const travelBlock = makeItem({ activity: undefined, nombre: 'Viaje a ITLAB' });

    const { included, truncatedCount } = selectNotifiableOccurrences([withActivity, travelBlock]);

    expect(included).toEqual([withActivity]);
    expect(truncatedCount).toBe(0);
  });

  it('sorts anchors first, then by priority descending', () => {
    const lowPriority = makeItem({ activity: makeActivity({ id: 'low', priority: 1 }) });
    const highPriority = makeItem({ activity: makeActivity({ id: 'high', priority: 5 }) });
    const anchor = makeItem({ activity: makeActivity({ id: 'anchor', priority: 0, isAnchor: true }) });

    const { included } = selectNotifiableOccurrences([lowPriority, highPriority, anchor]);

    expect(included.map((i) => i.activity!.id)).toEqual(['anchor', 'high', 'low']);
  });

  it('caps the result and reports how many were truncated', () => {
    const items = Array.from({ length: 5 }, (_, i) =>
      makeItem({ activity: makeActivity({ id: `a${i}`, priority: i }) })
    );

    const { included, truncatedCount } = selectNotifiableOccurrences(items, 3);

    expect(included).toHaveLength(3);
    expect(truncatedCount).toBe(2);
    // Highest priority (4, 3, 2) should survive the cap over lower ones (1, 0)
    expect(included.map((i) => i.activity!.id)).toEqual(['a4', 'a3', 'a2']);
  });

  it('returns no truncation for empty input', () => {
    const { included, truncatedCount } = selectNotifiableOccurrences([]);
    expect(included).toEqual([]);
    expect(truncatedCount).toBe(0);
  });
});

class FakeScheduler implements NotificationScheduler {
  weekly: ScheduleWeeklyNotificationInput[] = [];
  permission: NotificationPermissionStatus = 'granted';

  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    return this.permission;
  }
  async requestPermissions(): Promise<NotificationPermissionStatus> {
    return 'granted';
  }
  async scheduleDaily(input: ScheduleDailyNotificationInput): Promise<string> {
    return input.identifier;
  }
  async scheduleWeekly(input: ScheduleWeeklyNotificationInput): Promise<string> {
    this.weekly.push(input);
    return input.identifier;
  }
  async cancel(_identifier: string): Promise<void> {}
  async cancelAll(): Promise<void> {}
}

function makeSchedule(items: ScheduledActivity[]): Schedule {
  return new Schedule({
    id: 'schedule-1',
    userId: 'user-1',
    createdAt: new Date(),
    scheduledActivities: items,
  });
}

describe('syncActivityNotifications', () => {
  it('programa aviso 10 minutos antes y a la hora exacta para cada actividad', async () => {
    const scheduler = new FakeScheduler();
    const schedule = makeSchedule([
      makeItem({ activity: makeActivity({ id: 'a1', title: 'Estudiar' }) }),
    ]);

    await syncActivityNotifications(schedule, scheduler);

    expect(scheduler.weekly).toHaveLength(2);
    const [previo, inicio] = scheduler.weekly;

    expect(previo).toMatchObject({
      identifier: 'schedule:a1:Lunes:08:00:previo',
      title: 'Estudiar',
      body: 'Empieza en 10 minutos',
      weekday: 2, // Lunes → JS 1 → Expo 2
      hour: 7,
      minute: 50,
    });

    expect(inicio).toMatchObject({
      identifier: 'schedule:a1:Lunes:08:00:inicio',
      title: 'Estudiar',
      body: 'Empieza ahora',
      weekday: 2,
      hour: 8,
      minute: 0,
    });
  });

  it('ajusta el aviso previo cruzando hacia atras dentro del mismo dia', async () => {
    const scheduler = new FakeScheduler();
    const schedule = makeSchedule([
      makeItem({ activity: makeActivity({ id: 'a1' }), assignedStartTime: '00:30' }),
    ]);

    await syncActivityNotifications(schedule, scheduler);

    expect(scheduler.weekly).toHaveLength(2);
    expect(scheduler.weekly[0]).toMatchObject({ hour: 0, minute: 20 });
  });

  it('omite el aviso previo si cruza al dia anterior (inicio 00:00-00:09)', async () => {
    const scheduler = new FakeScheduler();
    const schedule = makeSchedule([
      makeItem({ activity: makeActivity({ id: 'a1' }), assignedStartTime: '00:05' }),
    ]);

    await syncActivityNotifications(schedule, scheduler);

    expect(scheduler.weekly).toHaveLength(1);
    expect(scheduler.weekly[0].identifier).toBe('schedule:a1:Lunes:00:05:inicio');
    expect(scheduler.weekly[0].body).toBe('Empieza ahora');
  });

  it('no programa nada sin permisos', async () => {
    const scheduler = new FakeScheduler();
    scheduler.permission = 'denied';
    const schedule = makeSchedule([
      makeItem({ activity: makeActivity({ id: 'a1' }) }),
    ]);

    await syncActivityNotifications(schedule, scheduler);

    expect(scheduler.weekly).toHaveLength(0);
  });
});
