import { Activity, ActivityType } from '../../../domain/entities/Activity';
import { ScheduledActivity } from '../../../domain/entities/Schedule';
import { selectNotifiableOccurrences } from '../ActivityNotificationSync';

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
