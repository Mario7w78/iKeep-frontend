import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
 *
 * Tres ajustes para que el campo no sea una lista cerrada:
 *  - La fila compartida se etiqueta "Ida y vuelta": el chip que eliges se
 *    aplica a los dos sentidos, y ahora eso se dice, no se adivina.
 *  - Hay un chip "Sin" (0 min) en cada fila: apaga un solo sentido sin tener
 *    que borrar todo el viaje.
 *  - "Personalizar..." abre el mismo editor horas/minutos de la duración, para
 *    que 25 min o 1 h 45 existan sin inflar la fila de chips.
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
  const [personalizando, setPersonalizando] = useState<
    null | 'ida' | 'vuelta'
  >(null);

  const aplicar = (minutos: number) => {
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
          onPress={() => aplicar(15)}
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
            setPersonalizando(null);
          }}
          hitSlop={10}
        >
          <Text style={styles.quitar}>Quitar</Text>
        </TouchableOpacity>
      </View>

      <Selector
        etiqueta={separados ? 'Ida' : 'Ida y vuelta'}
        caption={separados ? undefined : 'Se aplica a la ida y a la vuelta'}
        hint={separados ? 'Solo la ida' : 'Se aplica a la ida y a la vuelta'}
        valor={ida ?? 0}
        onElegir={aplicar}
        personalizando={personalizando === 'ida'}
        onPersonalizar={() => setPersonalizando('ida')}
        onCerrar={() => setPersonalizando(null)}
        styles={styles}
        testID="travel-ida"
      />

      {separados && (
        <Selector
          etiqueta="Vuelta"
          hint="Solo la vuelta"
          valor={vuelta ?? 0}
          onElegir={onCambiarVuelta}
          personalizando={personalizando === 'vuelta'}
          onPersonalizar={() => setPersonalizando('vuelta')}
          onCerrar={() => setPersonalizando(null)}
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
          Sales {conDesfase(inicio, -(ida ?? 0))} · Vuelves{' '}
          {conDesfase(fin, vuelta ?? 0)}
          {!separados && (ida ?? 0) > 0
            ? ` · ${ida} min a cada lado`
            : ''}
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
  caption?: string;
  hint?: string;
  valor: number;
  onElegir: (minutos: number) => void;
  personalizando: boolean;
  onPersonalizar: () => void;
  onCerrar: () => void;
  styles: ReturnType<typeof createStyles>;
  testID: string;
}> = ({
  etiqueta,
  caption,
  hint,
  valor,
  onElegir,
  personalizando,
  onPersonalizar,
  onCerrar,
  styles,
  testID,
}) => {
  const esPersonalizado = valor > 0 && !OPCIONES.some((o) => o.valor === valor);

  if (personalizando) {
    return (
      <View style={styles.bloque}>
        <View style={styles.editorCabecera}>
          {etiqueta && <Text style={styles.etiqueta}>{etiqueta}</Text>}
          <TouchableOpacity onPress={onCerrar} hitSlop={10}>
            <Text style={styles.quitar}>Listo</Text>
          </TouchableOpacity>
        </View>
        <EditorPersonalizado
          valor={valor}
          onConfirmar={onElegir}
          hint={hint}
          styles={styles}
          testID={testID}
        />
      </View>
    );
  }

  return (
    <View style={styles.bloque}>
      {etiqueta && <Text style={styles.etiqueta}>{etiqueta}</Text>}
      {caption && <Text style={styles.caption}>{caption}</Text>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.fila}
        testID={testID}
      >
        <TouchableOpacity
          testID={`${testID}-sin`}
          style={[styles.chip, valor === 0 && styles.chipElegido]}
          onPress={() => onElegir(0)}
          accessibilityRole="radio"
          accessibilityState={{ selected: valor === 0 }}
        >
          <Text style={[styles.chipTexto, valor === 0 && styles.chipTextoElegido]}>
            Sin
          </Text>
        </TouchableOpacity>

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
              <Text
                style={[styles.chipTexto, elegida && styles.chipTextoElegido]}
              >
                {opcion.etiqueta}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          testID={`${testID}-custom`}
          style={[styles.chip, esPersonalizado && styles.chipElegido]}
          onPress={onPersonalizar}
          accessibilityRole="radio"
          accessibilityState={{ selected: esPersonalizado }}
        >
          <Text
            style={[
              styles.chipTexto,
              esPersonalizado && styles.chipTextoElegido,
            ]}
          >
            {esPersonalizado ? `${valor} min` : 'Personalizar…'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const EditorPersonalizado: React.FC<{
  valor: number;
  hint?: string;
  styles: ReturnType<typeof createStyles>;
  testID: string;
  onConfirmar: (minutos: number) => void;
}> = ({ valor, hint, styles, testID, onConfirmar }) => {
  const [horas, setHoras] = useState(String(Math.floor(valor / 60)));
  const [minutos, setMinutos] = useState(String(valor % 60));

  const commit = (h: string, m: string) => {
    onConfirmar((Number(h) || 0) * 60 + (Number(m) || 0));
  };

  return (
    <View style={styles.editor}>
      <View style={styles.editorFila}>
        <TextInput
          testID={`${testID}-horas`}
          style={styles.editorInput}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#a8a9bb"
          value={horas}
          onChangeText={(text) => {
            const limpio = text.replace(/[^0-9]/g, '');
            setHoras(limpio);
            commit(limpio, minutos);
          }}
          autoCorrect={false}
        />
        <Text style={styles.editorLabel}>horas</Text>
        <TextInput
          testID={`${testID}-minutos`}
          style={styles.editorInput}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor="#a8a9bb"
          value={minutos}
          onChangeText={(text) => {
            const limpio = text.replace(/[^0-9]/g, '');
            setMinutos(limpio);
            commit(horas, limpio);
          }}
          autoCorrect={false}
        />
        <Text style={styles.editorLabel}>min</Text>
      </View>
      {hint && <Text style={styles.caption}>{hint}</Text>}
    </View>
  );
};

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
    caption: {
      fontSize: TEXTO.micro,
      color: colors.textSecondary,
    },
    fila: {
      gap: ESPACIO.sm,
      paddingRight: ESPACIO.lg,
    },
    chip: {
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
    editorCabecera: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    editor: {
      gap: ESPACIO.sm,
    },
    editorFila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIO.sm,
    },
    editorInput: {
      width: 72,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: RADIO.md,
      paddingVertical: ESPACIO.sm,
      paddingHorizontal: ESPACIO.md,
      fontSize: TEXTO.cuerpo,
      fontWeight: PESO.medio,
      color: colors.surface,
    },
    editorLabel: {
      fontSize: TEXTO.pie,
      color: colors.textSecondary,
    },
  });