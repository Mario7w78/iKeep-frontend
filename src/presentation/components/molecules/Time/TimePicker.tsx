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

interface PickerColumnProps {
  data: string[];
  selectedIndex: number;
  onValueChange: (val: string) => void;
}

const PickerColumn: React.FC<PickerColumnProps> = ({ data, selectedIndex, onValueChange }) => {
  const scrollY = useRef(new Animated.Value(selectedIndex * ITEM_HEIGHT)).current;
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const scrollViewRef = useRef<any>(null);
  const isProgrammatic = useRef(false);

  const onValueChangeRef = useRef(onValueChange);
  useEffect(() => { onValueChangeRef.current = onValueChange; }, [onValueChange]);

  useEffect(() => {
    if (selectedIndex !== currentIndex && scrollViewRef.current) {
      isProgrammatic.current = true;
      scrollViewRef.current.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: true });
      setCurrentIndex(selectedIndex);
      
      // Reset programmatic flag after animation finishes
      setTimeout(() => {
        isProgrammatic.current = false;
      }, 500);
    }
  }, [selectedIndex]);

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const index = Math.round(value / ITEM_HEIGHT);
      if (index !== currentIndex && index >= 0 && index < data.length) {
        if (!isProgrammatic.current) {
          setCurrentIndex(index);
          Haptics.selectionAsync().catch(() => {});
          onValueChangeRef.current(data[index]);
        }
      }
    });
    return () => scrollY.removeListener(listenerId);
  }, [currentIndex, data, scrollY]);

  return (
    <View style={styles.columnContainer}>
      <Animated.ScrollView
        ref={scrollViewRef}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
        contentOffset={{ x: 0, y: selectedIndex * ITEM_HEIGHT }}
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
  time?: Date;
  flashTrigger?: number;
}

const TimePicker: React.FC<TimePickerProps> = ({ onTimeChange, time, flashTrigger }) => {
  const defaultTime = time || new Date();
  
  const hour12 = defaultTime.getHours() % 12 || 12; 
  const period = defaultTime.getHours() < 12 ? 0 : 1; 
  const minute = defaultTime.getMinutes();

  const selectedHourIndex = hour12 - 1;
  const selectedMinuteIndex = minute;
  const selectedPeriodIndex = period;

  const selectedHourRef = useRef(HOURS[selectedHourIndex]);
  const selectedMinuteRef = useRef(MINUTES[selectedMinuteIndex]);
  const selectedPeriodRef = useRef(PERIODS[selectedPeriodIndex]);
  const onTimeChangeRef = useRef(onTimeChange);

  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (flashTrigger && flashTrigger > 0) {
      flashAnim.setValue(0);
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [flashTrigger]);

  useEffect(() => { onTimeChangeRef.current = onTimeChange; }, [onTimeChange]);

  const notify = () => {
    onTimeChangeRef.current?.(
      selectedHourRef.current,
      selectedMinuteRef.current,
      selectedPeriodRef.current,
    );
  };

  const handleHourChange = (hour: string) => { selectedHourRef.current = hour; notify(); };
  const handleMinuteChange = (min: string) => { selectedMinuteRef.current = min; notify(); };
  const handlePeriodChange = (per: string) => { selectedPeriodRef.current = per; notify(); };

  const flashBackgroundColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', 'rgba(255, 255, 255, 0.15)']
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor: flashBackgroundColor, borderRadius: 10 }]}>
      <View style={styles.indicator} />
      <PickerColumn data={HOURS}   selectedIndex={selectedHourIndex} onValueChange={handleHourChange} />
      <Text style={styles.separator}>:</Text>
      <PickerColumn data={MINUTES} selectedIndex={selectedMinuteIndex}  onValueChange={handleMinuteChange} />
      <View style={styles.periodSpacer} />
      <PickerColumn data={PERIODS} selectedIndex={selectedPeriodIndex}     onValueChange={handlePeriodChange} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT * 5,
    width: 240,
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