import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { PendientePasado } from '../../../../infrastructure/api/RewardsApiService';
import { ThemeColors, useTheme } from '../../theme/colors';
import { ESPACIO, PESO, RADIO, TEXTO } from '../../theme/tokens';

interface Props {
  /**
   * Los días anteriores con ocurrencias sin responder (el carry-over).
   * `null` o vacío → la tarjeta no se muestra.
   */
  pendientes: PendientePasado[];
  /**
   * Marca un pendiente de un día anterior (hecha o no hecha).
   * Solo se llama cuando el usuario elige explícitamente.
   */
  onMarcar: (activityId: string, fecha: string, hecha: boolean) => Promise<void>;
  /** Reprograma un pendiente a una fecha elegida. */
  onReprogramar: (activityId: string, fecha: string, nuevaFecha: string) => Promise<void>;
  /** El usuario descarta la tarjeta por ahora. No resuelve nada. */
  onDismiss: () => void;
}

type AccionKind = 'hecha' | 'no_hecha' | 'reprogramar';

const ACCIONES: { kind: AccionKind; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { kind: 'hecha', label: 'La hice', icon: 'checkmark-circle' },
  { kind: 'no_hecha', label: 'No la hice', icon: 'close-circle' },
  { kind: 'reprogramar', label: 'Reprogramar', icon: 'calendar' },
];

/**
 * El carry-over: lo que quedó sin decir ayer y se puede responder hoy.
 *
 * No toca ningún store: la decisión llega por props. La regla es que SIEMPRE
 * pregunta antes de actuar —la tarjeta ES la pregunta—. Ningún botón se
 * dispara solo, y descartarla no marca ni mueve nada.
 */

export function CarryOverCard({ pendientes, onMarcar, onReprogramar, onDismiss }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [reprogramando, setReprogramando] = useState<{
    activityId: string;
    fecha: string;
    titulo: string;
  } | null>(null);

  const totalItems = useMemo(
    () => pendientes.reduce((acc, p) => acc + p.items.length, 0),
    [pendientes]
  );

  if (pendientes.length === 0) {
    return null;
  }

  const textoFecha = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    const fecha = new Date(y, m - 1, d);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    if (fecha.getTime() === ayer.getTime()) return 'Ayer';
    return fecha.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  /** Los próximos 7 días para elegir destino de reprogramación. */
  const diasDestino = useMemo(() => {
    const opciones: { iso: string; etiqueta: string }[] = [];
    const hoy = new Date();
    for (let i = 1; i <= 7; i += 1) {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const etiqueta =
        i === 1
          ? 'Mañana'
          : d.toLocaleDateString('es', { weekday: 'long', day: 'numeric' });
      opciones.push({ iso, etiqueta });
    }
    return opciones;
  }, []);

  const ejecutar = async (
    item: PendientePasado['items'][number],
    fecha: string,
    accion: AccionKind
  ) => {
    if (accion === 'reprogramar') {
      setReprogramando({ activityId: item.activityId, fecha, titulo: item.titulo });
      return;
    }
    await onMarcar(item.activityId, fecha, accion === 'hecha');
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.contenedor} testID="carry-over">
        <Pressable style={styles.fondo} onPress={onDismiss} />

        <View style={styles.hoja}>
          <View style={styles.asa} />

          {reprogramando ? (
            <>
              <Text style={styles.titulo}>¿Para cuándo?</Text>
              <Text style={styles.bajada}>
                Reprogramar «{reprogramando.titulo}».
              </Text>
              <ScrollView style={styles.lista}>
                {diasDestino.map((op) => (
                  <Pressable
                    key={op.iso}
                    testID={`destino-${op.iso}`}
                    style={styles.itemRow}
                    onPress={async () => {
                      const destino = op.iso;
                      setReprogramando(null);
                      await onReprogramar(
                        reprogramando.activityId,
                        reprogramando.fecha,
                        destino
                      );
                    }}
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={colors.secondaryAccent}
                    />
                    <Text style={styles.itemTexto}>{op.etiqueta}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable
                testID="destino-cancelar"
                style={[styles.salida, styles.salidaLinea]}
                onPress={() => setReprogramando(null)}
              >
                <Text style={styles.salidaTextoLinea}>Volver</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.titulo}>
                {totalItems === 1
                  ? 'Te quedó uno sin responder'
                  : `Te quedaron ${totalItems} sin responder`}
              </Text>
              <Text style={styles.bajada}>
                Dinos qué pasó con cada una. Nada se toca hasta que elijas.
              </Text>

              <ScrollView style={styles.lista}>
                {pendientes
                  .slice()
                  .sort((a, b) => b.fecha.localeCompare(a.fecha))
                  .map((p) => (
                    <View key={p.fecha} style={styles.diaBloque}>
                      <Text style={styles.diaEtiqueta}>{textoFecha(p.fecha)}</Text>
                      {p.items.map((item) => (
                        <View key={`${p.fecha}-${item.activityId}`} style={styles.item}>
                          <Text style={styles.itemTitulo}>{item.titulo}</Text>
                          <View style={styles.acciones}>
                            {ACCIONES.map((a) => (
                              <Pressable
                                key={a.kind}
                                testID={`accion-${item.activityId}-${a.kind}`}
                                style={styles.botonAccion}
                                onPress={() => ejecutar(item, p.fecha, a.kind)}
                              >
                                <Ionicons
                                  name={a.icon}
                                  size={16}
                                  color={colors.secondaryAccent}
                                />
                                <Text style={styles.botonAccionTexto}>{a.label}</Text>
                              </Pressable>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                  ))}
              </ScrollView>

              <Pressable
                testID="carry-over-ahora-no"
                style={[styles.salida, styles.salidaLinea]}
                onPress={onDismiss}
              >
                <Text style={styles.salidaTextoLinea}>Ahora no</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

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
      maxHeight: '85%',
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
    lista: { maxHeight: 320, width: '100%' },
    diaBloque: {
      marginBottom: ESPACIO.md,
    },
    diaEtiqueta: {
      fontSize: TEXTO.micro,
      fontWeight: PESO.medio,
      color: colors.textTertiary,
      textTransform: 'capitalize',
      marginBottom: ESPACIO.xs,
    },
    item: {
      marginBottom: ESPACIO.sm,
      paddingVertical: ESPACIO.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.cardBorder,
    },
    itemTitulo: {
      fontSize: TEXTO.pie,
      color: colors.surface,
      marginBottom: ESPACIO.xs,
    },
    acciones: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ESPACIO.sm,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIO.sm,
      paddingVertical: ESPACIO.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.cardBorder,
    },
    itemTexto: {
      fontSize: TEXTO.pie,
      color: colors.surface,
    },
    botonAccion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIO.xs,
      paddingHorizontal: ESPACIO.sm,
      paddingVertical: ESPACIO.xs,
      borderRadius: RADIO.sm,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
    },
    botonAccionTexto: {
      fontSize: TEXTO.micro,
      fontWeight: PESO.medio,
      color: colors.secondaryAccent,
    },
    salida: {
      paddingVertical: ESPACIO.md,
      borderRadius: RADIO.lg,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
      alignItems: 'center',
      marginTop: ESPACIO.sm,
    },
    salidaLinea: {},
    salidaTextoLinea: {
      fontSize: TEXTO.cuerpo,
      fontWeight: PESO.fuerte,
      color: colors.textSecondary,
    },
  });
