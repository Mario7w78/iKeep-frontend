import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Ocurrencia, aFechaLocal } from '../../../../infrastructure/api/CalendarApiService';
import { EventoImportado } from '../../../../infrastructure/api/GoogleCalendarApiService';
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
  /** Canceladas de la sesión: filas con acción Restaurar (D3b). */
  canceladasEnSesion?: Ocurrencia[];
  /**
   * Eventos importados de Google Calendar, ya expandidos por día.
   *
   * Opcional y aditivo: sin la prop la cuadrícula no cambia NADA. Con ella,
   * los eventos se dibujan con su propio punto y en una sección separada,
   * siempre de solo lectura — nunca alimentan flujos de edición.
   */
  importadosPorDia?: Record<string, EventoImportado[]>;
  onMover?: (activityId: string, desde: string) => void;
  onCancelar?: (activityId: string, fecha: string) => void;
  onRestaurar?: (activityId: string, fecha: string) => void;
  /**
   * Modo mes a pantalla completa: la grilla se estira para ocupar el alto
   * disponible y el detalle queda acotado (~45%). Sin esto (modo anual) se
   * conservan las celdas cuadradas compactas dentro del scroll anual.
   */
  expandir?: boolean;
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
  canceladasEnSesion = [],
  importadosPorDia,
  onMover,
  onCancelar,
  onRestaurar,
  expandir = false,
}) => {
  const { colors, comfyColors } = useTheme();
  const styles = useMemo(() => createStyles(colors, comfyColors), [colors, comfyColors]);

  const celdas = useMemo(() => celdasDelMes(mesVisible), [mesVisible]);
  const hoy = aFechaLocal(new Date());
  const mesActual = mesVisible.getMonth();

  const delDia = diaSeleccionado ? porDia[diaSeleccionado] ?? [] : [];
  const importadosDelDia = diaSeleccionado
    ? importadosPorDia?.[diaSeleccionado] ?? []
    : [];
  const canceladasDelDia = diaSeleccionado
    ? canceladasEnSesion.filter((o) => o.fecha === diaSeleccionado)
    : [];

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
        <View style={[styles.cuadricula, expandir && styles.cuadriculaExpandida]}>
          {celdas.map((d) => {
            const clave = aFechaLocal(d);
            const ocurrencias = porDia[clave] ?? [];
            // Los importados usan lo que queda de la fila de puntos: nunca
            // le roban lugar a una actividad propia.
            const importados = importadosPorDia?.[clave] ?? [];
            const cupoImportados = Math.max(0, MAXIMO_PUNTOS - Math.min(ocurrencias.length, MAXIMO_PUNTOS));
            const esDeOtroMes = d.getMonth() !== mesActual;
            const esHoy = clave === hoy;
            const elegido = clave === diaSeleccionado;

            return (
              <TouchableOpacity
                key={clave}
                testID={`dia-${clave}`}
                style={[styles.celda, expandir ? styles.celdaExpandida : styles.celdaCompacta, elegido && styles.celdaElegida]}
                onPress={() => onSeleccionarDia(clave)}
                accessibilityLabel={`${d.getDate()} de ${MESES[d.getMonth()]}, ${ocurrencias.length} actividades${importados.length > 0 ? `, ${importados.length} de google` : ''}`}
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
                  {/* Punto distinto para lo importado: mismo tamaño, otro
                      color. Que se note que NO es una actividad propia. */}
                  {importados.slice(0, cupoImportados).map((e) => (
                    <View
                      key={e.id}
                      testID={`punto-importado-${e.id}-${clave}`}
                      style={[
                        styles.punto,
                        styles.puntoImportado,
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
        <ScrollView
          style={[styles.detalle, expandir && styles.detalleExpandido]}
          testID="dia-detalle"
        >
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

          {delDia.length === 0 && importadosDelDia.length === 0 && canceladasDelDia.length === 0 ? (
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

                  {/* Acciones a la vista (D3): la lista del día es corta y
                      las etiquetas dicen lo que hacen sin adivinar. */}
                  {(onMover || onCancelar) && (
                    <View style={styles.acciones}>
                      {onMover && (
                        <TouchableOpacity
                          testID={`mover-${o.actividad.id}`}
                          style={styles.botonAccion}
                          onPress={() => onMover(o.actividad.id, diaSeleccionado!)}
                          accessibilityLabel={`Mover ${o.actividad.title} del ${diaSeleccionado}`}
                          hitSlop={8}
                        >
                          <Ionicons name="move-outline" size={13} color={colors.secondaryAccent} />
                          <Text style={styles.botonAccionTexto}>Mover</Text>
                        </TouchableOpacity>
                      )}
                      {onCancelar && (
                        <TouchableOpacity
                          testID={`cancelar-${o.actividad.id}`}
                          style={styles.botonAccion}
                          onPress={() => onCancelar(o.actividad.id, diaSeleccionado!)}
                          accessibilityLabel={`Cancelar ${o.actividad.title} del ${diaSeleccionado}`}
                          hitSlop={8}
                        >
                          <Ionicons name="close-circle-outline" size={13} color={colors.warning} />
                          <Text style={styles.botonAccionTexto}>Cancelar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
            ))
          )}

          {importadosDelDia.length > 0 && (
            <View style={styles.seccionImportados} testID="seccion-importados">
              <Text style={styles.tituloImportados}>De Google Calendar</Text>
              {/* Filas planas, sin TouchableOpacity y sin acciones: lo
                  importado se LEE, nunca se edita (spec external-events-ui).
                  El titulo va tal cual llegó de Google. */}
              {importadosDelDia.map((e) => (
                <View key={e.id} testID={`importado-${e.id}`} style={styles.item}>
                  <View style={[styles.itemPunto, styles.puntoImportado]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitulo}>{e.titulo}</Text>
                    {!e.todoElDia && (
                      <Text style={styles.itemNota}>
                        {new Date(e.inicio).toLocaleTimeString('es', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {canceladasDelDia.length > 0 && (
            <View style={styles.seccionCanceladas} testID="seccion-canceladas">
              <Text style={styles.tituloCanceladas}>Canceladas</Text>
              {canceladasDelDia.map((o, i) => (
                <View key={`cancelada-${o.actividad.id}-${i}`} style={styles.item}>
                  <View style={[styles.itemPunto, styles.puntoCancelada]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitulo, styles.itemTituloCancelado]}>
                      {o.actividad.title ?? 'Actividad'}
                    </Text>

                    {/* El servidor descarta las canceladas: esta fila solo
                        existe en sesion, y Restaurar borra la excepcion. */}
                    {onRestaurar && (
                      <View style={styles.acciones}>
                        <TouchableOpacity
                          testID={`restaurar-${o.actividad.id}`}
                          style={styles.botonAccion}
                          onPress={() => onRestaurar(o.actividad.id, o.fecha)}
                          accessibilityLabel={`Restaurar ${o.actividad.title ?? 'actividad'} del ${o.fecha}`}
                          hitSlop={8}
                        >
                          <Ionicons name="refresh-outline" size={13} color={colors.secondaryAccent} />
                          <Text style={styles.botonAccionTexto}>Restaurar</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors, comfyColors: ReturnType<typeof useTheme>['comfyColors']) =>
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
    // Modo mes a pantalla completa: la grilla se estira con flexGrow para
    // llenar el alto disponible; en modo anual se conserva el tamaño natural.
    cuadriculaExpandida: { flex: 1, alignContent: 'stretch' },
    celda: {
      width: `${100 / 7}%`,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      borderRadius: RADIO.md,
    },
    // Celdas cuadradas, solo en el modo compacto (anual / sin expandir).
    celdaCompacta: {
      aspectRatio: 1,
    },
    // En modo expandido el alto lo reparte la grilla, no la celda.
    celdaExpandida: {
      flexGrow: 1,
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
    // Lo importado viste de celeste: mismo tamaño que un punto propio pero
    // IMPOSIBLE de confundir con uno. El color viene del tema (skyBlue).
    puntoImportado: { backgroundColor: comfyColors.skyBlue },
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
    // En modo expandido el detalle no puede comerse la grilla: se acota.
    detalleExpandido: {
      flex: 0,
      maxHeight: '45%',
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
    acciones: { flexDirection: 'row', gap: ESPACIO.sm, marginTop: ESPACIO.xs },
    botonAccion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 3,
      paddingHorizontal: ESPACIO.sm,
      borderRadius: RADIO.pill,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
    },
    botonAccionTexto: {
      fontSize: TEXTO.micro,
      fontWeight: PESO.fuerte,
      color: colors.textSecondary,
    },
    seccionCanceladas: {
      marginTop: ESPACIO.md,
      paddingTop: ESPACIO.md,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
    },
    tituloCanceladas: {
      fontSize: TEXTO.pie,
      fontWeight: PESO.fuerte,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: ESPACIO.xs,
    },
    puntoCancelada: { backgroundColor: colors.textTertiary, opacity: 0.6 },
    itemTituloCancelado: { color: colors.textSecondary, textDecorationLine: 'line-through' },
    seccionImportados: {
      marginTop: ESPACIO.md,
      paddingTop: ESPACIO.md,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
    },
    tituloImportados: {
      fontSize: TEXTO.pie,
      fontWeight: PESO.fuerte,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: ESPACIO.xs,
    },
  });
