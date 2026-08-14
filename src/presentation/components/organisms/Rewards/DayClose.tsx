import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RespuestaDeCierre } from '../../../../infrastructure/api/RewardsApiService';
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
 * sino una pregunta con tres salidas. La lista solo aparece si el usuario
 * dice que hizo algunas; para los otros dos caminos, un toque resuelve el día.
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
  onResponder: (respuesta: RespuestaDeCierre, hechas: string[]) => void;
  onCerrar: () => void;
  guardando?: boolean;
}

export const DayClose: React.FC<Props> = ({
  visible,
  pendientes,
  onResponder,
  onCerrar,
  guardando = false,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [eligiendo, setEligiendo] = useState(false);
  const [hechas, setHechas] = useState<string[]>([]);

  const alternar = (id: string) =>
    setHechas((previas) =>
      previas.includes(id) ? previas.filter((p) => p !== id) : [...previas, id]
    );

  const salir = () => {
    setEligiendo(false);
    setHechas([]);
    onCerrar();
  };

  const responder = (respuesta: RespuestaDeCierre, ids: string[] = []) => {
    setEligiendo(false);
    setHechas([]);
    onResponder(respuesta, ids);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={salir}>
      <View style={styles.contenedor} testID="cierre-del-dia">
        <Pressable style={styles.fondo} onPress={salir} />

        <View style={styles.hoja}>
          <View style={styles.asa} />

          {!eligiendo ? (
            <>
              <Text style={styles.titulo}>¿Cómo te fue hoy?</Text>
              <Text style={styles.bajada}>
                {pendientes.length === 1
                  ? 'Queda 1 actividad sin responder.'
                  : `Quedan ${pendientes.length} actividades sin responder.`}
              </Text>

              <TouchableOpacity
                testID="cierre-todo"
                style={[styles.salida, styles.salidaPrincipal]}
                onPress={() => responder('todo')}
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
                onPress={() => setEligiendo(true)}
                disabled={guardando}
                activeOpacity={0.8}
              >
                <Ionicons name="list-outline" size={22} color={colors.surface} />
                <Text style={styles.salidaTexto}>Hice algunas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="cierre-dificil"
                style={styles.salida}
                onPress={() => responder('dificil')}
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
            </>
          ) : (
            <>
              <Text style={styles.titulo}>¿Cuáles sí?</Text>
              <Text style={styles.bajada}>
                Las que no toques quedan como no hechas.
              </Text>

              <ScrollView style={styles.lista}>
                {pendientes.map((p) => {
                  const elegida = hechas.includes(p.id);

                  return (
                    <TouchableOpacity
                      key={p.id}
                      testID={`cierre-item-${p.id}`}
                      style={styles.item}
                      onPress={() => alternar(p.id)}
                      activeOpacity={0.75}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: elegida }}
                    >
                      <Ionicons
                        name={elegida ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={elegida ? colors.secondaryAccent : colors.textSecondary}
                      />
                      <Text style={styles.itemTexto}>{p.titulo}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                testID="cierre-confirmar"
                style={[styles.salida, styles.salidaPrincipal]}
                onPress={() => responder('algunas', hechas)}
                disabled={guardando}
                activeOpacity={0.8}
              >
                <Text style={[styles.salidaTexto, styles.salidaTextoPrincipal]}>
                  Listo
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    contenedor: { flex: 1, justifyContent: 'flex-end' },
    fondo: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 11, 18, 0.62)' },
    hoja: {
      backgroundColor: colors.screenBackground,
      borderTopLeftRadius: RADIO.xl,
      borderTopRightRadius: RADIO.xl,
      paddingHorizontal: ESPACIO.lg,
      paddingBottom: ESPACIO.xxxl,
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
    lista: { maxHeight: 280 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIO.md,
      paddingVertical: ESPACIO.md,
    },
    itemTexto: { flex: 1, fontSize: TEXTO.pie, color: colors.surface },
  });
