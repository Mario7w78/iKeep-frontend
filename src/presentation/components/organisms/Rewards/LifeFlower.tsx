import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AREAS } from '../../../../domain/entities/lifeArea';
import { Flor } from '../../../../domain/services/lifeBalance';
import { ThemeColors, useTheme } from '../../theme/colors';
import { ESPACIO, PESO, RADIO, TEXTO } from '../../theme/tokens';

/**
 * Los pétalos: cuánto hay de cada parte de tu vida.
 *
 * Es lo que la racha nunca va a decirte. Puedes llevar treinta días seguidos
 * estudiando y haber dejado de dormir, de moverte y de ver gente, y la racha
 * te felicita igual.
 *
 * La regla que impide que esto se vuelva un reproche: la flor muestra la
 * FORMA de tu vida, no la califica. En semana de exámenes vas a estar
 * torcido, y así se ve una semana de exámenes. Los pétalos nunca encogen, y
 * una flor a medio abrir no está rota: está abriéndose.
 *
 * PROVISIONAL: barras y iconos de Ionicons. Cuando existan los pétalos
 * ilustrados esto se reemplaza por ellos; los números que los alimentan
 * —`tamano` y `apertura`— no cambian.
 */

interface Props {
  flor: Flor;
}

/** Debajo de esto no hay suficiente para decir nada sobre la flor. */
const MINIMO_PARA_HABLAR = 1;

export const LifeFlower: React.FC<Props> = ({ flor }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const totalHecho = flor.petalos.reduce((s, p) => s + p.hechas, 0);
  const olvidada = flor.masOlvidada
    ? AREAS.find((a) => a.valor === flor.masOlvidada)
    : undefined;

  if (totalHecho < MINIMO_PARA_HABLAR) {
    return (
      <View style={styles.seccion} testID="flor-vacia">
        <Text style={styles.titulo}>Tu flor</Text>
        <Text style={styles.pie}>
          Cada pétalo es un área de tu vida. Se abren con lo que vas haciendo.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.seccion} testID="flor">
      <Text style={styles.titulo}>Tu flor</Text>

      {/* Hueco reservado para la flor ilustrada. Va vacío a propósito: la
          ilustración llega después y el tamaño ya está tomado. */}
      <View style={styles.huecoFlor} testID="hueco-flor">
        <Text style={styles.aperturaTexto}>
          {Math.round(flor.apertura * 100)}%
        </Text>
        <Text style={styles.aperturaEtiqueta}>abierta</Text>
      </View>

      {flor.petalos.map((p) => {
        const descripcion = AREAS.find((a) => a.valor === p.area);

        return (
          <View key={p.area} style={styles.petalo} testID={`petalo-${p.area}`}>
            <Ionicons
              name={(descripcion?.icono ?? 'ellipse-outline') as any}
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.petaloTitulo}>{p.titulo}</Text>
            <View style={styles.barra}>
              <View
                testID={`barra-${p.area}`}
                style={[styles.relleno, { width: `${Math.round(p.tamano * 100)}%` }]}
              />
            </View>
            <Text style={styles.petaloNumero}>{p.hechas}</Text>
          </View>
        );
      })}

      {/* Se nombra solo cuando hay desnivel de verdad, y sin reprochar: es
          una observación sobre la forma, no una nota. */}
      {olvidada && (
        <Text style={styles.observacion} testID="flor-observacion">
          Últimamente hay menos de {olvidada.titulo.toLowerCase()}.
        </Text>
      )}

      <Text style={styles.pie}>
        Lo que abre la flor no es cuánto haces, es cuán repartido está.
      </Text>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    seccion: {
      backgroundColor: colors.cardBackground,
      borderRadius: RADIO.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: ESPACIO.lg,
      gap: ESPACIO.sm,
    },
    titulo: {
      fontSize: TEXTO.destacado,
      fontWeight: PESO.maximo,
      color: colors.surface,
    },
    huecoFlor: {
      alignSelf: 'center',
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: ESPACIO.sm,
    },
    aperturaTexto: {
      fontSize: TEXTO.display,
      fontWeight: PESO.maximo,
      color: colors.secondaryAccent,
    },
    aperturaEtiqueta: { fontSize: TEXTO.micro, color: colors.textSecondary },
    petalo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIO.sm,
      paddingVertical: ESPACIO.xs,
    },
    petaloTitulo: {
      width: 68,
      fontSize: TEXTO.pie,
      fontWeight: PESO.medio,
      color: colors.surface,
    },
    barra: {
      flex: 1,
      height: 8,
      borderRadius: RADIO.pill,
      backgroundColor: colors.screenBackground,
      overflow: 'hidden',
    },
    relleno: {
      height: '100%',
      borderRadius: RADIO.pill,
      backgroundColor: colors.secondaryAccent,
    },
    petaloNumero: {
      width: 28,
      textAlign: 'right',
      fontSize: TEXTO.micro,
      color: colors.textSecondary,
    },
    observacion: {
      fontSize: TEXTO.pie,
      color: colors.surface,
      marginTop: ESPACIO.xs,
    },
    pie: { fontSize: TEXTO.micro, color: colors.textSecondary },
  });
