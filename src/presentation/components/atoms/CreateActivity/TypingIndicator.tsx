import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const DOT_SIZE = 8;
const DOT_COLOR = 'rgba(255,255,255,0.5)';
const SCALE_UP = 1.3;
const ANIM_DURATION = 300;
const STAGGER_DELAY = 200;
const PAUSE_DURATION = 400;

export const TypingIndicator: React.FC = () => {
  const animValues = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  useEffect(() => {
    const animations = animValues.map((anim, i) =>
      Animated.sequence([
        Animated.delay(i * STAGGER_DELAY),
        Animated.timing(anim, {
          toValue: SCALE_UP,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 1,
          duration: ANIM_DURATION,
          useNativeDriver: true,
        }),
        Animated.delay(PAUSE_DURATION),
      ])
    );

    const loop = Animated.loop(Animated.parallel(animations));
    loop.start();

    return () => loop.stop();
  }, [animValues]);

  return (
    <View style={styles.container}>
      {animValues.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            { transform: [{ scale: anim }] },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: DOT_COLOR,
  },
});
