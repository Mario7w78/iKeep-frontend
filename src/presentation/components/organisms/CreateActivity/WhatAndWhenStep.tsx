import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import NameIdentityStep from './NameIdentityStep';
import DaySelectionStep from './DaySelectionStep';
import { ThemeColors, useTheme } from '../../theme/colors';

/**
 * "¿Qué y cuándo?" — el primer paso del wizard.
 *
 * Junta lo que antes eran dos pantallas separadas. Estaban partidas sin
 * motivo: elegir el nombre y elegir los días son la misma decisión —qué
 * actividad es y cuándo ocurre— y separarlas costaba dos toques de "Siguiente"
 * y dos de "Atrás" cada vez que el usuario quería corregir algo.
 *
 * El desplazamiento es uno solo. Cada sección se dibuja embebida, sin su
 * propio ScrollView: anidarlos hacía que el gesto se peleara entre los dos.
 *
 * Al pie ofrece la salida al chat. Los dos caminos existían desde el
 * principio pero incomunicados: quien empezaba a llenar el formulario y se
 * daba cuenta de que era más rápido contarlo, tenía que cancelar y volver a
 * entrar por otro lado.
 *
 * Con `fechaUnica` (llegada desde el mes con "+"), los selectores de días se
 * reemplazan por una confirmación de solo lectura: la fecha ya se eligió al
 * tocar el día, volver a preguntarla sería ruido.
 */
export const WhatAndWhenStep: React.FC<any> = (props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.contenido}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <NameIdentityStep {...props} embebido />
      <View style={styles.separador} />
      {props.fechaUnica ? (
        <SoloEsteDia fecha={props.fechaUnica} styles={styles} />
      ) : (
        <DaySelectionStep {...props} embebido />
      )}

      {props.onContarleAlAsistente && (
        <TouchableOpacity
          testID="tell-assistant-link"
          style={styles.salida}
          onPress={props.onContarleAlAsistente}
          activeOpacity={0.7}
        >
          <Text style={styles.salidaTexto}>Prefiero contárselo al asistente</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

/**
 * La confirmación de solo lectura del modo un día puntual.
 *
 * El copy nombra la limitación real —solo se ve en el mes— porque prometer
 * más sería mentir: el horario semanal no muestra eventos de fecha única.
 */
const SoloEsteDia: React.FC<{ fecha: string; styles: any }> = ({ fecha, styles }) => {
  const { colors } = useTheme();

  return (
    <View
      testID="solo-este-dia"
      style={[styles.soloDia, { borderColor: colors.cardBorder, backgroundColor: colors.cardBackground }]}
    >
      <Ionicons name="calendar-outline" size={20} color={colors.secondaryAccent} />
      <Text style={[styles.soloDiaTitulo, { color: colors.surface }]}>
        Solo este día: {fecha}
      </Text>
      <Text style={[styles.soloDiaNota, { color: colors.textSecondary }]}>
        Esta actividad ocurrirá únicamente ese día. Se ve en el calendario mensual; no entra en tu horario semanal.
      </Text>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    scroll: {
      flex: 1,
    },
    contenido: {
      paddingBottom: 24,
    },
    salida: {
      alignSelf: 'center',
      marginTop: 24,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    salidaTexto: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textSecondary,
      textDecorationLine: 'underline',
    },
    separador: {
      height: 1,
      backgroundColor: colors.cardBorder,
      marginVertical: 20,
      marginHorizontal: 20,
    },
    soloDia: {
      marginHorizontal: 20,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      gap: 8,
    },
    soloDiaTitulo: {
      fontSize: 16,
      fontWeight: '800',
    },
    soloDiaNota: {
      fontSize: 13,
      lineHeight: 18,
    },
  });
