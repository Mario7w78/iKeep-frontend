import { useState, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { ScheduledActivity } from '../../../../domain/entities/Schedule';
import { HourRow } from '../../molecules/Schedule/HourRow';
import { ActivityBlock } from '../../molecules/Schedule/ActivityBlock';
import { NowIndicator } from '../../atoms/Schedule/NowIndicator';
import { HOUR_HEIGHT } from '../../../utils/scheduleUtils';

export function ScheduleGrid({ 
  activities, 
  isToday, 
  onActivityPress,
  startHour = 0,
  endHour = 1440,
}: { 
  activities: ScheduledActivity[]; 
  isToday: boolean; 
  onActivityPress?: (item: ScheduledActivity) => void;
  startHour?: number;
  endHour?: number;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const crossing = endHour <= startHour;
  const displayStart = Math.floor(startHour / 60);
  const displayEnd = Math.ceil((crossing ? endHour + 1440 : endHour) / 60);
  const hourCount = displayEnd - displayStart;
  const contentHeight = hourCount * HOUR_HEIGHT;

  const normEndHour = crossing ? endHour + 1440 : endHour;
  let normNowMin = nowMin;
  if (crossing && nowMin < startHour) {
    normNowMin += 1440;
  }
  const showNow = isToday && normNowMin >= startHour && normNowMin <= normEndHour;
  const nowTop = ((normNowMin - startHour) / 60) * HOUR_HEIGHT;

  const HOURS = Array.from({ length: hourCount + 1 }, (_, i) => displayStart + i);

  // Auto-scroll to current time on mount if today
  useEffect(() => {
    if (showNow && scrollRef.current) {
      const scrollTarget = Math.max(0, nowTop - 100);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: scrollTarget, animated: true });
      }, 300);
    }
  }, [showNow, nowTop]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      <View style={{ height: contentHeight, position: 'relative' }}>
        {HOURS.map(h => (
          <HourRow key={h} hour={h} displayStart={displayStart} hourHeight={HOUR_HEIGHT} />
        ))}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          {activities.map((act, idx) => (
            <ActivityBlock
              cruzaMedianoche={crossing}
              key={`${act.activity?.id ?? act.tipo ?? 'unknown'}-${act.day}-${act.assignedStartTime}-${idx}`} 
              item={act}
              displayStart={displayStart}
              hourHeight={HOUR_HEIGHT}
              onPress={onActivityPress}
            />
          ))}
        </View>
        {showNow && <NowIndicator top={nowTop} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
