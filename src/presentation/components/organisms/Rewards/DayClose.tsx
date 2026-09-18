import React, { useMemo } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeColors, useTheme } from '../../theme/colors';
import { ESPACIO, PESO, RADIO, TEXTO } from '../../theme/tokens';

/**
 * El cierre del día.
 *
 * Abrir a las once de la noche con el día entero sin marcar es el caso MÁS
 * frecuente, no el raro. Y es donde se decide si la app se siente como un
 * compañero o como un formulario.
 *
 * Por eso no son cuatro casillas para tildar —eso es trabajo administrativo—
 * sino una pregunta con tres salidas. "Hice algunas" no abre una lista acá:
 * el detalle de qué sí y qué no se verifica en el mazo, que pregunta una
 * actividad por vez. El cierre se queda con el resumen principal.
 *
 * "Fue un día difícil" es el botón que más importa y el que ninguna app de
 * hábitos tiene: deja todo SIN RESOLVER, que no suma pero tampoco resta, y
 * la racha sobrevive porque se apoya en la presencia. Sin una forma de ser
 * honesto que no se sienta como fracasar, la única salida honesta es cerrar
 * la app y no volver.
 */

export interface PendienteDelDia {
  id: string;
  titulo: string;
}

interface Props {
  visible: boolean;
  pendientes: PendienteDelDia[];
  onResponder: (respuesta: 'todo' | 'dificil') => void;
  /** "Hice algunas": delega la verificación al mazo de pendientes. */
  onVerificar: () => void;
  onCerrar: () => void;
  guardando?: boolean;
}

export const DayClose: React.FC<Props> = ({
  visible,
  pendientes,
  onResponder,
  onVerificar,
  onCerrar,
  guardando = false,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
      <View style={styles.contenedor} testID="cierre-del-dia">
        <Pressable style={styles.fondo} onPress={onCerrar} />

        <View style={styles.hoja}>
          <View style={styles.asa} />

          <Text style={styles.titulo}>¿Cómo te fue hoy?</Text>
          <Text style={styles.bajada}>
            {pendientes.length === 1
              ? 'Queda 1 actividad sin responder.'
              : `Quedan ${pendientes.length} actividades sin responder.`}
          </Text>

          <TouchableOpacity
            testID="cierre-todo"
            style={[styles.salida, styles.salidaPrincipal]}
            onPress={() => onResponder('todo')}
            disabled={guardando}
            activeOpacity={0.8}
          >
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={colors.screenBackground}
            />
            <Text style={[styles.salidaTexto, styles.salidaTextoPrincipal]}>
              Hice todo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="cierre-algunas"
            style={styles.salida}
            onPress={onVerificar}
            disabled={guardando}
            activeOpacity={0.8}
          >
            <Ionicons name="list-outline" size={22} color={colors.surface} />
            <Text style={styles.salidaTexto}>Hice algunas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="cierre-dificil"
            style={styles.salida}
            onPress={() => onResponder('dificil')}
            disabled={guardando}
            activeOpacity={0.8}
          >
            <Ionicons name="cloudy-outline" size={22} color={colors.surface} />
            <Text style={styles.salidaTexto}>Fue un día difícil</Text>
          </TouchableOpacity>

          {/* Sin penalización y dicho en voz alta: si el usuario cree que
              responder honestamente le cuesta la racha, no responde. */}
          <Text style={styles.nota}>
            Ninguna de las tres rompe tu racha.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, insets: { bottom: number }) =>
  StyleSheet.create({
    contenedor: { flex: 1, justifyContent: 'flex-end' },
    fondo: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 11, 18, 0.62)' },
    hoja: {
      backgroundColor: colors.screenBackground,
      borderTopLeftRadius: RADIO.xl,
      borderTopRightRadius: RADIO.xl,
      paddingHorizontal: ESPACIO.lg,
      paddingBottom: Math.max(ESPACIO.xxxl, insets.bottom),
      gap: ESPACIO.sm,
    },
    asa: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.surface,
      opacity: 0.2,
      alignSelf: 'center',
      marginVertical: ESPACIO.md,
    },
    titulo: {
      fontSize: TEXTO.titulo,
      fontWeight: PESO.maximo,
      color: colors.surface,
      textAlign: 'center',
    },
    bajada: {
      fontSize: TEXTO.pie,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: ESPACIO.sm,
    },
    salida: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ESPACIO.sm,
      paddingVertical: ESPACIO.md,
      borderRadius: RADIO.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
    },
    salidaPrincipal: {
      backgroundColor: colors.secondaryAccent,
      borderColor: colors.secondaryAccent,
    },
    salidaTexto: {
      fontSize: TEXTO.cuerpo,
      fontWeight: PESO.fuerte,
      color: colors.surface,
    },
    salidaTextoPrincipal: { color: colors.screenBackground },
    nota: {
      fontSize: TEXTO.micro,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: ESPACIO.xs,
    },
  });
