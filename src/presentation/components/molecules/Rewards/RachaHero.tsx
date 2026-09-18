import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ThemeColors, useTheme } from '../../theme/colors';
import { ESPACIO, PESO, RADIO, TEXTO } from '../../theme/tokens';
import { StreakFlame } from '../../atoms/Rewards/StreakFlame';
import { RachaSemanal } from '../../atoms/Rewards/RachaSemanal';
import { Sapo } from '../../atoms/Mascot/Sapo';

/**
 * El héroe de la racha, a la Duolingo.
 *
 * La racha dejó de ser un número y se volvió un hito que celebrar: el número
 * en fuego, la mascota saltando con su mochila de hito, fuegos laterales
 * latiendo y una barra de oro que dice cuánto falta para el siguiente
 * «COMPONENTE CRÍTICO». La cadena semanal sigue ahí abajo: la racha se
 * sostiene día a día, no se mira.
 *
 * El fondo es un degradado oscuro de baja saturación con dos manchas suaves
 * (oro y esmeralda) atrás: profundidad sin competir con lo que importa.
 */

/** Los hitos que la racha celebra, en días. */
const HITOS = [3, 10, 15];

/** Oro del hito: el color de las medallas y del fuego de la racha larga. */
const ORO = '#F5C249';
const ORO_CLARO = '#FFE08A';
const FUEGO = '#FF8C42';

interface Props {
  actual: number;
  mejor: number;
  enRiesgo: boolean;
  /** Días con algo hecho, para la cadena semanal. */
  hechos: string[];
  /** Qué artboard de la mascota le toca (`useTipoSapo`). */
  tipoSapo: 0 | 1 | 2;
  /** Cuánto del día queda (0..1): el anillo de la llama en riesgo. */
  restaDelDia?: number;
}

interface Hito {
  fraccion: number;
  restante: number;
  proximo: number | null;
}

function siguienteHito(actual: number): Hito {
  const proximo = HITOS.find((h) => h > actual) ?? null;
  if (proximo === null) {
    return { fraccion: 1, restante: 0, proximo: null };
  }
  const previo = [...HITOS].reverse().find((h) => h <= actual) ?? 0;
  return { fraccion: (actual - previo) / (proximo - previo), restante: proximo - actual, proximo };
}

/** La llama lateral que late alrededor del sapo. Pura decoración. */
function Fuego({ testID, delay = 0 }: { testID: string; delay?: number }) {
  const escala = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(escala, { toValue: 1.28, duration: 640, useNativeDriver: true }),
        Animated.timing(escala, { toValue: 1, duration: 640, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [escala, delay]);

  return (
    <View style={estiloFuego.contenedor} testID={testID}>
      <Ionicons name="flame" size={34} color={ORO} style={estiloFuego.detras} />
      <Animated.View style={{ transform: [{ scale: escala }] }}>
        <Ionicons name="flame" size={28} color={FUEGO} />
      </Animated.View>
    </View>
  );
}

const estiloFuego = StyleSheet.create({
  contenedor: {
    position: 'relative',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detras: {
    position: 'absolute',
    opacity: 0.35,
  },
});

export const RachaHero: React.FC<Props> = ({
  actual,
  mejor,
  enRiesgo,
  hechos,
  tipoSapo,
  restaDelDia,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const etiqueta = actual === 1 ? 'día seguido' : 'días seguidos';
  const hito = useMemo(() => siguienteHito(actual), [actual]);
  const textoRacha = actual === 1 ? 'día' : 'días';

  return (
    <View style={styles.tarjeta} testID="racha-duolingo">
      <LinearGradient
        colors={['#3A3C52', '#2C2E3C']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.manchaOro} />
      <View style={styles.manchaEsmeralda} />

      <Text style={styles.banner}>Racha de {actual} {textoRacha}</Text>

      <StreakFlame
        dias={actual}
        enRiesgo={enRiesgo}
        restaDelDia={enRiesgo ? restaDelDia : undefined}
        size={84}
        etiqueta={etiqueta}
      />

      <View style={styles.filaSapo}>
        <Fuego testID="fuego-izquierdo" />
        <View style={styles.nidoSapo}>
          <Sapo estado="celebrating" size={90} tipoSapo={tipoSapo} />
          <View style={styles.mochila} testID="mochila-hito">
            <Text style={styles.mochilaTexto}>{actual}</Text>
          </View>
        </View>
        <Fuego delay={360} testID="fuego-derecho" />
      </View>

      {enRiesgo && (
        <View style={styles.riesgo}>
          <Ionicons name="flame" size={14} color={ORO} />
          <Text style={styles.riesgoTexto}>Completa algo hoy para mantener tu racha.</Text>
        </View>
      )}

      <Text style={styles.celebracion}>
        ¡Increíble! Has alcanzado un hito crítico de consistencia.
      </Text>

      <View style={styles.hitoBloque} testID="bloque-hito">
        <Text style={styles.hitoEtiqueta}>COMPONENTE CRÍTICO</Text>
        <View style={styles.carrilHito}>
          <View style={[styles.rellenoHito, { width: `${Math.round(hito.fraccion * 100)}%` }]} />
        </View>
        <Text style={styles.hitoTexto}>
          {hito.proximo === null
            ? 'Hito máximo alcanzado. Eres leyenda.'
            : `Faltan ${hito.restante} para el hito de ${hito.proximo}.`}
        </Text>
      </View>

      <RachaSemanal hechos={hechos} />

      {mejor > 0 && (
        <View style={styles.mejor}>
          <Ionicons name="trophy" size={14} color={ORO} />
          <Text style={styles.mejorNumero}>{mejor}</Text>
          <Text style={styles.mejorEtiqueta}>tu mejor racha</Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    tarjeta: {
      alignItems: 'center',
      gap: ESPACIO.lg,
      padding: ESPACIO.xl,
      borderRadius: RADIO.xl,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      overflow: 'hidden',
      backgroundColor: colors.cardBackground,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    manchaOro: {
      position: 'absolute',
      top: -70,
      right: -50,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: ORO,
      opacity: 0.07,
    },
    manchaEsmeralda: {
      position: 'absolute',
      bottom: -80,
      left: -60,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: colors.accent,
      opacity: 0.06,
    },
    banner: {
      fontSize: TEXTO.destacado,
      fontWeight: PESO.fuerte,
      letterSpacing: 1.2,
      color: ORO_CLARO,
      textTransform: 'uppercase',
      textAlign: 'center',
    },
    filaSapo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ESPACIO.lg,
      marginTop: ESPACIO.sm,
    },
    nidoSapo: {
      position: 'relative',
      alignItems: 'center',
    },
    mochila: {
      position: 'absolute',
      right: -6,
      top: 6,
      minWidth: 34,
      height: 34,
      paddingHorizontal: 7,
      borderRadius: RADIO.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ORO,
      borderWidth: 2,
      borderColor: ORO_CLARO,
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    mochilaTexto: {
      fontSize: TEXTO.destacado,
      fontWeight: PESO.maximo,
      color: '#6B4E0C',
    },
    riesgo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIO.xs,
      paddingVertical: ESPACIO.sm,
      paddingHorizontal: ESPACIO.md,
      borderRadius: RADIO.pill,
      backgroundColor: 'rgba(245, 194, 73, 0.12)',
      borderWidth: 1,
      borderColor: ORO,
    },
    riesgoTexto: {
      fontSize: TEXTO.pie,
      fontWeight: PESO.medio,
      color: ORO_CLARO,
    },
    celebracion: {
      fontSize: TEXTO.cuerpo,
      fontWeight: PESO.medio,
      color: colors.surface,
      textAlign: 'center',
      marginTop: -ESPACIO.sm,
    },
    hitoBloque: {
      alignSelf: 'stretch',
      gap: ESPACIO.sm,
      padding: ESPACIO.lg,
      borderRadius: RADIO.lg,
      backgroundColor: 'rgba(245, 194, 73, 0.10)',
      borderWidth: 1,
      borderColor: 'rgba(245, 194, 73, 0.45)',
    },
    hitoEtiqueta: {
      fontSize: TEXTO.micro,
      fontWeight: PESO.maximo,
      letterSpacing: 1.4,
      color: ORO,
      textAlign: 'center',
    },
    carrilHito: {
      height: 10,
      borderRadius: RADIO.pill,
      backgroundColor: '#20212C',
      overflow: 'hidden',
    },
    rellenoHito: {
      height: '100%',
      borderRadius: RADIO.pill,
      backgroundColor: ORO,
    },
    hitoTexto: {
      fontSize: TEXTO.pie,
      fontWeight: PESO.medio,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    mejor: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIO.xs,
      paddingVertical: ESPACIO.xs,
      paddingHorizontal: ESPACIO.md,
      borderRadius: RADIO.pill,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    mejorNumero: {
      fontSize: TEXTO.pie + 1,
      fontWeight: PESO.maximo,
      color: ORO,
    },
    mejorEtiqueta: {
      fontSize: TEXTO.pie,
      color: colors.textSecondary,
    },
  });