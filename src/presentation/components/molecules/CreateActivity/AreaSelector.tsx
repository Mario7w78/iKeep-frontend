import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AREAS, AreaDeVida } from '../../../../domain/entities/lifeArea';
import { ThemeColors, useTheme } from '../../theme/colors';
import { ESPACIO, PESO, RADIO, TEXTO } from '../../theme/tokens';

/**
 * De qué parte de tu vida es la actividad.
 *
 * Sustituye al selector de "Identidad" (Clase / Trabajo / Tarea), que hacía
 * elegir entre dos cosas que para el horario son idénticas —una clase y un
 * turno de trabajo se ocupan igual— y no permitía representar nada que no
 * fuera estudiar.
 *
 * PROVISIONAL: íconos de Ionicons y una fila de fichas. Cuando existan las
 * ilustraciones de los pétalos, esto se reemplaza por ellas; la forma del
 * dato no cambia.
 */

interface Props {
  valor: AreaDeVida;
  onChange: (area: AreaDeVida) => void;
}

export const AreaSelector: React.FC<Props> = ({ valor, onChange }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const elegida = AREAS.find((a) => a.valor === valor);

  return (
    <View testID="area-selector">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.fila}
      >
        {AREAS.map((area) => {
          const activa = area.valor === valor;

          return (
            <TouchableOpacity
              key={area.valor}
              testID={`area-${area.valor}`}
              style={[styles.ficha, activa && styles.fichaActiva]}
              onPress={() => onChange(area.valor)}
              activeOpacity={0.75}
              accessibilityRole="radio"
              accessibilityState={{ selected: activa }}
              accessibilityLabel={`${area.titulo}. ${area.ejemplo}`}
            >
              <Ionicons
                name={area.icono as any}
                size={20}
                color={activa ? colors.screenBackground : colors.textSecondary}
              />
              <Text style={[styles.titulo, activa && styles.tituloActivo]}>
                {area.titulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* El ejemplo va debajo y no dentro de cada ficha: en la ficha no
          entra, y sin él "Tú" no se entiende. */}
      {elegida && (
        <Text style={styles.ejemplo} testID="area-ejemplo">
          {elegida.ejemplo}
        </Text>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    fila: { gap: ESPACIO.sm, paddingVertical: ESPACIO.xs },
    ficha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIO.xs,
      paddingVertical: ESPACIO.sm,
      paddingHorizontal: ESPACIO.md,
      borderRadius: RADIO.pill,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
    },
    fichaActiva: {
      backgroundColor: colors.secondaryAccent,
      borderColor: colors.secondaryAccent,
    },
    titulo: {
      fontSize: TEXTO.pie,
      fontWeight: PESO.fuerte,
      color: colors.textSecondary,
    },
    tituloActivo: { color: colors.screenBackground },
    ejemplo: {
      marginTop: ESPACIO.xs,
      fontSize: TEXTO.micro,
      color: colors.textSecondary,
    },
  });
