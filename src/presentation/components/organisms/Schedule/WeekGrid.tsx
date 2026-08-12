import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Schedule, ScheduledActivity } from '../../../../domain/entities/Schedule';
import { ThemeColors, useTheme } from '../../theme/colors';
import { ESPACIO, PESO, RADIO, TEXTO } from '../../theme/tokens';
import { DAYS_ORDER, DAYS_SHORT, hhmmToMinutes } from '../../../utils/scheduleUtils';

interface Props {
  schedule: Schedule | null;
  startHour: number;
  endHour: number;
}

/**
 * La semana entera, para mirarla de una y para la foto.
 *
 * Girar el teléfono ya ocultaba la barra de tabs —el navegador tiene un
 * comentario diciendo que acá se mostraba la semana completa— pero esa vista
 * no existía: seguía viéndose un día por vez.
 *
 * Está pensada para el screenshot, y por eso no lleva nada personal encima:
 * ni nombre, ni racha, ni progreso. Lo que se comparte es el horario, y lo
 * que no está en pantalla no se puede filtrar por accidente.
 */

/** Más bajo que en la vista de un día: entran siete columnas y la pantalla es corta. */
const ALTO_HORA = 38;
const ANCHO_HORAS = 38;

const COLORES = [
  { fondo: '#221A3D', borde: '#5D4BB3', texto: '#DDD6FF' },
  { fondo: '#162A23', borde: '#3C8D70', texto: '#C8F2E2' },
  { fondo: '#33240F', borde: '#A86A1F', texto: '#FFE3B8' },
  { fondo: '#351D18', borde: '#A65542', texto: '#FFD5CB' },
  { fondo: '#1D2B3A', borde: '#4A8DB5', texto: '#C5E4F7' },
  { fondo: '#2A1D34', borde: '#915EB5', texto: '#E4CEF7' },
];

/** El color sale del nombre, no del orden: así una actividad no cambia de color al reordenarse. */
function colorDe(nombre: string) {
  let suma = 0;
  for (let i = 0; i < nombre.length; i++) suma += nombre.charCodeAt(i);
  return COLORES[suma % COLORES.length];
}

export const WeekGrid: React.FC<Props> = ({ schedule, startHour, endHour }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const cruzaMedianoche = endHour <= startHour;
  const primeraHora = Math.floor(startHour / 60);
  const ultimaHora = Math.ceil((cruzaMedianoche ? endHour + 1440 : endHour) / 60);
  const horas = Array.from(
    { length: ultimaHora - primeraHora },
    (_, i) => primeraHora + i
  );
  const alto = horas.length * ALTO_HORA;

  const porDia = useMemo(
    () =>
      DAYS_ORDER.map((dia) => ({
        dia,
        items: schedule?.getItemsByDay(dia, startHour) ?? [],
      })),
    [schedule, startHour]
  );

  return (
    <View style={styles.contenedor} testID="week-grid">
      <View style={styles.encabezado}>
        <View style={{ width: ANCHO_HORAS }} />
        {porDia.map(({ dia }) => (
          <View key={dia} style={styles.columnaEncabezado}>
            <Text style={styles.diaTexto}>{DAYS_SHORT[dia]}</Text>
          </View>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.cuerpo, { height: alto }]}>
          <View style={{ width: ANCHO_HORAS }}>
            {horas.map((hora) => (
              <View key={hora} style={[styles.celdaHora, { height: ALTO_HORA }]}>
                <Text style={styles.horaTexto}>{String(hora % 24).padStart(2, '0')}</Text>
              </View>
            ))}
          </View>

          {porDia.map(({ dia, items }) => (
            <View key={dia} style={styles.columna}>
              {horas.map((hora) => (
                <View key={hora} style={[styles.lineaHora, { height: ALTO_HORA }]} />
              ))}

              {items.map((item: ScheduledActivity, indice: number) => {
                const nombre = item.activity?.title ?? item.nombre ?? 'Actividad';
                const desde = hhmmToMinutes(item.assignedStartTime);
                const hasta = hhmmToMinutes(item.assignedEndTime);
                const normalizado =
                  cruzaMedianoche && desde < startHour ? desde + 1440 : desde;
                const largo = Math.max(hasta - desde, 15);
                const color = colorDe(nombre);

                return (
                  <View
                    key={`${item.activity?.id ?? nombre}-${indice}`}
                    testID="week-grid-block"
                    style={[
                      styles.bloque,
                      {
                        top: ((normalizado - startHour) / 60) * ALTO_HORA,
                        height: (largo / 60) * ALTO_HORA,
                        backgroundColor: color.fondo,
                        borderColor: color.borde,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.bloqueTexto, { color: color.texto }]}
                      numberOfLines={2}
                    >
                      {nombre}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colors.screenBackground,
      paddingHorizontal: ESPACIO.sm,
      paddingTop: ESPACIO.sm,
    },
    encabezado: {
      flexDirection: 'row',
      paddingBottom: ESPACIO.xs,
    },
    columnaEncabezado: {
      flex: 1,
      alignItems: 'center',
    },
    diaTexto: {
      fontSize: TEXTO.micro,
      fontWeight: PESO.maximo,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    cuerpo: {
      flexDirection: 'row',
    },
    celdaHora: {
      alignItems: 'flex-end',
      paddingRight: ESPACIO.xs,
    },
    horaTexto: {
      fontSize: TEXTO.micro - 1,
      color: colors.textSecondary,
      // Alineado con la línea, no con la celda: si no, la hora parece
      // pertenecer al tramo anterior.
      marginTop: -6,
    },
    columna: {
      flex: 1,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: colors.cardBorder,
    },
    lineaHora: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.cardBorder,
    },
    bloque: {
      position: 'absolute',
      left: 1,
      right: 1,
      borderRadius: RADIO.sm - 2,
      borderLeftWidth: 3,
      paddingHorizontal: 3,
      paddingVertical: 1,
      overflow: 'hidden',
    },
    bloqueTexto: {
      fontSize: TEXTO.micro - 2,
      fontWeight: PESO.medio,
      lineHeight: 11,
    },
  });
