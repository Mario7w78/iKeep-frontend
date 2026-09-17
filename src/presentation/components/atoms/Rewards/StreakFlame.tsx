import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

import { ThemeColors, useTheme } from '../../theme/colors';
import { PESO, TEXTO } from '../../theme/tokens';

interface Props {
  dias: number;
  enRiesgo: boolean;
  /** Diámetro de la llama. El 56 entra en una tarjeta. */
  size?: number;
  /**
   * Cuánto del día queda (0..1). Solo pinta el anillo de countdown cuando
   * `enRiesgo`: la llama no se apaga, se rodea del tiempo que la protege.
   */
  restaDelDia?: number;
  /** False para el día difícil: ahí los dígitos juzgan, no motivan. */
  mostrarNumero?: boolean;
  /** Texto corto bajo la llama (p. ej. "días seguidos"). */
  etiqueta?: string;
}

/** El centro más brillante dentro de la llama, desplazado hacia la base. */
const POSICION_INTERIOR = (s: number) => {
  const interior = s * 0.64;
  return {
    left: (s - interior) / 2,
    top: (s - interior) / 2,
    transform: [{ translateY: s * 0.03 }],
  };
};

/**
 * La racha como recompensa, a la Duolingo: llama grande y siempre encendida.
 *
 * La que no se prende es la advertencia, no la llama. En riesgo la llama sigue
 * naranja y un anillo alrededor cuenta lo que queda del día: perderla se ve
 * como algo que pasará, no como algo que ya pasó.
 */
export const StreakFlame: React.FC<Props> = ({
  dias,
  enRiesgo,
  size = 56,
  restaDelDia,
  mostrarNumero = true,
  etiqueta,
}) => {
  const { colors, comfyColors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Se oculta en cero: un contador vacío no motiva, informa de un vacío.
  if (dias <= 0) return null;

  const centro = size + 16;
  const radio = size / 2 + 6;
  const circunferencia = 2 * Math.PI * radio;
  const restante = Math.min(Math.max(restaDelDia ?? 1, 0.02), 1);
  const conAnillo = enRiesgo && restaDelDia !== undefined;

  return (
    <View
      testID="streak-flame"
      style={styles.contenedor}
      accessibilityRole="text"
      accessibilityLabel={
        conAnillo
          ? `Racha de ${dias} días, en riesgo. Completa algo hoy para mantenerla.`
          : `Racha de ${dias} días`
      }
    >
      <View style={[styles.nido, { width: centro, height: centro }]}>
        <View style={[styles.llama, { width: size, height: size }]}>
          <Ionicons
            name="flame"
            size={size}
            color={colors.warning}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons
            name="flame"
            size={size * 0.64}
            color={comfyColors.orange}
            style={[StyleSheet.absoluteFill, POSICION_INTERIOR(size) as any]}
          />
        </View>

        {conAnillo && (
          <Svg style={StyleSheet.absoluteFill} testID="streak-anillo">
            <Circle
              cx={centro / 2}
              cy={centro / 2}
              r={radio}
              stroke={colors.cardBorder}
              strokeWidth={3.5}
              fill="none"
            />
            {/* El anillo se vacía mientras pasa el día: menos círculo, más
                urgencia, sin que la llama cambie de color. */}
            <Circle
              cx={centro / 2}
              cy={centro / 2}
              r={radio}
              stroke={colors.warning}
              strokeWidth={3.5}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${restante * circunferencia} ${circunferencia}`}
              transform={`rotate(-90 ${centro / 2} ${centro / 2})`}
            />
          </Svg>
        )}
      </View>

      {(mostrarNumero || etiqueta) && (
        <View style={styles.textos}>
          {mostrarNumero && (
            <Text testID="streak-numero" style={[styles.numero, { fontSize: size * 0.4 }]}>
              {dias}
            </Text>
          )}
          {etiqueta && <Text style={styles.etiqueta}>{etiqueta}</Text>}
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    contenedor: {
      alignItems: 'center',
      gap: 2,
    },
    nido: {
      position: 'relative',
    },
    llama: {
      position: 'absolute',
      left: 8,
      top: 8,
    },
    textos: {
      alignItems: 'center',
      gap: 2,
    },
    numero: {
      marginTop: 15,
      fontWeight: PESO.maximo,
      color: colors.warning,
      lineHeight: 34,
    },
    etiqueta: {
      fontSize: TEXTO.pie,
      color: colors.textSecondary,
    },
  });