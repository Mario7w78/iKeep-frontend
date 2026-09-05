import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  ProgresoDelDia,
  Racha,
  RespuestaDeCierre,
} from '../../../../infrastructure/api/RewardsApiService';
import { AREAS, AreaDeVida } from '../../../../domain/entities/lifeArea';
import { ThemeColors, useTheme } from '../../theme/colors';
import { ESPACIO, PESO, RADIO, TEXTO } from '../../theme/tokens';
import { Sapo } from '../../atoms/Mascot/Sapo';
import { EnergyLevelConfig } from '../../../screens/Home/HomeView.utils';

interface Props {
  visible: boolean;
  progreso: ProgresoDelDia;
  racha: Racha;
  /** Precalculada por quien la usa: acá no se derivan reglas de negocio. */
  areaDestacada: AreaDeVida | null;
  respuestaCierre: RespuestaDeCierre;
  onDismiss: () => void;
  /** Hora de inicio del día (minutos desde medianoche) para mostrar en el resumen. */
  startHour: number;
  /** Energía seleccionada del día para el resumen de Sapo. */
  selectedEnergy: EnergyLevelConfig;
}

/**
 * El resumen del día que recién se cerró.
 *
 * El cierre pregunta; esto cuenta lo que quedó. No es una tarea pendiente
 * más: aparece UNA vez, después de cerrar, y se va con un toque — sin
 * temporizador que le corra al reloj a quien está leyendo.
 *
 * Es hermano de DayClose y como él no toca ningún store ni red: todo llega
 * por props desde la foto que dejó `cerrar()`. La capa es un Pressable, no
 * un Modal — Home sigue visible detrás y nada queda bloqueado después.
 */

/**
 * Genera el mensaje motivador de Sapo según el resultado del día.
 */
const mensajeSapo = (
  completadas: number,
  total: number,
  rachaActual: number,
  energiaLabel: string
): string => {
  if (total === 0) {
    return 'Mañana es una página en blanco. ¡A escribirla!';
  }
  if (completadas === total) {
    if (completadas >= 7) {
      return '¡Imparable! La constancia es tu superpoder. 💪';
    }
    return '¡Día perfecto! El hábito se hace fuerte. ✨';
  }
  if (completadas > 0) {
    return 'Progreso, no perfección. Mañana seguimos. 🌱';
  }
  return `Con energía ${energiaLabel.toLowerCase()}, mañana lo das todo. 🌙`;
};

export const DayRecap: React.FC<Props> = ({
  visible,
  progreso,
  racha,
  areaDestacada,
  respuestaCierre,
  onDismiss,
  startHour,
  selectedEnergy,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!visible) return null;

  const dificil = respuestaCierre === 'dificil';
  const ceroHechas =
    !dificil && progreso.total > 0 && progreso.completadas === 0;
  const tituloArea = areaDestacada
    ? AREAS.find((a) => a.valor === areaDestacada)?.titulo
    : null;

  return (
    <Pressable
      style={styles.capa}
      onPress={onDismiss}
      testID="resumen-post-cierre"
      accessibilityRole="button"
      accessibilityLabel="Resumen del día. Toca para cerrar."
    >
      <View style={styles.tarjeta}>
        {dificil ? (
          <>
            {/* Sin cifras: en el día difícil los números solo sirven para
                juzgar, y juzgar es justo lo que este camino no hace. */}
            <Ionicons name="cloudy-outline" size={28} color={colors.surface} />
            <Text style={styles.titulo}>
              Fue un día difícil, y lo cerraste igual.
            </Text>
            <Text style={styles.bajada}>Eso también cuenta.</Text>
            {racha.actual > 0 && (
              <Text style={styles.nota}>Y tu racha sigue contigo.</Text>
            )}
          </>
        ) : ceroHechas ? (
          <>
            {/* Sin nada hecho el titular numérico sería un reproche con
                dígitos. Se dice lo mismo de otro modo y la estructura no se
                mueve: el layout no puede delatar a nadie. */}
            <Ionicons name="moon-outline" size={28} color={colors.surface} />
            <Text style={styles.titulo}>El día quedó cerrado.</Text>
            <Text style={styles.bajada}>
              Hoy no se marcó nada, y mañana empieza de nuevo.
            </Text>
            {racha.actual > 0 && (
              <Text style={styles.nota}>Tu racha te espera.</Text>
            )}
          </>
        ) : (
          <>
            <Ionicons
              name="checkmark-circle"
              size={28}
              color={colors.secondaryAccent}
            />
            <Text testID="recap-conteo" style={styles.titulo}>
              Hiciste {progreso.completadas} de {progreso.total}
            </Text>
            {racha.actual > 0 && (
              <Text testID="recap-racha" style={styles.bajada}>
                Racha de {racha.actual} días
              </Text>
            )}
            {tituloArea && (
              <View testID="recap-area" style={styles.area}>
                <Text style={styles.areaTitulo}>{tituloArea}</Text>
                <Text style={styles.bajada}>Lo que más moviste hoy</Text>
              </View>
            )}
          </>
        )}

        {/* Resumen de Sapo con datos del día y mensaje motivador */}
        <View style={styles.sapoResumen}>
          <Sapo
            estado={progreso.completadas === progreso.total ? "celebrating" : progreso.completadas > 0 ? "happy" : "thinking"}
            size={64}
            tipoSapo={0}
          />
          <Text style={styles.sapoTitulo}>Resumen del día</Text>
          <Text style={styles.sapoTexto}>
            {progreso.total > 0
              ? `Completaste {progreso.completadas} de {progreso.total} actividades.`
              : 'Hoy no tuviste actividades programadas.'}
          </Text>
          <View style={styles.sapoDetalles}>
            <Text style={styles.sapoDetalle}>
              <Ionicons name="flash-outline" size={16} color={colors.secondaryAccent} />
              Energía: {selectedEnergy.label}
            </Text>
            <Text style={styles.sapoDetalle}>
              <Ionicons name="time-outline" size={16} color={colors.secondaryAccent} />
              Mañana empieza a las {Math.floor(startHour / 60)}
                .{String(startHour % 60).padStart(2, '0')}
            </Text>
            {racha.actual > 0 && (
              <Text style={styles.sapoDetalle}>
                <Ionicons name="flame-outline" size={16} color={colors.warning} />
                Racha de {racha.actual} días
              </Text>
            )}
          </View>
          <Text style={styles.sapoMensaje}>
            {mensajeSapo(progreso.completadas, progreso.total, racha.actual, selectedEnergy.label)}
          </Text>
        </View>

        <Text style={styles.pie}>Toca en cualquier lado para seguir</Text>
      </View>
    </Pressable>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    // Debajo de Celebration (zIndex 50): si hay confeti, el confeti gana.
    capa: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(10, 11, 18, 0.62)',
      zIndex: 40,
    },
    tarjeta: {
      width: '86%',
      maxWidth: 340,
      alignItems: 'center',
      gap: ESPACIO.sm,
      paddingVertical: ESPACIO.xxl,
      paddingHorizontal: ESPACIO.lg,
      borderRadius: RADIO.xl,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.screenBackground,
    },
    titulo: {
      fontSize: TEXTO.titulo,
      fontWeight: PESO.maximo,
      color: colors.surface,
      textAlign: 'center',
    },
    bajada: {
      fontSize: TEXTO.cuerpo,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    nota: {
      fontSize: TEXTO.pie,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    area: {
      alignItems: 'center',
      gap: ESPACIO.xs,
      marginTop: ESPACIO.xs,
      paddingTop: ESPACIO.md,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      minWidth: '100%',
    },
    areaTitulo: {
      fontSize: TEXTO.destacado,
      fontWeight: PESO.fuerte,
      color: colors.secondaryAccent,
    },
    sapoResumen: {
      alignItems: 'center',
      gap: ESPACIO.xs,
      marginTop: ESPACIO.md,
      paddingTop: ESPACIO.md,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      minWidth: '100%',
    },
    sapoTitulo: {
      fontSize: TEXTO.destacado,
      fontWeight: PESO.fuerte,
      color: colors.secondaryAccent,
    },
    sapoTexto: {
      fontSize: TEXTO.cuerpo,
      color: colors.surface,
      textAlign: 'center',
    },
    sapoDetalles: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: ESPACIO.md,
      marginTop: ESPACIO.xs,
      marginBottom: ESPACIO.xs,
    },
    sapoDetalle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIO.xs,
      fontSize: TEXTO.pie,
      color: colors.textSecondary,
    },
    sapoMensaje: {
      fontSize: TEXTO.cuerpo,
      color: colors.surface,
      textAlign: 'center',
      fontStyle: 'italic',
      marginTop: ESPACIO.xs,
    },
    pie: {
      fontSize: TEXTO.micro,
      color: colors.textTertiary,
      marginTop: ESPACIO.sm,
    },
  });