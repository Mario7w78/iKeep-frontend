import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

const ITEM_HEIGHT = 45;

const HOURS = Array.from({ length: 24 }, (_, i) => (i < 10 ? `0${i}` : `${i}`));
const MINUTES = Array.from({ length: 60 }, (_, i) => (i < 10 ? `0${i}` : `${i}`));

interface PickerColumnProps {
  data: string[];
  initialIndex: number;
  onValueChange: (val: string) => void;
}

const PickerColumn: React.FC<PickerColumnProps> = ({ data, initialIndex, onValueChange }) => {
  const scrollY = useRef(new Animated.Value(initialIndex * ITEM_HEIGHT)).current;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  // Guardamos la función en un ref para que no cause bucles al cambiar
  const onValueChangeRef = useRef(onValueChange);
  useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  useEffect(() => {
    const listenerId = scrollY.addListener(({ value }) => {
      const index = Math.round(value / ITEM_HEIGHT);
      if (index !== currentIndex && index >= 0 && index < data.length) {
        setCurrentIndex(index);
        Haptics.selectionAsync().catch(() => {});
        // Usamos el ref aquí para evitar dependencias circulares
        onValueChangeRef.current(data[index]);
      }
    });
    return () => scrollY.removeListener(listenerId);
  }, [currentIndex, data]); // Eliminamos onValueChange de las dependencias

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

          const rotateX = scrollY.interpolate({
            inputRange,
            outputRange: ['60deg', '0deg', '-60deg'],
            extrapolate: 'clamp',
          });

          const scale = scrollY.interpolate({
            inputRange,
            outputRange: [0.8, 1.1, 0.8],
            extrapolate: 'clamp',
          });

          const opacity = scrollY.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={item}
              style={[
                styles.item,
                { transform: [{ perspective: 1000 }, { rotateX }, { scale }], opacity },
              ]}
            >
              <Text style={[styles.text, { color: currentIndex === index ? '#000' : '#999' }]}>
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
  onTimeChange?: (hour: string, minute: string) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ onTimeChange }) => {
  const now = new Date();
  
  // Usamos refs en lugar de estados para que el picker padre no se re-renderice a lo tonto
  const selectedHourRef = useRef(HOURS[now.getHours()]);
  const selectedMinuteRef = useRef(MINUTES[now.getMinutes()]);
  const onTimeChangeRef = useRef(onTimeChange);

  // Mantenemos la función actualizada si el padre la cambia
  useEffect(() => {
    onTimeChangeRef.current = onTimeChange;
  }, [onTimeChange]);

  const handleHourChange = (hour: string) => {
    selectedHourRef.current = hour;
    if (onTimeChangeRef.current) {
      onTimeChangeRef.current(hour, selectedMinuteRef.current);
    }
  };

  const handleMinuteChange = (minute: string) => {
    selectedMinuteRef.current = minute;
    if (onTimeChangeRef.current) {
      onTimeChangeRef.current(selectedHourRef.current, minute);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.indicator} />
      <PickerColumn 
        data={HOURS} 
        initialIndex={now.getHours()} 
        onValueChange={handleHourChange} 
      />
      <Text style={styles.separator}>:</Text>
      <PickerColumn 
        data={MINUTES} 
        initialIndex={now.getMinutes()} 
        onValueChange={handleMinuteChange} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT * 5,
    width: 200,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  columnContainer: {
    flex: 1,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: '600',
  },
  separator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    paddingBottom: 4,
  },
  indicator: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    height: ITEM_HEIGHT,
    width: '100%',
    backgroundColor: '#f2f2f7',
    borderRadius: 10,
  },
});

export default TimePicker;