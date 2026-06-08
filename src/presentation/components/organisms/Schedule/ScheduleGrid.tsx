import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ScheduledActivity } from '../../../../domain/entities/Schedule';
import { HourRow } from '../../molecules/Schedule/HourRow';
import { ActivityBlock } from '../../molecules/Schedule/ActivityBlock';
import { NowIndicator } from '../../atoms/Schedule/NowIndicator';
import { minutesToTop } from '../../../utils/scheduleUtils';

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
  const [height, setHeight] = useState(0);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const displayStart = Math.floor(startHour / 60);
  const displayEnd = Math.ceil(endHour / 60);
  const hourCount = displayEnd - displayStart;
  const hourHeight = height > 0 ? height / hourCount : 50;

  const showNow = isToday && nowMin >= startHour && nowMin <= endHour;
  const nowTop = ((nowMin - startHour) / 60) * hourHeight;

  const HOURS = Array.from({ length: hourCount + 1 }, (_, i) => displayStart + i);

  return (
    <View
      style={styles.container}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      {height > 0 && (
        <View style={{ height, position: 'relative' }}>
          {HOURS.map(h => (
            <HourRow key={h} hour={h} displayStart={displayStart} hourHeight={hourHeight} />
          ))}
          <View style={StyleSheet.absoluteFillObject}>
            {activities.map((act) => (
              <ActivityBlock 
                key={`${act.activity?.id ?? act.tipo ?? 'unknown'}-${act.day}-${act.assignedStartTime}`} 
                item={act}
                displayStart={displayStart}
                hourHeight={hourHeight}
                onPress={onActivityPress}
              />
            ))}
          </View>
          {showNow && <NowIndicator top={nowTop} />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
