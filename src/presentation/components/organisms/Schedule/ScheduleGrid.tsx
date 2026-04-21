import { useRef, useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { ScheduledActivity } from '../../../../domain/entities/Schedule';
import { HourRow } from '../../molecules/Schedule/HourRow';
import { ActivityBlock } from '../../molecules/Schedule/ActivityBlock';
import { NowIndicator } from '../../atoms/Schedule/NowIndicator';
import { START_HOUR, END_HOUR, HOUR_HEIGHT, minutesToTop } from '../../../utils/scheduleUtils';

const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

export function ScheduleGrid({ activities }: { activities: ScheduledActivity[] }) {
  const ref = useRef<ScrollView>(null);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowTop = minutesToTop(nowMin);
  const showNow = nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60;

  useEffect(() => {
    setTimeout(() => ref.current?.scrollTo({ y: Math.max(0, nowTop - 120), animated: true }), 400);
  }, []);

  return (
    <ScrollView ref={ref} showsVerticalScrollIndicator={false}>
      <View style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT, position: 'relative', marginVertical: 10 }}>
        {HOURS.map(h => <HourRow key={h} hour={h} />)}
        {activities.map((act) => (
          <ActivityBlock 
            key={`${act.activity.id}-${act.day}-${act.assignedStartTime}`} 
            item={act} 
          />
        ))}
        {showNow && <NowIndicator top={nowTop} />}
      </View>
    </ScrollView>
  );
}
