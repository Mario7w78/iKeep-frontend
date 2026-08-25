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

interface Props {
  visible: boolean;
  progreso: ProgresoDelDia;
  racha: Racha;
  /** Precalculada por quien la usa: acá no se derivan reglas de negocio. */
  areaDestacada: AreaDeVida | null;
  respuestaCierre: RespuestaDeCierre;
  onDismiss: () => void;
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

export const DayRecap: React.FC<Props> = ({
  visible,
  progreso,
  racha,
  areaDestacada,
  respuestaCierre,
  onDismiss,
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
    pie: {
      fontSize: TEXTO.micro,
      color: colors.textTertiary,
      marginTop: ESPACIO.sm,
    },
  });
