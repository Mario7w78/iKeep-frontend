import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ThemeColors, useTheme } from '../../theme/colors';
import { DURACION, ESPACIO, PESO, RADIO, TEXTO } from '../../theme/tokens';

interface Props {
  /** Cambia cada vez que hay algo que festejar. Ver la nota de abajo. */
  disparo: number;
  mensaje?: string;
}

/**
 * El momento en que el día queda terminado.
 *
 * Es la contraparte de la casilla: marcar algo tiene que devolver algo, o el
 * ciclo no cierra. Duolingo funciona por esto, no por el contenido.
 *
 * Hecho con el `Animated` del core y no con una librería de confeti: no hay
 * ninguna instalada, Reanimated tampoco, y para veinte partículas que viven
 * un segundo no vale la pena una dependencia.
 *
 * IMPORTANTE: quien lo use debe pasarle `key={disparo}`. Cada celebración es
 * un montaje nuevo con valores nuevos, y así nunca hace falta un `setValue()`
 * sobre un valor manejado por el hilo nativo — que es exactamente lo que
 * rompió la hoja del wizard en su momento.
 */

const CUANTAS = 18;
const VISIBLE_MS = 1800;
const { width: ANCHO } = Dimensions.get('window');

const COLORES = ['#84C49F', '#E8836F', '#ff9f43', '#E1E6C6', '#7EC8E3'];

interface Particula {
  izquierda: number;
  desplazamientoX: number;
  retraso: number;
  color: string;
  tamano: number;
  giro: number;
}

function sembrar(): Particula[] {
  return Array.from({ length: CUANTAS }, (_, i) => ({
    izquierda: Math.random() * ANCHO,
    // Cada una cae con su propia deriva: si todas bajan rectas se lee como
    // una persiana, no como algo que celebra.
    desplazamientoX: (Math.random() - 0.5) * 120,
    retraso: Math.random() * 260,
    color: COLORES[i % COLORES.length],
    tamano: 7 + Math.random() * 7,
    giro: Math.random() * 720 - 360,
  }));
}

export const Celebration: React.FC<Props> = ({
  disparo,
  mensaje = '¡Día completo!',
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const particulas = useMemo(sembrar, []);
  const avance = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Sin disparo previo no hay nada que festejar: el 0 es el estado inicial.
    if (disparo <= 0) {
      setVisible(false);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => undefined
    );

    Animated.timing(avance, {
      toValue: 1,
      duration: VISIBLE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setVisible(false);
    });
  }, [disparo, avance]);

  if (!visible) return null;

  return (
    // pointerEvents none: es decoración, y no puede quedarse tapando la
    // pantalla si algo sale mal.
    <View style={styles.capa} pointerEvents="none" testID="celebration">
      {particulas.map((p, i) => {
        const inicio = p.retraso / VISIBLE_MS;
        const rango = [0, Math.min(inicio, 0.9), 1];

        return (
          <Animated.View
            key={i}
            style={[
              styles.particula,
              {
                left: p.izquierda,
                width: p.tamano,
                height: p.tamano,
                backgroundColor: p.color,
                opacity: avance.interpolate({
                  inputRange: [...rango, 1],
                  outputRange: [0, 1, 0, 0],
                }),
                transform: [
                  {
                    translateY: avance.interpolate({
                      inputRange: rango,
                      outputRange: [-40, -40, 520],
                    }),
                  },
                  {
                    translateX: avance.interpolate({
                      inputRange: rango,
                      outputRange: [0, 0, p.desplazamientoX],
                    }),
                  },
                  {
                    rotate: avance.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', `${p.giro}deg`],
                    }),
                  },
                ],
              },
            ]}
          />
        );
      })}

      <Animated.View
        style={[
          styles.cartel,
          {
            opacity: avance.interpolate({
              inputRange: [0, 0.15, 0.75, 1],
              outputRange: [0, 1, 1, 0],
            }),
            transform: [
              {
                scale: avance.interpolate({
                  inputRange: [0, 0.2, 1],
                  outputRange: [0.85, 1, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.texto}>{mensaje}</Text>
      </Animated.View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    capa: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
    },
    particula: {
      position: 'absolute',
      top: 0,
      borderRadius: 2,
    },
    cartel: {
      paddingVertical: ESPACIO.md,
      paddingHorizontal: ESPACIO.xl,
      borderRadius: RADIO.pill,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.secondaryAccent,
    },
    texto: {
      fontSize: TEXTO.destacado,
      fontWeight: PESO.maximo,
      color: colors.surface,
    },
  });

export const DURACION_CELEBRACION_MS = VISIBLE_MS + DURACION.rapido;
