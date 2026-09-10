import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemeColors, useTheme } from '../../theme/colors';
import { ESPACIO, PESO, RADIO, TEXTO } from '../../theme/tokens';

interface Props {
  inicio: Date;
  fin: Date;
  ida: number | null;
  vuelta: number | null;
  onCambiarIda: (minutos: number) => void;
  onCambiarVuelta: (minutos: number) => void;
}

/**
 * El viaje hasta la actividad y de vuelta.
 *
 * Antes eran dos campos llamados "Traslado antes" y "Traslado después" —antes
 * y después de qué—, cada uno con su fila de opciones y su "Personalizar...".
 * Dos bloques casi idénticos para un dato que en la vida real es uno solo: el
 * viaje de ida y el de vuelta suelen durar lo mismo.
 *
 * Y en ninguna parte se veía qué hacía. Un número de minutos no dice nada; la
 * hora a la que tienes que salir de tu casa, sí. Eso es lo que se muestra, y
 * es lo que hace que el campo se explique solo.
 */

/** Los tiempos que la gente realmente responde, no una escala uniforme. */
const OPCIONES = [
  { etiqueta: '5 min', valor: 5 },
  { etiqueta: '10 min', valor: 10 },
  { etiqueta: '15 min', valor: 15 },
  { etiqueta: '20 min', valor: 20 },
  { etiqueta: '30 min', valor: 30 },
  { etiqueta: '45 min', valor: 45 },
  { etiqueta: '1 h', valor: 60 },
  { etiqueta: '1 h 30', valor: 90 },
];

function conDesfase(momento: Date, minutos: number): string {
  const d = new Date(momento.getTime() + minutos * 60_000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export const TravelTimeField: React.FC<Props> = ({
  inicio,
  fin,
  ida,
  vuelta,
  onCambiarIda,
  onCambiarVuelta,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const viaja = (ida ?? 0) > 0 || (vuelta ?? 0) > 0;
  // Se abre solo si ya venían distintos: quien nunca los separó no tiene por
  // qué enterarse de que puede.
  const [separados, setSeparados] = useState(
    viaja && vuelta !== null && vuelta !== ida
  );

  const elegir = (minutos: number) => {
    onCambiarIda(minutos);
    // Mientras no se separen, la vuelta sigue a la ida. Es el caso normal, y
    // pedir el mismo número dos veces es pedirlo de más.
    if (!separados) onCambiarVuelta(minutos);
  };

  if (!viaja) {
    return (
      <View style={styles.contenedor} testID="travel-field">
        <Text style={styles.pregunta}>¿Tienes que viajar para llegar?</Text>
        <TouchableOpacity
          testID="travel-enable"
          style={styles.botonSi}
          onPress={() => elegir(15)}
          activeOpacity={0.8}
        >
          <Ionicons name="walk-outline" size={18} color={colors.secondaryAccent} />
          <Text style={styles.botonSiTexto}>Sí, agregar tiempo de viaje</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.contenedor} testID="travel-field">
      <View style={styles.encabezado}>
        <Text style={styles.pregunta}>Tiempo de viaje</Text>
        <TouchableOpacity
          testID="travel-clear"
          onPress={() => {
            onCambiarIda(0);
            onCambiarVuelta(0);
            setSeparados(false);
          }}
          hitSlop={10}
        >
          <Text style={styles.quitar}>Quitar</Text>
        </TouchableOpacity>
      </View>

      <Selector
        etiqueta={separados ? 'Ida' : undefined}
        valor={ida ?? 0}
        onElegir={elegir}
        styles={styles}
        testID="travel-ida"
      />

      {separados && (
        <Selector
          etiqueta="Vuelta"
          valor={vuelta ?? 0}
          onElegir={onCambiarVuelta}
          styles={styles}
          testID="travel-vuelta"
        />
      )}

      {/* La consecuencia, en horas de reloj. Es lo único de todo el campo que
          responde a la pregunta que el usuario tiene de verdad: entonces, ¿a
          qué hora tengo que salir? */}
      <View style={styles.resumen} testID="travel-summary">
        <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.resumenTexto}>
          Sales {conDesfase(inicio, -(ida ?? 0))} · Llegas de vuelta{' '}
          {conDesfase(fin, vuelta ?? 0)}
        </Text>
      </View>

      {!separados && (
        <TouchableOpacity
          testID="travel-split"
          onPress={() => setSeparados(true)}
          hitSlop={8}
        >
          <Text style={styles.separar}>La vuelta tarda distinto</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const Selector: React.FC<{
  etiqueta?: string;
  valor: number;
  onElegir: (minutos: number) => void;
  styles: ReturnType<typeof createStyles>;
  testID: string;
}> = ({ etiqueta, valor, onElegir, styles, testID }) => (
  <View style={styles.bloque}>
    {etiqueta && <Text style={styles.etiqueta}>{etiqueta}</Text>}
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.fila}
      testID={testID}
    >
      {OPCIONES.map((opcion) => {
        const elegida = valor === opcion.valor;
        return (
          <TouchableOpacity
            key={opcion.valor}
            testID={`${testID}-${opcion.valor}`}
            style={[styles.chip, elegida && styles.chipElegido]}
            onPress={() => onElegir(opcion.valor)}
            accessibilityRole="radio"
            accessibilityState={{ selected: elegida }}
          >
            <Text style={[styles.chipTexto, elegida && styles.chipTextoElegido]}>
              {opcion.etiqueta}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
);

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    contenedor: {
      gap: ESPACIO.md,
      paddingVertical: ESPACIO.md,
    },
    encabezado: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    pregunta: {
      fontSize: TEXTO.cuerpo,
      fontWeight: PESO.fuerte,
      color: colors.surface,
    },
    quitar: {
      fontSize: TEXTO.pie,
      fontWeight: PESO.medio,
      color: colors.textSecondary,
      textDecorationLine: 'underline',
    },
    botonSi: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIO.sm,
      alignSelf: 'flex-start',
      paddingVertical: ESPACIO.md,
      paddingHorizontal: ESPACIO.lg,
      borderRadius: RADIO.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
    },
    botonSiTexto: {
      fontSize: TEXTO.pie,
      fontWeight: PESO.medio,
      color: colors.surface,
    },
    bloque: {
      gap: ESPACIO.sm,
    },
    etiqueta: {
      fontSize: TEXTO.micro,
      fontWeight: PESO.fuerte,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    fila: {
      gap: ESPACIO.sm,
      paddingRight: ESPACIO.lg,
    },
    chip: {
      paddingVertical: ESPACIO.sm,
      paddingHorizontal: ESPACIO.md,
      borderRadius: RADIO.pill,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
    },
    chipElegido: {
      borderColor: colors.secondaryAccent,
      backgroundColor: colors.secondaryAccent,
    },
    chipTexto: {
      fontSize: TEXTO.pie,
      fontWeight: PESO.medio,
      color: colors.textSecondary,
    },
    chipTextoElegido: {
      color: colors.screenBackground,
      fontWeight: PESO.fuerte,
    },
    resumen: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIO.sm,
      paddingVertical: ESPACIO.sm,
      paddingHorizontal: ESPACIO.md,
      borderRadius: RADIO.md,
      backgroundColor: colors.cardBackground,
    },
    resumenTexto: {
      flex: 1,
      fontSize: TEXTO.pie,
      color: colors.surface,
      fontWeight: PESO.medio,
    },
    separar: {
      fontSize: TEXTO.pie,
      color: colors.textSecondary,
      textDecorationLine: 'underline',
    },
  });
