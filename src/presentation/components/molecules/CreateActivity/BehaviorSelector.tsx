import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  ComportamientoActividad,
  OPCIONES_COMPORTAMIENTO,
} from '../../../../domain/entities/activityBehavior';
import { ThemeColors, useTheme } from '../../theme/colors';

interface Props {
  valor: ComportamientoActividad;
  onChange: (valor: ComportamientoActividad) => void;
}

/**
 * La única pregunta de comportamiento del formulario.
 *
 * Reemplaza a la tarjeta "Tipo" (Fijo/Optimizable) y al toggle "Anclaje de
 * día" que vivía ciento cuarenta líneas más abajo y significaba lo contrario
 * de lo que la tarjeta decía. Tenerlos separados obligaba al usuario a
 * relacionar dos controles que se contradecían en el texto.
 *
 * Cada opción lleva un ejemplo debajo: el título solo no desambigua —"yo
 * elijo el día" y "cuando mejor encaje" suenan parecido hasta que uno ve
 * "gimnasio los lunes" al lado de "estudiar el día que haya lugar".
 */
export const BehaviorSelector: React.FC<Props> = ({ valor, onChange }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.contenedor} testID="behavior-selector">
      <Text style={styles.titulo}>¿Cuándo la haces?</Text>

      {OPCIONES_COMPORTAMIENTO.map((opcion) => {
        const seleccionada = opcion.valor === valor;

        return (
          <TouchableOpacity
            key={opcion.valor}
            testID={`behavior-${opcion.valor}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: seleccionada }}
            style={[styles.opcion, seleccionada && styles.opcionSeleccionada]}
            onPress={() => onChange(opcion.valor)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={opcion.icono as any}
              size={22}
              color={seleccionada ? colors.secondaryAccent : colors.textSecondary}
            />
            <View style={styles.textos}>
              <Text
                style={[
                  styles.opcionTitulo,
                  seleccionada && styles.opcionTituloSeleccionado,
                ]}
              >
                {opcion.titulo}
              </Text>
              <Text style={styles.opcionEjemplo}>{opcion.ejemplo}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    contenedor: {
      gap: 10,
    },
    titulo: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.surface,
      marginBottom: 2,
    },
    opcion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
    },
    opcionSeleccionada: {
      borderColor: colors.secondaryAccent,
    },
    textos: {
      flex: 1,
    },
    opcionTitulo: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.surface,
    },
    opcionTituloSeleccionado: {
      color: colors.secondaryAccent,
    },
    opcionEjemplo: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
