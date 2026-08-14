import React, { useEffect, useMemo, useState } from 'react';
import {
  AppState,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  SesionEnfocada,
  estadoDe,
  progreso,
  transcurrido,
} from '../../../../domain/services/focusSession';
import { ThemeColors, useTheme } from '../../theme/colors';
import { ESPACIO, PESO, RADIO, TEXTO } from '../../theme/tokens';

/**
 * La sesión enfocada.
 *
 * Lo importante de esta pantalla es lo que NO hace: irse de la app no la
 * cancela. `AppState` no distingue «se fue a Instagram» de «le escribió la
 * madre» ni de «bloqueó la pantalla para leer el libro», así que castigar la
 * salida es castigar el azar — y castigaría sobre todo a quien deja el
 * teléfono de lado para estudiar de verdad, que es la conducta correcta.
 *
 * El reloj se refresca cada segundo solo para dibujar. El tiempo real sale
 * de la marca de inicio, así que un `setInterval` que se duerma no cuenta de
 * menos: al volver, el número ya está bien.
 *
 * PROVISIONAL: un anillo hecho con bordes y un hueco reservado para el sapo.
 */

interface Props {
  sesion: SesionEnfocada | null;
  titulo: string;
  guardando?: boolean;
  onTerminar: () => void;
  onDescartar: () => void;
  onSalir: () => void;
}

function comoReloj(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${m} min`;
}

export const FocusSession: React.FC<Props> = ({
  sesion,
  titulo,
  guardando = false,
  onTerminar,
  onDescartar,
  onSalir,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [ahora, setAhora] = useState(new Date());

  useEffect(() => {
    if (!sesion) return;
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, [sesion]);

  useEffect(() => {
    if (!sesion) return;
    const sub = AppState.addEventListener('change', (estado) => {
      // Solo se anota. No hay nada que cancelar ni que restar: no sabemos
      // por qué se fue, y suponerlo sería inventar.
      if (estado !== 'active') onSalir();
      else setAhora(new Date());
    });
    // `remove` no siempre viene: la forma de la suscripcion cambio entre
    // versiones de RN, y romper en el desmontaje es lo que menos se mira.
    return () => sub?.remove?.();
  }, [sesion, onSalir]);

  if (!sesion) return null;

  const estado = estadoDe(sesion, ahora);
  const minutos = transcurrido(sesion, ahora);
  const fraccion = progreso(sesion, ahora);

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.fondo} testID="sesion-enfocada">
        {estado === 'caducada' ? (
          <>
            <Text style={styles.titulo}>Esta sesión quedó abierta</Text>
            {/* No se afirma nada por el usuario: pasó demasiado tiempo para
                saber qué ocurrió, y escribir una suposición envenena el
                único dato que esta app puede producir. */}
            <Text style={styles.bajada}>
              Pasó mucho desde que la empezaste, así que no vamos a suponer
              qué pasó. Puedes marcarla desde tu día si la hiciste.
            </Text>
            <TouchableOpacity
              testID="sesion-cerrar-caducada"
              style={[styles.boton, styles.botonPrincipal]}
              onPress={onDescartar}
            >
              <Text style={[styles.botonTexto, styles.botonTextoPrincipal]}>
                Entendido
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.encabezado}>{titulo}</Text>

            {/* Hueco reservado para el sapo acompañando. Va vacío: la
                ilustración llega después y el tamaño ya está tomado. */}
            <View style={styles.huecoSapo} testID="hueco-sapo-sesion" />

            <View
              style={[
                styles.anillo,
                { borderColor: fraccion >= 1 ? colors.secondaryAccent : colors.cardBorder },
              ]}
              testID="sesion-anillo"
            >
              <Text style={styles.reloj}>{comoReloj(minutos)}</Text>
              <Text style={styles.meta}>de {sesion.metaMinutos} min</Text>
            </View>

            {/* Se dice en voz alta. Si el usuario cree que mirar el teléfono
                le cuesta la sesión, va a mirarlo igual y encima con culpa. */}
            <Text style={styles.promesa} testID="sesion-promesa">
              Puedes salir de la app. La sesión sigue acá.
            </Text>

            {sesion.salidas > 0 && (
              <Text style={styles.salidas} testID="sesion-salidas">
                {sesion.salidas === 1
                  ? 'Saliste 1 vez.'
                  : `Saliste ${sesion.salidas} veces.`}
              </Text>
            )}

            <TouchableOpacity
              testID="sesion-terminar"
              style={[
                styles.boton,
                estado === 'lista' ? styles.botonPrincipal : styles.botonSecundario,
              ]}
              onPress={onTerminar}
              disabled={guardando}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={estado === 'lista' ? colors.screenBackground : colors.surface}
              />
              <Text
                style={[
                  styles.botonTexto,
                  estado === 'lista' && styles.botonTextoPrincipal,
                ]}
              >
                {estado === 'lista' ? 'Listo, la hice' : 'Terminé antes'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="sesion-descartar"
              style={styles.salir}
              onPress={onDescartar}
              disabled={guardando}
            >
              {/* No dice "abandonar" ni "rendirse": cerrar sin afirmar nada
                  deja la actividad sin resolver, que no suma pero tampoco
                  resta. No es un fracaso, es no haber dicho nada. */}
              <Text style={styles.salirTexto}>Cerrar sin marcar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    fondo: {
      flex: 1,
      backgroundColor: colors.screenBackground,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: ESPACIO.xxl,
      gap: ESPACIO.md,
    },
    encabezado: {
      fontSize: TEXTO.destacado,
      fontWeight: PESO.fuerte,
      color: colors.surface,
      textAlign: 'center',
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
      lineHeight: 20,
    },
    huecoSapo: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.cardBorder,
    },
    anillo: {
      width: 180,
      height: 180,
      borderRadius: 90,
      borderWidth: 6,
      alignItems: 'center',
      justifyContent: 'center',
      gap: ESPACIO.xs,
    },
    reloj: {
      fontSize: 40,
      fontWeight: PESO.maximo,
      color: colors.surface,
    },
    meta: { fontSize: TEXTO.micro, color: colors.textSecondary },
    promesa: {
      fontSize: TEXTO.pie,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    salidas: { fontSize: TEXTO.micro, color: colors.textTertiary },
    boton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ESPACIO.sm,
      paddingVertical: ESPACIO.md,
      paddingHorizontal: ESPACIO.xxl,
      borderRadius: RADIO.pill,
      marginTop: ESPACIO.sm,
    },
    botonPrincipal: { backgroundColor: colors.secondaryAccent },
    botonSecundario: {
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
    },
    botonTexto: {
      fontSize: TEXTO.cuerpo,
      fontWeight: PESO.fuerte,
      color: colors.surface,
    },
    botonTextoPrincipal: { color: colors.screenBackground },
    salir: { paddingVertical: ESPACIO.sm },
    salirTexto: { fontSize: TEXTO.pie, color: colors.textSecondary },
  });
