// screens/schedule/ScheduleView.tsx
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useWindowDimensions, View, ActivityIndicator, TouchableOpacity, Text, StyleSheet, ScrollView, Dimensions, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScheduleHeader } from '../../components/organisms/Schedule/ScheduleHeader';
import { ScheduleGrid } from '../../components/organisms/Schedule/ScheduleGrid';
import { EnergyPicker } from '../../components/molecules/Energy/EnergyPicker';
import { ActivityDetailModal } from '../../components/organisms/Schedule/ActivityDetailModal';
import { useTheme } from '../../components/theme/colors';
import { useScheduleStore, useActivityStore } from '../../../di/Dependencies';
import { JS_DAY_TO_DAYOFWEEK } from '../../utils/scheduleUtils';
import { ScheduledActivity } from '../../../domain/entities/Schedule';
import { DayOfWeek } from '../../../domain/entities/Activity';
import {
  saveEnergyRecord,
  makeEnergyRecord,
  getEnergyHistory,
} from '../../../infrastructure/persistence/EnergyHistoryService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingScreen } from '../../components/atoms/Common/LoadingScreen';
import { GoogleCalendarCta } from '../../components/atoms/Common/GoogleCalendarCta';
import { MonthGrid } from '../../components/organisms/Schedule/MonthGrid';
import { WeekGrid } from '../../components/organisms/Schedule/WeekGrid';
import { useCalendarStore, rangoDelMes } from '../../../infrastructure/store/useCalendarStore';
import { useGoogleCalendarStore } from '../../../infrastructure/store/useGoogleCalendarStore';
import { EventoImportado } from '../../../infrastructure/api/GoogleCalendarApiService';
import { Ocurrencia, aFechaLocal } from '../../../infrastructure/api/CalendarApiService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAYS_ORDER = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

/**
 * La semana que dibuja el grid es la que contiene HOY, anclada en Lunes (el
 * mismo criterio que la linea "hoy" y que DAYS_ORDER). Con eso la pagina i
 * de la semana se ancla a una fecha real y los eventos de Google —que viven
 * por fecha, YYYY-MM-DD— caen en su dia correcto.
 */
function fechaISODeLaPage(i: number): string {
  const hoy = new Date();
  const diasDesdeLunes = (hoy.getDay() + 6) % 7;
  const fecha = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    hoy.getDate() - diasDesdeLunes + i
  );
  return aFechaLocal(fecha);
}

function minutosA_hhmm(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * De un evento importado a un bloque del horario, tipo 'google'.
 *
 * Los bloques 'google' se pintan de solo lectura (ActivityBlock los dibuja
 * sin onPress): el origen es externo, los horarios no se mueven ni se editan
 * aca. Los eventos de todo el dia no pasan por esta conversion: en un grid
 * por horas un "todo el dia" no tiene una hora que pintar.
 */
function aBloqueGoogle(evento: EventoImportado, day: string): ScheduledActivity {
  const inicio = new Date(evento.inicio);
  const fin = new Date(evento.fin);
  return {
    activity: undefined,
    assignedStartTime: minutosA_hhmm(inicio.getHours() * 60 + inicio.getMinutes()),
    assignedEndTime: minutosA_hhmm(fin.getHours() * 60 + fin.getMinutes()),
    day: day as any,
    tipo: 'google',
    nombre: evento.titulo,
  };
}

/**
 * De una ocurrencia real del calendario a un bloque del horario, tipo
 * 'agenda'.
 *
 * Las ocurrencias que ya tiene el plan semanal (mismo id de actividad) no
 * pasan por aqui: se dibujan con su bloque del plan. Lo que si llega son las
 * que el mes muestra y el plan no: parciales con fecha unica, actividades
 * movidas de dia. Es lo que hace que el grid del dia refleje el mes.
 */
function aBloqueAgenda(occ: Ocurrencia, day: string): ScheduledActivity {
  const a = occ.actividad;
  // Las importadas de Google y las de fecha unica no viajan con
  // preferredStartTime; su hora real vive en la particion de ese dia.
  const configDelDia = a.daysConfig?.[day as DayOfWeek];
  const particion = configDelDia?.partitions?.[0];
  const inicioMin = particion?.startHour
    ? particion.startHour.getHours() * 60 + particion.startHour.getMinutes()
    : a.preferredStartTime ?? 8 * 60;
  const finMin = particion?.endHour
    ? particion.endHour.getHours() * 60 + particion.endHour.getMinutes()
    : a.preferredEndTime ?? inicioMin + 45;
  return {
    activity: undefined,
    assignedStartTime: minutosA_hhmm(inicioMin),
    assignedEndTime: minutosA_hhmm(finMin),
    day: day as any,
    tipo: 'agenda',
    nombre: a.title,
  };
}

function ChronologicalAgendaList({
  activities,
  onActivityPress,
}: {
  activities: ScheduledActivity[];
  onActivityPress: (item: ScheduledActivity) => void;
}) {
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const s = useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);

  if (activities.length === 0) {
    return (
      <View style={s.listEmptyContainer}>
        <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
        <Text style={s.listEmptyTitle}>No hay actividades</Text>
        <Text style={s.listEmptySubtitle}>No tienes ninguna actividad programada para este día.</Text>
      </View>
    );
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 5) return 'Alta';
    if (priority >= 3) return 'Media';
    return 'Baja';
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'baja': return 'Baja';
      case 'media': return 'Normal';
      case 'alta': return 'Alta';
      default: return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'baja': return comfyColors.green;
      case 'media': return comfyColors.yellow;
      case 'alta': return '#FF6B6B';
      default: return colors.surface;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return '#FF6B6B';
    if (priority >= 3) return comfyColors.skyBlue;
    return comfyColors.green;
  };

  const getIdentityIcon = (identity: string | undefined) => {
    switch (identity) {
      case 'clase': return 'school-outline';
      case 'trabajo': return 'briefcase-outline';
      default: return 'document-text-outline';
    }
  };

  const getIdentityColor = (identity: string | undefined) => {
    switch (identity) {
      case 'clase': return comfyColors.skyBlue;
      case 'trabajo': return comfyColors.orange;
      default: return comfyColors.green;
    }
  };

  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={s.listContent}
      showsVerticalScrollIndicator={false}
    >
      {activities.map((act, idx) => {
        const actActivity = act.activity;
        const isTravel = !actActivity;
        
        const iconName = isTravel ? 'car-outline' : getIdentityIcon(actActivity?.identity);
        const iconColor = isTravel ? '#8A9AAA' : getIdentityColor(actActivity?.identity);
        const title = actActivity?.title ?? act.nombre ?? (act.tipo === 'viaje' ? 'Traslado' : 'Actividad');
        
        return (
        <TouchableOpacity
          key={`${actActivity?.id ?? act.tipo ?? 'unknown'}-${act.day}-${act.assignedStartTime}-${idx}`}
          style={[s.listItem, isTravel && { opacity: 0.75, borderLeftColor: '#8A9AAA', borderLeftWidth: 4 }]}
          activeOpacity={isTravel ? 1 : 0.7}
          disabled={isTravel}
          onPress={() => onActivityPress(act)}
        >
            <View style={s.listItemHeader}>
            <View style={[s.listItemIconWrapper, { backgroundColor: iconColor + '20' }]}>
              <Ionicons name={iconName} size={18} color={iconColor} />
            </View>
            <Text style={[s.listItemTitle, isTravel && { color: '#8A9AAA' }]} numberOfLines={1}>
              {title}
            </Text>
          </View>

          <View style={s.listItemDivider} />

          <View style={s.listItemDetails}>
            <View style={s.detailRow}>
              <Ionicons name="time-outline" size={14} color={comfyColors.skyBlue} />
              <Text style={s.detailTimeText}>
                {act.assignedStartTime} - {act.assignedEndTime}
              </Text>
            </View>

            {actActivity && (
            <View style={s.listItemBadges}>
              <View style={[s.listBadge, { borderColor: getPriorityColor(actActivity.priority) + '30', backgroundColor: getPriorityColor(actActivity.priority) + '10' }]}>
                <Ionicons name="flag" size={12} color={getPriorityColor(actActivity.priority)} />
                <Text style={[s.listBadgeText, { color: getPriorityColor(actActivity.priority) }]}>
                  Prioridad {getPriorityLabel(actActivity.priority)}
                </Text>
              </View>

              <View style={[s.listBadge, { borderColor: getDifficultyColor(actActivity.difficulty) + '30', backgroundColor: getDifficultyColor(actActivity.difficulty) + '10' }]}>
                <Ionicons name="speedometer-outline" size={12} color={getDifficultyColor(actActivity.difficulty)} />
                <Text style={[s.listBadgeText, { color: getDifficultyColor(actActivity.difficulty) }]}>
                  Dificultad {getDifficultyLabel(actActivity.difficulty)}
                </Text>
              </View>
            </View>
            )}
          </View>
        </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export default function ScheduleView() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const s = useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);
  const {
    activitiesForDay,
    handleGenerateSchedule,
    isLoading,
    schedule,
    selectedDay,
    setSelectedDay,
    calendarViewMode: viewMode,
    setCalendarViewMode: setViewMode,
    startHour,
    endHour,
    perDayStartHours,
    perDayEndHours,
  } = useScheduleStore();

  const { activities } = useActivityStore();
  const loadActivities = useActivityStore((s) => s.loadActivities);
  const cargandoActividades = useActivityStore((s) => s.isLoading);

  const { width: anchoPantalla, height: altoPantalla } = useWindowDimensions();
  const esApaisado = anchoPantalla > altoPantalla;

  // Effective display hours for the selected day (per-day or global fallback)
  const dayIndex = DAYS_ORDER.indexOf(selectedDay);
  const displayStartHour = useMemo(
    () => (perDayStartHours?.[dayIndex] ?? startHour),
    [perDayStartHours, dayIndex, startHour]
  );
  const displayEndHour = useMemo(
    () => (perDayEndHours?.[dayIndex] ?? endHour),
    [perDayEndHours, dayIndex, endHour]
  );

  const [showEnergyPicker, setShowEnergyPicker] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ScheduledActivity | null>(null);
  const [diaElegido, setDiaElegido] = useState<string | null>(null);
  /** Fila esperando fecha destino para moverse. */
  const [moverPendiente, setMoverPendiente] = useState<{ activityId: string; desde: string } | null>(null);
  /** Fecha destino elegida en el picker, local `YYYY-MM-DD`. */
  const [destinoElegido, setDestinoElegido] = useState<string | null>(null);

  const mesVisible = useCalendarStore((s) => s.mesVisible);
  const porDia = useCalendarStore((s) => s.porDia);
  const cargandoCalendario = useCalendarStore((s) => s.cargando);
  const errorCalendario = useCalendarStore((s) => s.error);
  const canceladasEnSesion = useCalendarStore((s) => s.canceladasEnSesion);
  const cargarMes = useCalendarStore((s) => s.cargarMes);
  const irAlMes = useCalendarStore((s) => s.irAlMes);
  const cancelarOcurrenciaEnStore = useCalendarStore((s) => s.cancelar);
  const moverOcurrenciaEnStore = useCalendarStore((s) => s.mover);
  const restaurarOcurrenciaEnStore = useCalendarStore((s) => s.restaurar);

  // Lo importado vive en SU store (D7): si Google falla, esto queda vacio o
  // con lo ultimo valido y el calendario propio ni se entera.
  const importadosPorDia = useGoogleCalendarStore((s) => s.porDia);
  const cargarEnGoogleStore = useGoogleCalendarStore((s) => s.cargar);

  /** El MISMO rango que pide la cuadricula: bordes de semana incluidos.
   *  Desconectado, el store hace cero llamadas: aca no se pregunta nada. */
  const sincronizarGoogleDelMes = useCallback(() => {
    const { desde, hasta } = rangoDelMes(useCalendarStore.getState().mesVisible);
    void cargarEnGoogleStore(desde, hasta);
  }, [cargarEnGoogleStore]);

  const cambiarMesConGoogle = useCallback(
    (delta: number) => {
      void irAlMes(delta).then(sincronizarGoogleDelMes);
    },
    [irAlMes, sincronizarGoogleDelMes]
  );

  // Solo al entrar al modo mes: pedirlo siempre gastaria un viaje de red que
  // la mayoria de las aperturas no usa. Tambien preseleccionamos hoy para que
  // el detalle llene el espacio de abajo en lugar de dejar un hueco enorme.
  useEffect(() => {
    if (viewMode === 'mes') {
      setDiaElegido(aFechaLocal(new Date()));
      cargarMes();
      sincronizarGoogleDelMes();
    }
  }, [viewMode, cargarMes, sincronizarGoogleDelMes]);

  const horizontalScrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(0);
  const isProgrammaticScroll = useRef(false);

  const handleScroll = (e: any) => {
    scrollX.current = e.nativeEvent.contentOffset.x;
  };

  const changeSelectedDayProgrammatically = useCallback((day: any) => {
    isProgrammaticScroll.current = true;
    setSelectedDay(day);
  }, [setSelectedDay]);

  const handlePageChange = useCallback((e: any) => {
    if (isProgrammaticScroll.current) {
      isProgrammaticScroll.current = false;
      return;
    }
    const contentOffset = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / SCREEN_WIDTH);
    const newDay = DAYS_ORDER[index];
    if (newDay && newDay !== selectedDay) {
      setSelectedDay(newDay as any);
    }
  }, [selectedDay, setSelectedDay]);

  useFocusEffect(
    useCallback(() => {
      const today = JS_DAY_TO_DAYOFWEEK[new Date().getDay()];
      changeSelectedDayProgrammatically(today);
      loadActivities();
      // El dia tambien consume esas llamadas: el grid muestra las ocurrencias
      // reales del mes (porDia) y los eventos de Google de la semana actual.
      // El mes de hoy cubre la semana entera, y la cache de 30s del store
      // evita repetir el mismo rango sin sentido.
      if (viewMode === 'mes') {
        // Volver del wizard en modo mes: la actividad recién creada con fecha
        // única solo existe para el calendario, así que hay que pedirlo de
        // nuevo o el usuario no la vería sin refrescar a mano. Forzado: la
        // caché de 30s del store lo descartaría si el viaje al wizard fue corto.
        cargarMes(undefined, true);
      } else {
        cargarMes();
      }
      sincronizarGoogleDelMes();
    }, [changeSelectedDayProgrammatically, loadActivities, viewMode, cargarMes, sincronizarGoogleDelMes])
  );

  /** El "+" del panel del día: abre el wizard con esa fecha como puntual. */
  const crearEnDia = useCallback(
    (fecha: string) => {
      navigation.navigate('CreateActivityModal', { fechaUnica: fecha });
    },
    [navigation]
  );

  // D4: ninguna mutacion falla en silencio. Reintentar repite exactamente
  // la misma accion, sin loops automaticos.
  const ejecutarConReintento = useCallback((accion: () => Promise<void>, verbo: string) => {
    accion().catch(() => {
      Alert.alert(`No pudimos ${verbo} la actividad`, 'Revisá tu conexión y volvé a intentar.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Reintentar', onPress: () => { ejecutarConReintento(accion, verbo); } },
      ]);
    });
  }, []);

  /** Confirma el movimiento con destino `YYYY-MM-DD` local. */
  const confirmarMovimiento = useCallback(
    (pendiente: { activityId: string; desde: string }, destino: string) => {
      setMoverPendiente(null);
      setDestinoElegido(null);
      ejecutarConReintento(
        () => moverOcurrenciaEnStore(pendiente.activityId, pendiente.desde, destino),
        'mover'
      );
    },
    [moverOcurrenciaEnStore, ejecutarConReintento]
  );

  const pedirFechaDestino = useCallback((activityId: string, desde: string) => {
    setDestinoElegido(desde);
    setMoverPendiente({ activityId, desde });
  }, []);

  const cancelarOcurrencia = useCallback(
    (activityId: string, fecha: string) => {
      Alert.alert(
        '¿Cancelar esta actividad?',
        'Desaparece de este día. Puedes restaurarla desde la sección Canceladas.',
        [
          { text: 'Conservar', style: 'cancel' },
          {
            text: 'Cancelar actividad',
            style: 'destructive',
            onPress: () => { ejecutarConReintento(() => cancelarOcurrenciaEnStore(activityId, fecha), 'cancelar'); },
          },
        ]
      );
    },
    [cancelarOcurrenciaEnStore, ejecutarConReintento]
  );

  const restaurarOcurrencia = useCallback(
    (activityId: string, fecha: string) => {
      ejecutarConReintento(() => restaurarOcurrenciaEnStore(activityId, fecha), 'restaurar');
    },
    [restaurarOcurrenciaEnStore, ejecutarConReintento]
  );

  // Sync scroll position when selectedDay changes (e.g. from header tabs)
  useEffect(() => {
    if (!isProgrammaticScroll.current) {
      return;
    }
    const pageIndex = DAYS_ORDER.indexOf(selectedDay);
    if (pageIndex !== -1) {
      const targetX = pageIndex * SCREEN_WIDTH;
      if (Math.abs(scrollX.current - targetX) > 10) {
        horizontalScrollRef.current?.scrollTo({ x: targetX, animated: true });
      } else {
        isProgrammaticScroll.current = false;
      }
    }
  }, [selectedDay]);

  const items = activitiesForDay();

  const onGenerateWithEnergy = useCallback(
    async (nivel: number) => {
      setShowEnergyPicker(false);

      // Save the record and get history
      await saveEnergyRecord(makeEnergyRecord(nivel));
      const historial = await getEnergyHistory(14);

      // Call the store with energy data
      await handleGenerateSchedule({
        nivel_energia: nivel,
        historial_energia: historial,
      }, true);
    },
    [handleGenerateSchedule],
  );

  const handleGeneratePress = useCallback(() => {
    if (activities.length === 0) {
      Alert.alert(
        'Sin actividades',
        'No hay ninguna actividad creada. Crea una actividad primero para poder generar un horario.'
      );
      return;
    }
    setShowEnergyPicker(true);
  }, [activities.length]);

  // El plan semanal puede estar vacio (p.ej. solo actividades importadas de
  // Google, que viven por fecha y no entran al flattener semanal). El vacio
  // no es una afirmacion sobre la BD sino sobre el plan: si el calendario o
  // los importados ya muestran contenido, se dibuja la red igual.
  const hayBloquesDelPlan = schedule != null && schedule.getAllItems().length > 0;
  const hayContenidoCalendario =
    Object.keys(porDia).length > 0 || Object.keys(importadosPorDia).length > 0;
  const showEmptyState = !hayBloquesDelPlan && !hayContenidoCalendario;

  // El mismo problema que en Home: "sin horario generado aun" durante la
  // carga se lee como que se perdio el horario. Es una afirmacion sobre los
  // datos, y todavia no llegaron.
  if (cargandoActividades && activities.length === 0) {
    return <LoadingScreen mensaje="Cargando tu horario..." />;
  }

  if (viewMode === 'anual' && !showEmptyState) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={s.yearGrid}>
          {Array.from({ length: 12 }, (_, i) => {
            const monthDate = new Date(mesVisible.getFullYear(), i, 1);
            return (
              <MonthGrid
                key={i}
                mesVisible={monthDate}
                porDia={porDia}
                cargando={false}
                error={null}
                diaSeleccionado={null}
                onSeleccionarDia={() => {}}
                onCambiarMes={() => {}}
                onReintentar={() => {}}
                onCrearEnDia={() => {}}
                canceladasEnSesion={[]}
                importadosPorDia={{}}
                onMover={() => {}}
                onCancelar={() => {}}
                onRestaurar={() => {}}
              />
            );
          })}
        </ScrollView>
        <TouchableOpacity style={s.volverAlDia} onPress={() => setViewMode('grid')}>
          <Ionicons name="today-outline" size={18} color={comfyColors.green} />
          <Text style={[s.btnText, { color: comfyColors.green }]}>Ver el día</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (viewMode === 'mes' && !showEmptyState) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <MonthGrid
          mesVisible={mesVisible}
          porDia={porDia}
          cargando={cargandoCalendario}
          error={errorCalendario}
          diaSeleccionado={diaElegido}
          onSeleccionarDia={setDiaElegido}
          onCambiarMes={cambiarMesConGoogle}
          onReintentar={() => cargarMes()}
          onCrearEnDia={crearEnDia}
          canceladasEnSesion={canceladasEnSesion}
          importadosPorDia={importadosPorDia}
          onMover={pedirFechaDestino}
          onCancelar={cancelarOcurrencia}
          onRestaurar={restaurarOcurrencia}
          expandir
        />
        <TouchableOpacity style={s.volverAlDia} onPress={() => setViewMode('grid')}>
          <Ionicons name="today-outline" size={18} color={comfyColors.green} />
          <Text style={[s.btnText, { color: comfyColors.green }]}>Ver el día</Text>
        </TouchableOpacity>

        {moverPendiente && (
          <View style={s.pickerContenedor} testID="picker-destino">
            {/* La fecha viaja local: se formatea con aFechaLocal y nunca pasa
                por toISOString(), que la corriente al UTC. */}
            <DateTimePicker
              value={new Date(`${destinoElegido ?? moverPendiente.desde}T12:00:00`)}
              mode="date"
              display="spinner"
              themeVariant="dark"
              locale="es_ES"
              onChange={(_, elegida) => {
                if (!elegida) return;
                const destino = aFechaLocal(elegida);
                if (Platform.OS === 'ios') {
                  // El spinner de iOS dispara onChange en cada giro: solo se
                  // anota, el movimiento se confirma con "Mover aquí".
                  setDestinoElegido(destino);
                } else {
                  confirmarMovimiento(moverPendiente, destino);
                }
              }}
            />
            {Platform.OS === 'ios' && (
              <View style={s.pickerAcciones}>
                <TouchableOpacity
                  testID="descartar-movimiento"
                  onPress={() => { setMoverPendiente(null); setDestinoElegido(null); }}
                  accessibilityLabel="Descartar movimiento"
                >
                  <Text style={s.pickerAccionTexto}>Conservar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="confirmar-movimiento"
                  onPress={() => confirmarMovimiento(moverPendiente, destinoElegido ?? moverPendiente.desde)}
                  accessibilityLabel={`Mover al ${destinoElegido ?? moverPendiente.desde}`}
                >
                  <Text style={[s.pickerAccionTexto, s.pickerAccionConfirmar]}>Mover aquí</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    );
  }

  // Girar el telefono ya ocultaba la barra de tabs para ganar alto; lo que
  // faltaba era usarlo. La semana entera se ve de una y sirve para la foto.
  if (esApaisado && schedule && !showEmptyState) {
    return (
      <WeekGrid
        schedule={schedule}
        startHour={startHour ?? 0}
        endHour={endHour ?? 1440}
      />
    );
  }

  return (
    <View style={s.container}>
      {showEmptyState ? (
        <View style={s.center}>
          <View style={s.emptyIcon}>
            <Ionicons name="calendar-outline" size={54} color={comfyColors.yellow} />
          </View>
          <Text style={s.emptyTitle}>Sin horario generado aún</Text>
          <Text style={s.emptyText}>
            Generá tu horario para acomodar y organizar tus actividades según tu energía.
          </Text>
          <TouchableOpacity
            style={s.btn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("CreateActivityModal")}
          >
            <Ionicons name="add-circle-outline" size={18} color={comfyFontColors.green} />
            <Text style={s.btnText}>Crear actividad manualmente</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.btn, s.btnSecondary]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("AIChatView")}
          >
            <Ionicons name="chatbubbles-outline" size={18} color={comfyColors.green} />
            <Text style={[s.btnText, { color: comfyColors.green }]}>Crear actividad con el asistente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.container}>
          <ScheduleHeader
            selectedDay={selectedDay}
            activityCount={items.length}
            onSelectDay={changeSelectedDayProgrammatically}
            onRefresh={handleGeneratePress}
            viewMode={viewMode}
            onToggleViewMode={() => setViewMode(viewMode === 'grid' ? 'list' : viewMode === 'list' ? 'mes' : viewMode === 'mes' ? 'anual' : 'grid')}
          />

          <GoogleCalendarCta />
          
          <ScrollView
            ref={horizontalScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handlePageChange}
            style={{ flex: 1 }}
          >
            {DAYS_ORDER.map((day) => {
              const loopDayIndex = DAYS_ORDER.indexOf(day);
              const fechaDeLaPagina = fechaISODeLaPage(loopDayIndex);
              const loopDisplayStartHour = perDayStartHours?.[loopDayIndex] ?? startHour;
              const dayItems = schedule ? schedule.getItemsByDay(day as any, loopDisplayStartHour) : [];
              // El plan semanal ya cubre las recurrentes: las ocurrencias con
              // el mismo id no se repiten, solo entran las que el mes muestra
              // y el plan no (fecha unica, movidas).
              const idsDelPlan = new Set(
                dayItems.map((b) => b.activity?.id).filter((id): id is string => Boolean(id))
              );
              const bloquesAgenda = (porDia[fechaDeLaPagina] ?? [])
                .filter((occ) => occ.actividad?.id && !idsDelPlan.has(occ.actividad.id))
                .map((occ) => aBloqueAgenda(occ, day));
              const bloquesGoogle = (importadosPorDia[fechaDeLaPagina] ?? [])
                .filter((ev) => !ev.todoElDia)
                .map((ev) => aBloqueGoogle(ev, day));
              const actividadesDelDia = [...dayItems, ...bloquesAgenda, ...bloquesGoogle];
              return (
                <View key={day} style={{ width: SCREEN_WIDTH, flex: 1, paddingVertical: 8, paddingHorizontal: 4 }}>
                  {viewMode === 'grid' ? (
                    <ScheduleGrid 
                      activities={actividadesDelDia} 
                      isToday={day === JS_DAY_TO_DAYOFWEEK[new Date().getDay()]} 
                      onActivityPress={setSelectedActivity}
                      startHour={displayStartHour}
                      endHour={displayEndHour}
                    />
                  ) : (
                    <ChronologicalAgendaList
                      activities={dayItems}
                      onActivityPress={setSelectedActivity}
                    />
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Chat FAB */}
          <TouchableOpacity
            style={s.fabChatBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("AIChatView")}
          >
            <Ionicons name="chatbubbles-outline" size={26} color={comfyColors.green} />
          </TouchableOpacity>

          {/* Create activity FAB */}
          <TouchableOpacity
            style={s.fabCreateBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("CreateActivityModal")}
          >
            <Ionicons name="add" size={32} color={comfyFontColors.green} />
          </TouchableOpacity>
        </View>
      )}

      {isLoading && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.iconPrimary} />
          <Text style={s.loadingText}>Generando horario...</Text>
        </View>
      )}

      <EnergyPicker
        visible={showEnergyPicker}
        onSelect={onGenerateWithEnergy}
        onCancel={() => setShowEnergyPicker(false)}
      />

      <ActivityDetailModal
        visible={selectedActivity !== null}
        activityItem={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onEdit={(activityId) => navigation.navigate("CreateActivityModal", { activityId })}
      />
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  comfyColors: ReturnType<typeof useTheme>['comfyColors'],
  comfyFontColors: ReturnType<typeof useTheme>['comfyFontColors'],
) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.screenBackground },
  volverAlDia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  pickerContenedor: {
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1.5,
    borderTopColor: colors.cardBorder,
  },
  pickerAcciones: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  pickerAccionTexto: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  pickerAccionConfirmar: {
    color: comfyColors.green,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    padding: 32,
    backgroundColor: colors.screenBackground,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(233, 200, 74, 0.15)",
    borderColor: comfyColors.yellow,
    borderWidth: 2,
    borderStyle: "dashed",
    marginBottom: 8,
  },
  emptyTitle: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: comfyColors.green,
    borderRadius: 18,
    paddingHorizontal: 28,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: '100%',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: comfyColors.green,
  },
  btnText: {
    color: comfyFontColors.green,
    fontSize: 16,
    fontWeight: "900",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 11, 18, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    zIndex: 999,
  },
  loadingText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  fabChatBtn: {
    position: "absolute",
    bottom: 84,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: comfyColors.green,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  fabCreateBtn: {
    position: "absolute",
    bottom: 16,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: comfyColors.green,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 80,
  },
  listItem: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.cardBorder,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  listItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  listItemIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.surface,
    flex: 1,
  },
  listItemDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    opacity: 0.5,
  },
  listItemDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailTimeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#a8a9bb',
  },
  listItemBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  listBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  listBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  listEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  listEmptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.surface,
    textAlign: 'center',
  },
  listEmptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  yearGrid: {
    padding: 16,
    gap: 12,
    paddingBottom: 80,
  },
  yearMonthCard: {
    width: '48%',
    marginBottom: 12,
  },
});