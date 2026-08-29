import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { ThemeColors, useTheme } from '../../theme/colors';
import { DURACION, ESPACIO, PESO, RADIO, TEXTO } from '../../theme/tokens';

interface Props {
  completadas: number;
  total: number;
  fraccion: number;
}

/**
 * Cuánto del día está hecho.
 *
 * Barra y no anillo: un anillo pide SVG o Reanimated —ninguno instalado
 * todavía— y lo que importa acá es que el avance se vea, no cómo. Cuando
 * entre Reanimated con la mascota, esto se cambia sin tocar quien lo usa.
 */
export const DailyProgress: React.FC<Props> = ({ completadas, total, fraccion }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const ancho = useRef(new Animated.Value(fraccion)).current;

  useEffect(() => {
    // Animado y no un salto: el movimiento es la recompensa. Ver la barra
    // crecer es lo que hace que marcar algo se sienta como avanzar.
    Animated.timing(ancho, {
      toValue: fraccion,
      duration: DURACION.lento,
      // El ancho no lo puede animar el hilo nativo.
      useNativeDriver: false,
    }).start();
  }, [fraccion, ancho]);

  // Un día sin nada programado no tiene progreso que mostrar: no hay barra
  // que llenar y decir "0 de 0" no significa nada.
  if (total <= 0) return null;

  return (
    <View testID="daily-progress" style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Text style={styles.texto}>
          {completadas} de {total} actividades completadas
        </Text>
      </View>

      <View style={styles.carril}>
        <Animated.View
          testID="daily-progress-fill"
          style={[
            styles.relleno,
            {
              width: ancho.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    contenedor: {
      gap: ESPACIO.sm - 2,
    },
    encabezado: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    texto: {
      fontSize: TEXTO.pie,
      fontWeight: PESO.medio,
      color: colors.textSecondary,
    },
    carril: {
      height: 8,
      borderRadius: RADIO.pill,
      backgroundColor: colors.cardBorder,
      overflow: 'hidden',
    },
    relleno: {
      height: '100%',
      borderRadius: RADIO.pill,
      backgroundColor: colors.secondaryAccent,
    },
  });
