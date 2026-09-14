import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  /** Marca un pendiente de un día anterior (hecha o no hecha). */
  onMarcar: (activityId: string, fecha: string, hecha: boolean) => Promise<void>;
  /** Reprograma un pendiente a una fecha elegida. */
  onReprogramar: (activityId: string, fecha: string, nuevaFecha: string) => Promise<void>;
}

type Accion = 'hecha' | 'no_hecha' | 'reprogramar';

const ACCIONES: { kind: Accion; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { kind: 'hecha', label: 'La hice', icon: 'checkmark-circle' },
  { kind: 'no_hecha', label: 'No la hice', icon: 'close-circle' },
  { kind: 'reprogramar', label: 'Reprogramar', icon: 'calendar' },
];

/**
 * La reprogramación como tarjeta de notificación integrada, no como popup.
 *
 * Es el mismo carry-over que abre el Home en modal, pero en una tarjeta que
 * vive dentro de la UI de la racha: la pregunta es la misma («la hiciste, no
 * la hiciste o la mueves») y la regla también —nada se toca hasta que el
 * usuario elige—. Aquí no hay modal: reprogramar despliega los destinos de la
 * próxima semana en la misma tarjeta.
 */
export const CarryOverInline: React.FC<Props> = ({
  pendientes,
  onMarcar,
  onReprogramar,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [reprogramando, setReprogramando] = useState<{
    activityId: string;
    fecha: string;
    titulo: string;
  } | null>(null);
  const [oculta, setOculta] = useState(false);

  const pendientesVisibles = useMemo(
    () => pendientes.slice().sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [pendientes]
  );

  const totalItems = useMemo(
    () => pendientes.reduce((acc, p) => acc + p.items.length, 0),
    [pendientes]
  );

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
        i === 1 ? 'Mañana' : d.toLocaleDateString('es', { weekday: 'short', day: 'numeric' });
      opciones.push({ iso, etiqueta });
    }
    return opciones;
  }, []);

  if (oculta || pendientes.length === 0) {
    return null;
  }

  const ejecutar = async (item: PendientePasado['items'][number], fecha: string, accion: Accion) => {
    if (accion === 'reprogramar') {
      setReprogramando({ activityId: item.activityId, fecha, titulo: item.titulo });
      return;
    }
    await onMarcar(item.activityId, fecha, accion === 'hecha');
  };

  const textoFecha = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    const fecha = new Date(y, m - 1, d);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    if (fecha.getTime() === ayer.getTime()) return 'ayer';
    return fecha.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <View style={styles.tarjeta} testID="leccion-reprogramada">
      <View style={styles.encabezado}>
        <Ionicons name="calendar-outline" size={18} color={colors.secondaryAccent} />
        <Text style={styles.titulo}>
          {totalItems === 1 ? 'Reprogramación pendiente' : `Reprogramaciones pendientes (${totalItems})`}
        </Text>
        <Pressable
          testID="leccion-ocultar"
          hitSlop={10}
          onPress={() => setOculta(true)}
          accessibilityRole="button"
          accessibilityLabel="Ocultar reprogramaciones"
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      {reprogramando ? (
        <>
          <Text style={styles.bajada}>
            Reprogramar «{reprogramando.titulo}» a un día de esta semana.
          </Text>
          <View style={styles.destinos}>
            {diasDestino.map((op) => (
              <Pressable
                key={op.iso}
                testID={`leccion-destino-${op.iso}`}
                style={styles.destino}
                onPress={async () => {
                  const destino = op.iso;
                  setReprogramando(null);
                  await onReprogramar(reprogramando.activityId, reprogramando.fecha, destino);
                }}
              >
                <Text style={styles.destinoTexto}>{op.etiqueta}</Text>
              </Pressable>
            ))}
            <Pressable
              testID="leccion-destino-volver"
              style={[styles.destino, styles.destinoVolver]}
              onPress={() => setReprogramando(null)}
            >
              <Text style={styles.destinoTextoVolver}>Volver</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.bajada}>
            Lo que quedó sin responder ayer. Nada se toca hasta que elijas.
          </Text>

          {pendientesVisibles.map((p) => (
            <View key={p.fecha} style={styles.bloqueDia}>
              <Text style={styles.diaEtiqueta}>
                ¿Tuviste un problema el {textoFecha(p.fecha)}?
              </Text>
              {p.items.map((item) => (
                <View key={`${p.fecha}-${item.activityId}`} style={styles.item}>
                  <Text style={styles.itemTitulo}>{item.titulo}</Text>
                  <View style={styles.acciones}>
                    {ACCIONES.map((a) => (
                      <Pressable
                        key={a.kind}
                        testID={`leccion-${item.activityId}-${a.kind}`}
                        style={styles.botonAccion}
                        onPress={() => ejecutar(item, p.fecha, a.kind)}
                      >
                        <Ionicons name={a.icon} size={16} color={colors.secondaryAccent} />
                        <Text style={styles.botonAccionTexto}>{a.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    tarjeta: {
      gap: ESPACIO.sm,
      padding: ESPACIO.lg,
      borderRadius: RADIO.lg,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    encabezado: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIO.sm,
    },
    titulo: {
      flex: 1,
      fontSize: TEXTO.cuerpo,
      fontWeight: PESO.fuerte,
      color: colors.surface,
    },
    bajada: {
      fontSize: TEXTO.pie,
      color: colors.textSecondary,
      marginBottom: ESPACIO.xs,
    },
    bloqueDia: {
      gap: ESPACIO.xs,
      marginTop: ESPACIO.xs,
    },
    diaEtiqueta: {
      fontSize: TEXTO.micro,
      fontWeight: PESO.medio,
      color: colors.textTertiary,
      textTransform: 'capitalize',
    },
    item: {
      gap: ESPACIO.sm,
      paddingVertical: ESPACIO.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.cardBorder,
    },
    itemTitulo: {
      fontSize: TEXTO.pie,
      fontWeight: PESO.medio,
      color: colors.surface,
    },
    acciones: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ESPACIO.sm,
    },
    botonAccion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIO.xs,
      paddingHorizontal: ESPACIO.md,
      paddingVertical: ESPACIO.sm,
      borderRadius: RADIO.pill,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.screenBackground,
    },
    botonAccionTexto: {
      fontSize: TEXTO.micro,
      fontWeight: PESO.fuerte,
      color: colors.secondaryAccent,
    },
    destinos: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: ESPACIO.sm,
    },
    destino: {
      paddingHorizontal: ESPACIO.md,
      paddingVertical: ESPACIO.sm,
      borderRadius: RADIO.pill,
      borderWidth: 1,
      borderColor: colors.secondaryAccent,
      backgroundColor: 'rgba(172, 201, 255, 0.08)',
    },
    destinoVolver: {
      borderColor: colors.cardBorder,
      backgroundColor: colors.screenBackground,
    },
    destinoTexto: {
      fontSize: TEXTO.pie,
      fontWeight: PESO.fuerte,
      color: colors.secondaryAccent,
      textTransform: 'capitalize',
    },
    destinoTextoVolver: {
      fontSize: TEXTO.pie,
      fontWeight: PESO.fuerte,
      color: colors.textSecondary,
    },
  });