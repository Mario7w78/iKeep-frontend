import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ThemeColors, comfyColors, useTheme } from '../../theme/colors';
import { PESO, RADIO, TEXTO } from '../../theme/tokens';

/** Iniciales en español, indexadas por `getDay()` (0 = domingo). */
const INICIALES = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

/** Clave local (YYYY-MM-DD), igual que `fechaLocal` del servicio de logros. */
function claveLocal(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

interface Props {
  /** Días con algo hecho, en formato `YYYY-MM-DD`. */
  hechos: string[];
  /** Para pruebas: el "hoy" desde el que se calcula la semana. */
  hoy?: Date;
}

/**
 * La cadena de la semana actual, como la de Duolingo.
 *
 * Cada círculo es un día de la semana: lleno si hubo algo hecho, con anillo
 * si es hoy, apagado si todavía no llega. La racha leída así no es un número
 * que se pierde sino una fila de días que se sostiene.
 */
export const RachaSemanal: React.FC<Props> = ({ hechos, hoy = new Date() }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const dias = useMemo(() => {
    const inicioDeHoy = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate()
    ).getTime();
    const hoyClave = claveLocal(hoy);

    return semanaDe(hoy).map((d) => {
      const clave = claveLocal(d);
      return {
        clave,
        inicial: INICIALES[d.getDay()],
        hecho: hechos.includes(clave),
        esHoy: clave === hoyClave,
        futuro: d.getTime() > inicioDeHoy,
      };
    });
  }, [hechos, hoy]);

  return (
    <View style={styles.cadena} testID="racha-cadena">
      {dias.map((d) => (
        <View
          key={d.clave}
          testID={`racha-dia-${d.clave}`}
          style={[
            styles.celda,
            d.hecho && styles.celdaHecha,
            d.esHoy && styles.celdaHoy,
            d.futuro && styles.celdaFuturo,
          ]}
        >
          <Text
            style={[
              styles.inicial,
              d.hecho && styles.inicialHecha,
              d.futuro && styles.inicialFuturo,
            ]}
          >
            {d.inicial}
          </Text>
        </View>
      ))}
    </View>
  );
};

/** Los siete días de la semana a la que pertenece `hoy`, de lunes a domingo. */
function semanaDe(hoy: Date): Date[] {
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d;
  });
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    cadena: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      alignSelf: 'stretch',
    },
    celda: {
      width: 30,
      height: 30,
      borderRadius: RADIO.pill,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.cardBackground,
    },
    celdaHecha: {
      backgroundColor: colors.warning,
      borderColor: colors.warning,
    },
    // Anillo alrededor del día de hoy, esté o no completado: es el día que
    // decide si la fila se mantiene.
    celdaHoy: {
      borderWidth: 2,
      borderColor: comfyColors.orange,
    },
    celdaFuturo: {
      opacity: 0.3,
    },
    inicial: {
      fontSize: TEXTO.pie,
      fontWeight: PESO.fuerte,
      color: colors.textTertiary,
    },
    inicialHecha: {
      color: colors.screenBackground,
    },
    inicialFuturo: {
      color: colors.textSecondary,
    },
  });