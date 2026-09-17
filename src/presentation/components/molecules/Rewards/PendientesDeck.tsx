/**
 * El mazo de pendientes (estilo Tinder).
 *
 * Cada carta es UNA actividad sin responder: la de hoy —ya terminada, sin que
 * nadie haya respondido— o una de un día anterior. No es la lista del cierre
 * de día: es la cuenta de lo que falta, servida una carta a la vez.
 *
 *   derecha   → La hice
 *   izquierda → No la hice
 *   botón     → Reprogramar (permite elegir el día)
 *   arriba    → Saltar por ahora
 *
 * Por qué el gesto y no la lista: responder es una decisión por actividad, y
 * ante una lista la gente responde «todo con lo mismo». Una carta por vez
 * obliga a mirar cada una — y el gesto hace que contestar no se sienta como
 * un formulario.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State as EstadoGesto,
  type PanGestureHandlerGestureEvent,
  type PanGestureHandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/colors';
import type { ThemeColors } from '../../theme/colors';
import { ESPACIO, PESO, RADIO, TEXTO } from '../../theme/tokens';

export interface TarjetaPendiente {
  /** El id de la actividad. */
  id: string;
  /** De dónde salió la deuda: hoy o un día anterior. */
  origen: 'hoy' | 'pasado';
  titulo: string;
  /** "Hoy" o la fecha legible del día que fue. */
  descripcion: string;
  /** Fecha `YYYY-MM-DD` desde la que se marca o se mueve. */
  desde: string;
}

interface Props {
  visible: boolean;
  cartas: TarjetaPendiente[];
  onHecha: (carta: TarjetaPendiente) => void | Promise<void>;
  onNoHecha: (carta: TarjetaPendiente) => void | Promise<void>;
  onReprogramar: (carta: TarjetaPendiente, destino: string) => void | Promise<void>;
  onSaltar: (carta: TarjetaPendiente) => void;
  onCerrar: () => void;
  guardando?: boolean;
}

const VIOLETA = '#7C5CFF';
const VERDE = '#34C77B';
const ROJO = '#FF6B6B';
const AZUL = '#4FB7E8';

/** Los próximos días para reprogramar, empezando por mañana. */
function proximosDias(cantidad: number): string[] {
  const dias: string[] = [];
  for (let i = 1; i <= cantidad; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dias.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    );
  }
  return dias;
}

export const PendientesDeck: React.FC<Props> = ({
  visible,
  cartas,
  onHecha,
  onNoHecha,
  onReprogramar,
  onSaltar,
  onCerrar,
  guardando = false,
}) => {
  const { colors, comfyColors } = useTheme();
  const styles = useMemo(() => createStyles(colors, comfyColors), [colors, comfyColors]);

  const [restantes, setRestantes] = useState<TarjetaPendiente[]>(cartas);
  const [reprogramando, setReprogramando] = useState(false);

  const enVuelo = useRef(false);
  const visiblePrevio = useRef(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotacion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && !visiblePrevio.current) {
      // Reabrir: arranca con las cartas que trajo el padre.
      setRestantes(cartas);
      setReprogramando(false);
      translateX.setValue(0);
      translateY.setValue(0);
      rotacion.setValue(0);
    }
    visiblePrevio.current = visible;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, cartas]);

  const top: TarjetaPendiente | undefined = restantes[0];
  const atras: TarjetaPendiente | undefined = restantes[1];

  // El PanResponder nace una sola vez y sus closures quedarian pegados al
  // primer render (visible=false, restantes=[]): el swipe nunca veria la
  // carta ni el volar fresco. Estos refs se reasignan en cada render para
  // que los handlers lean SIEMPRE lo actual. (En new-architecture el
  // PanResponder de core no llega a negociar el gesto dentro del Modal; por
  // eso el motor aquí es react-native-gesture-handler, lo mismo que usan
  // ScheduleTimeline y SwipeableActivityCard.)
  const topRef = useRef(top);
  topRef.current = top;
  const volarRef = useRef<(carta: TarjetaPendiente, dx: number, dy: number, desenlace: (c: TarjetaPendiente) => void) => void>(() => {});

  const volar = (
    carta: TarjetaPendiente,
    dx: number,
    dy: number,
    desenlace: (c: TarjetaPendiente) => void
  ) => {
    if (enVuelo.current) return;
    enVuelo.current = true;
    Animated.parallel([
      Animated.timing(translateX, { toValue: dx, duration: 220, useNativeDriver: false }),
      Animated.timing(translateY, { toValue: dy, duration: 220, useNativeDriver: false }),
      Animated.timing(rotacion, {
        toValue: dx > 0 ? 0.25 : dx < 0 ? -0.25 : 0,
        duration: 220,
        useNativeDriver: false,
      }),
    ]).start(() => {
      translateX.setValue(0);
      translateY.setValue(0);
      rotacion.setValue(0);
      enVuelo.current = false;
      const quedan = restantes.filter((c) => c.id !== carta.id);
      setRestantes(quedan);
      desenlace(carta);
      if (quedan.length === 0) setTimeout(onCerrar, 350);
    });
  };
  volarRef.current = volar;

  /** Sigue al dedo: los `translation*` vienen del gesto nativo. */
  const alMoverGesto = (evento: PanGestureHandlerGestureEvent) => {
    const { translationX, translationY } = evento.nativeEvent;
    translateX.setValue(translationX);
    translateY.setValue(translationY);
    rotacion.setValue(translationX / 400);
  };

  /** Al soltar decide según el recorrido; si no alcanzó, la carta vuelve. */
  const alTerminarGesto = (evento: PanGestureHandlerStateChangeEvent) => {
    const { state, translationX, translationY } = evento.nativeEvent;
    if (state === EstadoGesto.ACTIVE) {
      setReprogramando(false);
      return;
    }
    if (state !== EstadoGesto.END) return;

    const actual = topRef.current;
    if (!actual) return;
    const lanzar = volarRef.current;
    if (translationX > 130) return lanzar(actual, 540, 60, (c) => void onHecha(c));
    if (translationX < -130) return lanzar(actual, -540, 60, (c) => void onNoHecha(c));
    if (translationY < -130) return lanzar(actual, 0, -560, (c) => onSaltar(c));
    Animated.parallel([
      Animated.spring(translateX, { toValue: 0, useNativeDriver: false }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: false }),
      Animated.spring(rotacion, { toValue: 0, useNativeDriver: false }),
    ]).start();
  };

  if (!visible) return null;

  const etiquetaDerecha = translateX.interpolate({ inputRange: [0, 160], outputRange: [0, 1] });
  const etiquetaIzquierda = translateX.interpolate({ inputRange: [-160, 0], outputRange: [1, 0] });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCerrar}>
      <GestureHandlerRootView style={styles.contenedor} testID="mazo-pendientes">
        <Pressable style={styles.fondo} onPress={onCerrar} />

        <View style={styles.escena}>
          <Text style={styles.titulo}>¿Qué te quedó sin responder?</Text>
          <Text style={styles.bajada}>
            {restantes.length === 1
              ? 'Queda 1 actividad.'
              : `Quedan ${restantes.length} actividades.`}
          </Text>

          <View style={styles.pila}>
            {reprogramando && top && (
              <View style={styles.reprogramarPanel}>
                <Text style={styles.panelTitulo}>Mover “{top.titulo}” a:</Text>
                <View style={styles.destinos}>
                  {proximosDias(7).map((iso) => (
                    <TouchableOpacity
                      key={iso}
                      testID={`pendiente-destino-${iso}`}
                      style={styles.destino}
                      onPress={() => {
                        const carta = top;
                        setReprogramando(false);
                        if (carta) volar(carta, 0, -560, (c) => void onReprogramar(c, iso));
                      }}
                      disabled={guardando}
                    >
                      <Ionicons name="calendar-outline" size={13} color={comfyColors.skyBlue} />
                      <Text style={styles.destinoTexto}>{iso.slice(5)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity testID="pendiente-destino-volver" onPress={() => setReprogramando(false)}>
                  <Text style={styles.volver}>Volver</Text>
                </TouchableOpacity>
              </View>
            )}

            {atras && (
              <View
                style={[styles.carta, styles.cartaAtras, { backgroundColor: colors.cardBackground }]}
                pointerEvents="none"
              >
                <Text style={[styles.cartaTitulo, { color: colors.surface }]} numberOfLines={2}>
                  {atras.titulo}
                </Text>
              </View>
            )}

            {top && (
              <PanGestureHandler
                testID="carta-gesto"
                enabled={!guardando}
                onGestureEvent={alMoverGesto}
                onHandlerStateChange={alTerminarGesto}
              >
                <Animated.View
                  testID="carta-tope"
                  style={[
                    styles.carta,
                    {
                      transform: [
                        { translateX },
                        { translateY },
                        { rotate: rotacion.interpolate({ inputRange: [-0.3, 0.3], outputRange: ['-8deg', '8deg'] }) },
                      ],
                    },
                  ]}
                >
                <LinearGradient
                  colors={[colors.cardBackground, colors.cardBackground]}
                  style={styles.cartaFondo}
                >
                  <Animated.View
                    style={[
                      styles.etiqueta,
                      styles.etiquetaSi,
                      { opacity: etiquetaDerecha },
                    ]}
                  >
                    <Ionicons name="checkmark" size={14} color={VERDE} />
                    <Text style={[styles.etiquetaTexto, { color: VERDE }]}>LA HICE</Text>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.etiqueta,
                      styles.etiquetaNo,
                      { opacity: etiquetaIzquierda },
                    ]}
                  >
                    <Ionicons name="close" size={14} color={ROJO} />
                    <Text style={[styles.etiquetaTexto, { color: ROJO }]}>NO LA HICE</Text>
                  </Animated.View>

                  <View style={styles.cartaContenido}>
                    <View
                      style={[
                        styles.cartaChip,
                        {
                          backgroundColor:
                            top.origen === 'pasado'
                              ? comfyColors.skyBlue + '26'
                              : VERDE + '22',
                        },
                      ]}
                    >
                      <Ionicons
                        name={top.origen === 'pasado' ? 'time-outline' : 'sunny-outline'}
                        size={12}
                        color={top.origen === 'pasado' ? comfyColors.skyBlue : VERDE}
                      />
                      <Text
                        style={[
                          styles.cartaChipTexto,
                          {
                            color:
                              top.origen === 'pasado' ? comfyColors.skyBlue : VERDE,
                          },
                        ]}
                      >
                        {top.descripcion}
                      </Text>
                    </View>

                    <Text style={[styles.cartaTitulo, { color: colors.surface }]} numberOfLines={3}>
                      {top.titulo}
                    </Text>

                    <View style={styles.pista}>
                      <Ionicons
                        name="swap-vertical-outline"
                        size={13}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.pistaTexto}>Deslizá la carta →</Text>
                    </View>
                  </View>
                </LinearGradient>
                </Animated.View>
              </PanGestureHandler>
            )}
          </View>

          {top && !reprogramando && (
            <View style={styles.controles} pointerEvents={guardando ? 'none' : 'auto'}>
              <TouchableOpacity
                testID="pendiente-reprogramar"
                style={[styles.boton, styles.botonReprogramar]}
                onPress={() => setReprogramando(true)}
                disabled={guardando}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={26} color={AZUL} />
              </TouchableOpacity>

              <TouchableOpacity
                testID="pendiente-no-hecha"
                style={[styles.boton, styles.botonNo]}
                onPress={() => volar(top, -540, 60, (c) => void onNoHecha(c))}
                disabled={guardando}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={36} color={ROJO} />
              </TouchableOpacity>

              <TouchableOpacity
                testID="pendiente-hecha"
                style={[styles.boton, styles.botonSi]}
                onPress={() => volar(top, 540, 60, (c) => void onHecha(c))}
                disabled={guardando}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark" size={36} color={VERDE} />
              </TouchableOpacity>
            </View>
          )}

          {top && !reprogramando && (
            <TouchableOpacity testID="pendiente-saltar" onPress={() => volar(top, 0, -560, onSaltar)}>
              <Text style={styles.saltar}>Saltar por ahora</Text>
            </TouchableOpacity>
          )}
        </View>
    </GestureHandlerRootView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors, comfyColors: Record<string, string>) =>
  StyleSheet.create({
    contenedor: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    fondo: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(8, 9, 14, 0.78)',
    },
    escena: {
      width: '86%',
      maxWidth: 380,
      alignItems: 'center',
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
      marginTop: ESPACIO.xs,
      marginBottom: ESPACIO.md,
    },
    pila: {
      width: '100%',
      height: 300,
      alignItems: 'center',
      justifyContent: 'center',
    },
    carta: {
      width: '100%',
      height: 300,
      borderRadius: RADIO.xl,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 24,
      elevation: 8,
    },
    cartaFondo: {
      flex: 1,
      padding: ESPACIO.lg,
    },
    cartaAtras: {
      position: 'absolute',
      top: 14,
      transform: [{ scale: 0.94 }],
      justifyContent: 'flex-end',
      padding: ESPACIO.lg,
      opacity: 0.7,
    },
    cartaContenido: {
      flex: 1,
      justifyContent: 'center',
      gap: ESPACIO.md,
    },
    cartaChip: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingHorizontal: ESPACIO.sm,
      paddingVertical: 6,
      borderRadius: RADIO.lg,
    },
    cartaChipTexto: {
      fontSize: TEXTO.micro,
      fontWeight: PESO.fuerte,
      textTransform: 'uppercase',
    },
    cartaTitulo: {
      fontSize: TEXTO.titulo,
      fontWeight: PESO.maximo,
      lineHeight: 30,
    },
    pista: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: ESPACIO.xs,
    },
    pistaTexto: {
      fontSize: TEXTO.pie,
      color: colors.textSecondary,
    },
    etiqueta: {
      position: 'absolute',
      top: ESPACIO.md,
      zIndex: 2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: ESPACIO.sm,
      paddingVertical: 6,
      borderRadius: RADIO.md,
      borderWidth: 2,
      backgroundColor: 'rgba(10, 11, 18, 0.55)',
    },
    etiquetaSi: {
      left: ESPACIO.md,
      borderColor: VERDE,
    },
    etiquetaNo: {
      right: ESPACIO.md,
      borderColor: ROJO,
    },
    etiquetaTexto: {
      fontSize: TEXTO.micro,
      fontWeight: PESO.maximo,
      letterSpacing: 0.6,
    },
    reprogramarPanel: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 3,
      backgroundColor: colors.cardBackground,
      borderColor: colors.cardBorder,
      borderWidth: 1,
      borderRadius: RADIO.xl,
      padding: ESPACIO.md,
      gap: ESPACIO.sm,
    },
    panelTitulo: {
      fontSize: TEXTO.pie,
      fontWeight: PESO.fuerte,
      color: colors.surface,
    },
    destinos: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    destino: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: ESPACIO.sm,
      paddingVertical: 8,
      borderRadius: RADIO.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    destinoTexto: {
      fontSize: TEXTO.micro,
      fontWeight: PESO.fuerte,
      color: colors.surface,
    },
    volver: {
      fontSize: TEXTO.micro,
      color: colors.textSecondary,
      textDecorationLine: 'underline',
    },
    controles: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIO.md,
      marginTop: ESPACIO.lg,
    },
    boton: {
      width: 62,
      height: 62,
      borderRadius: RADIO.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    botonReprogramar: {
      borderColor: AZUL + '55',
      backgroundColor: AZUL + '14',
    },
    botonNo: {
      borderColor: ROJO + '66',
      backgroundColor: ROJO + '12',
    },
    botonSi: {
      borderColor: VERDE + '66',
      backgroundColor: VERDE + '12',
    },
    saltar: {
      fontSize: TEXTO.pie,
      color: colors.textSecondary,
      marginTop: ESPACIO.md,
      textDecorationLine: 'underline',
    },
  });