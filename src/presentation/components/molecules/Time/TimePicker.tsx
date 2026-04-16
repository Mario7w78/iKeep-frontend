import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Theme } from '../../theme/colors';

const ITEM_HEIGHT = 35;

const HOURS = Array.from({ length: 12 }, (_, i) => {
  const h = i + 1;
  return h < 10 ? `0${h}` : `${h}`;
});
const MINUTES = Array.from({ length: 60 }, (_, i) => (i < 10 ? `0${i}` : `${i}`));
const PERIODS = ['AM', 'PM'];

// PickerColumn sin cambios — reutilizable tal cual
interface PickerColumnProps {
  data: string[];
  initialIndex: number;
  onValueChange: (val: string) => void;
}

const PickerColumn: React.FC<PickerColumnProps> = ({ data, initialIndex, onValueChange }) => {
  const scrollY = useRef(new Animated.Value(initialIndex * ITEM_HEIGHT)).current;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const onValueChangeRef = useRef(onValueChange);
  useEffect(() => { onValueChangeRef.current = onValueChange; }, [onValueChange]);

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const index = Math.round(value / ITEM_HEIGHT);
      if (index !== currentIndex && index >= 0 && index < data.length) {
        setCurrentIndex(index);
        Haptics.selectionAsync().catch(() => {});
        onValueChangeRef.current(data[index]);
      }
    });
    return () => scrollY.removeListener(listenerId);
  }, [currentIndex, data]);

  return (
    <View style={styles.columnContainer}>
      <Animated.ScrollView
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        contentOffset={{ x: 0, y: initialIndex * ITEM_HEIGHT }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {data.map((item, index) => {
          const inputRange = [
            (index - 2) * ITEM_HEIGHT,
            index * ITEM_HEIGHT,
            (index + 2) * ITEM_HEIGHT,
          ];
          const rotateX = scrollY.interpolate({ inputRange, outputRange: ['60deg', '0deg', '-60deg'], extrapolate: 'clamp' });
          const scale = scrollY.interpolate({ inputRange, outputRange: [0.8, 1.1, 0.8], extrapolate: 'clamp' });
          const opacity = scrollY.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });

          return (
            <Animated.View
              key={item}
              style={[styles.item, { transform: [{ perspective: 1000 }, { rotateX }, { scale }], opacity }]}
            >
              <Text style={[styles.text, { color: currentIndex === index ? Theme.colors.surface : Theme.colors.veryLightPrimary }]}>
                {item}
              </Text>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
};

interface TimePickerProps {
  onTimeChange?: (hour: string, minute: string, period: string, id?: string) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ onTimeChange }) => {
  const now = new Date();
  const initialHour12 = now.getHours() % 12 || 12; 
  const initialPeriod = now.getHours() < 12 ? 0 : 1; 

  const selectedHourRef = useRef(HOURS[initialHour12 - 1]);
  const selectedMinuteRef = useRef(MINUTES[now.getMinutes()]);
  const selectedPeriodRef = useRef(PERIODS[initialPeriod]);
  const onTimeChangeRef = useRef(onTimeChange);

  useEffect(() => { onTimeChangeRef.current = onTimeChange; }, [onTimeChange]);

  const notify = () => {
    onTimeChangeRef.current?.(
      selectedHourRef.current,
      selectedMinuteRef.current,
      selectedPeriodRef.current,
    );
  };

  const handleHourChange = (hour: string) => { selectedHourRef.current = hour; notify(); };
  const handleMinuteChange = (minute: string) => { selectedMinuteRef.current = minute; notify(); };
  const handlePeriodChange = (period: string) => { selectedPeriodRef.current = period; notify(); };

  return (
    <View style={styles.container}>
      <View style={styles.indicator} />
      <PickerColumn data={HOURS}   initialIndex={initialHour12 - 1} onValueChange={handleHourChange} />
      <Text style={styles.separator}>:</Text>
      <PickerColumn data={MINUTES} initialIndex={now.getMinutes()}  onValueChange={handleMinuteChange} />
      <View style={styles.periodSpacer} />
      <PickerColumn data={PERIODS} initialIndex={initialPeriod}     onValueChange={handlePeriodChange} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT * 5,
    width: 240,           // un poco más ancho para AM/PM
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  columnContainer: { flex: 1 },
  item: { height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 24, fontWeight: '600' },
  separator: { fontSize: 24, fontWeight: 'bold', color: Theme.colors.surface, paddingBottom: 4 },
  periodSpacer: { width: 8 },
  indicator: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
    width: '100%',
    backgroundColor: Theme.colors.lightPrimary,
    borderRadius: 10,
  },
});

export default TimePicker;