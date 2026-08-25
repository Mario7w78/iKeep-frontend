import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Ocurrencia, aFechaLocal } from '../../../../infrastructure/api/CalendarApiService';
import { ThemeColors, useTheme } from '../../theme/colors';
import { ESPACIO, PESO, RADIO, TEXTO } from '../../theme/tokens';
import { DIA_CORTO } from '../../../theme/copy';

interface Props {
  mesVisible: Date;
  porDia: Record<string, Ocurrencia[]>;
  cargando: boolean;
  error: string | null;
  diaSeleccionado: string | null;
  onSeleccionarDia: (fecha: string) => void;
  onCambiarMes: (delta: number) => void;
  onReintentar: () => void;
  /**
   * Crear una actividad puntual en el día elegido. Opcional para que las
   * pantallas que aún no lo cablean sigan compilando sin cambios.
   */
  onCrearEnDia?: (fecha: string) => void;
}

/**
 * El mes completo, con fechas reales.
 *
 * Hasta ahora el calendario mostraba una semana que se repetía: no había
 * forma de ver el 12 de noviembre ni de saber qué martes tenías libre. Esto
 * dibuja días concretos, con sus excepciones ya aplicadas por el servidor.
 *
 * La cuadrícula muestra los días de relleno del mes anterior y el siguiente
 * porque las semanas no empiezan y terminan con el mes — y esos días también
 * tienen actividades.
 */

const SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

/** Cuántos puntos caben en una celda antes de que se lean como una mancha. */
const MAXIMO_PUNTOS = 3;

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function celdasDelMes(referencia: Date): Date[] {
  const primero = new Date(referencia.getFullYear(), referencia.getMonth(), 1);
  const desplazamiento = (primero.getDay() + 6) % 7;
  const inicio = new Date(primero);
  inicio.setDate(primero.getDate() - desplazamiento);

  const ultimo = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0);
  const total = desplazamiento + ultimo.getDate();
  const semanas = Math.ceil(total / 7);

  return Array.from({ length: semanas * 7 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    return d;
  });
}

export const MonthGrid: React.FC<Props> = ({
  mesVisible,
  porDia,
  cargando,
  error,
  diaSeleccionado,
  onSeleccionarDia,
  onCambiarMes,
  onReintentar,
  onCrearEnDia,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const celdas = useMemo(() => celdasDelMes(mesVisible), [mesVisible]);
  const hoy = aFechaLocal(new Date());
  const mesActual = mesVisible.getMonth();

  const delDia = diaSeleccionado ? porDia[diaSeleccionado] ?? [] : [];

  return (
    <View style={styles.contenedor} testID="month-grid">
      <View style={styles.encabezado}>
        <TouchableOpacity
          testID="mes-anterior"
          onPress={() => onCambiarMes(-1)}
          hitSlop={14}
          accessibilityLabel="Mes anterior"
        >
          <Ionicons name="chevron-back" size={22} color={colors.iconPrimary} />
        </TouchableOpacity>

        <Text style={styles.titulo}>
          {MESES[mesActual]} {mesVisible.getFullYear()}
        </Text>

        <TouchableOpacity
          testID="mes-siguiente"
          onPress={() => onCambiarMes(1)}
          hitSlop={14}
          accessibilityLabel="Mes siguiente"
        >
          <Ionicons name="chevron-forward" size={22} color={colors.iconPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filaDias}>
        {SEMANA.map((d) => (
          <Text key={d} style={styles.nombreDia}>
            {DIA_CORTO[d]}
          </Text>
        ))}
      </View>

      {error ? (
        <View style={styles.aviso} testID="month-error">
          <Text style={styles.avisoTexto}>{error}</Text>
          <TouchableOpacity onPress={onReintentar} style={styles.botonReintentar}>
            <Text style={styles.botonReintentarTexto}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cuadricula}>
          {celdas.map((d) => {
            const clave = aFechaLocal(d);
            const ocurrencias = porDia[clave] ?? [];
            const esDeOtroMes = d.getMonth() !== mesActual;
            const esHoy = clave === hoy;
            const elegido = clave === diaSeleccionado;

            return (
              <TouchableOpacity
                key={clave}
                testID={`dia-${clave}`}
                style={[styles.celda, elegido && styles.celdaElegida]}
                onPress={() => onSeleccionarDia(clave)}
                accessibilityLabel={`${d.getDate()} de ${MESES[d.getMonth()]}, ${ocurrencias.length} actividades`}
              >
                <Text
                  style={[
                    styles.numero,
                    esDeOtroMes && styles.numeroOtroMes,
                    esHoy && styles.numeroHoy,
                  ]}
                >
                  {d.getDate()}
                </Text>

                {/* Puntos y no números: a esta escala la cantidad exacta no
                    se lee, y lo que importa es si el día está cargado. */}
                <View style={styles.puntos}>
                  {ocurrencias.slice(0, MAXIMO_PUNTOS).map((o, i) => (
                    <View
                      key={i}
                      style={[
                        styles.punto,
                        o.esUnica && styles.puntoUnico,
                        esDeOtroMes && styles.puntoOtroMes,
                      ]}
                    />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {cargando && (
        <Text style={styles.cargando} testID="month-loading">
          Cargando…
        </Text>
      )}

      {diaSeleccionado && !error && (
        <ScrollView style={styles.detalle} testID="dia-detalle">
          <View style={styles.detalleEncabezado}>
            <Text style={styles.detalleTitulo}>
              {Number(diaSeleccionado.slice(8))} de {MESES[Number(diaSeleccionado.slice(5, 7)) - 1]}
            </Text>

            {/* Crear justo donde se esta mirando: la fecha viaja como texto
                local YYYY-MM-DD y el wizard la muestra, no la vuelve a
                preguntar. */}
            {onCrearEnDia && (
              <TouchableOpacity
                testID="crear-en-dia"
                style={styles.botonCrear}
                onPress={() => onCrearEnDia(diaSeleccionado)}
                accessibilityLabel={`Crear actividad el ${diaSeleccionado}`}
                hitSlop={10}
              >
                <Ionicons name="add" size={20} color={colors.iconPrimary} />
              </TouchableOpacity>
            )}
          </View>

          {delDia.length === 0 ? (
            <Text style={styles.detalleVacio}>Nada agendado. Día libre.</Text>
          ) : (
            delDia.map((o, i) => (
              <View key={`${o.actividad.id}-${i}`} style={styles.item}>
                <View style={[styles.itemPunto, o.esUnica && styles.puntoUnico]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitulo}>{o.actividad.title}</Text>
                  {o.movidaDesde && (
                    <Text style={styles.itemNota}>
                      Reprogramada del {Number(o.movidaDesde.slice(8))} de{' '}
                      {MESES[Number(o.movidaDesde.slice(5, 7)) - 1]}
                    </Text>
                  )}
                  {o.esUnica && !o.movidaDesde && (
                    <Text style={styles.itemNota}>Solo este día</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    contenedor: { flex: 1, paddingHorizontal: ESPACIO.md },
    encabezado: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: ESPACIO.md,
    },
    titulo: {
      fontSize: TEXTO.destacado,
      fontWeight: PESO.maximo,
      color: colors.surface,
      textTransform: 'capitalize',
    },
    filaDias: { flexDirection: 'row', paddingBottom: ESPACIO.xs },
    nombreDia: {
      flex: 1,
      textAlign: 'center',
      fontSize: TEXTO.micro,
      fontWeight: PESO.fuerte,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    cuadricula: { flexDirection: 'row', flexWrap: 'wrap' },
    celda: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      borderRadius: RADIO.md,
    },
    celdaElegida: {
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.secondaryAccent,
    },
    numero: { fontSize: TEXTO.pie, fontWeight: PESO.medio, color: colors.surface },
    numeroOtroMes: { color: colors.textTertiary },
    numeroHoy: { color: colors.secondaryAccent, fontWeight: PESO.maximo },
    puntos: { flexDirection: 'row', gap: 3, height: 5 },
    punto: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.secondaryAccent,
    },
    // Los eventos únicos —un parcial— usan el color de aviso: son los que el
    // usuario no puede permitirse pasar por alto.
    puntoUnico: { backgroundColor: colors.warning },
    puntoOtroMes: { opacity: 0.35 },
    cargando: {
      textAlign: 'center',
      paddingVertical: ESPACIO.sm,
      fontSize: TEXTO.micro,
      color: colors.textSecondary,
    },
    aviso: { alignItems: 'center', gap: ESPACIO.md, paddingVertical: ESPACIO.xxxl },
    avisoTexto: { color: colors.textSecondary, textAlign: 'center', fontSize: TEXTO.pie },
    botonReintentar: {
      paddingVertical: ESPACIO.sm,
      paddingHorizontal: ESPACIO.lg,
      borderRadius: RADIO.pill,
      borderWidth: 1,
      borderColor: colors.secondaryAccent,
    },
    botonReintentarTexto: {
      color: colors.secondaryAccent,
      fontWeight: PESO.fuerte,
      fontSize: TEXTO.pie,
    },
    detalle: {
      flex: 1,
      marginTop: ESPACIO.md,
      paddingTop: ESPACIO.md,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
    },
    detalleEncabezado: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: ESPACIO.sm,
    },
    botonCrear: {
      width: 30,
      height: 30,
      borderRadius: RADIO.pill,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detalleTitulo: {
      fontSize: TEXTO.cuerpo,
      fontWeight: PESO.fuerte,
      color: colors.surface,
      marginBottom: ESPACIO.sm,
      textTransform: 'capitalize',
    },
    detalleVacio: { color: colors.textSecondary, fontSize: TEXTO.pie },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIO.md,
      paddingVertical: ESPACIO.sm,
    },
    itemPunto: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.secondaryAccent,
    },
    itemTitulo: { fontSize: TEXTO.pie, fontWeight: PESO.medio, color: colors.surface },
    itemNota: { fontSize: TEXTO.micro, color: colors.textSecondary, marginTop: 1 },
  });
