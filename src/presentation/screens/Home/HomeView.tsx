import React, { useMemo, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useActivityStore, useScheduleStore } from "../../../di/Dependencies";
import { useAppStore } from "../../../infrastructure/store/useAppStore";
import { ScheduledActivity } from "../../../domain/entities/Schedule";
import { useTheme } from "../../components/theme/colors";
import { JS_DAY_TO_DAYOFWEEK } from "../../utils/scheduleUtils";
import { LotusLandscape } from "../../components/atoms/Lotus/LotusLandscape";
import { LoadingScreen } from "../../components/atoms/Common/LoadingScreen";
import { useFocusSessionStore } from "../../../infrastructure/store/useFocusSessionStore";
import { useRewardsStore } from "../../../infrastructure/store/useRewardsStore";
import { useCalendarStore } from "../../../infrastructure/store/useCalendarStore";
import { ActivityDetailModal } from "../../components/organisms/Schedule/ActivityDetailModal";
import { useGoogleCalendarStore } from "../../../infrastructure/store/useGoogleCalendarStore";
import { RespuestaDeCierre } from "../../../infrastructure/api/RewardsApiService";
import { Reflexion } from "../../../domain/services/energyReflection";
import { EnergyRecord } from "../../../application/ports/out/EnergyRepository";
import {
  areaDestacada as calcularAreaDestacada,
} from "../../../domain/services/dayRecap";

import {
  makeEnergyLevels,
  areaTituloDe,
  formatMinutesRemaining,
} from "./HomeView.utils";
import {
  useCurrentTime,
  useTodaySchedule,
  useEnergyLevel,
  useDayClose,
  useTipoSapo,
} from "./hooks";
import {
  EmptyState,
  HomeHeader,
  EnergyCard,
  CurrentActivityCard,
  ScheduleTimeline,
  ProgressCard,
  ChangeActions,
  ScheduleStatusCards,
  DayModals,
  FABs,
} from "./components";
import { Sapo } from "../../components/atoms/Mascot/Sapo";
import { CarryOverCard } from "../../components/organisms/Rewards/CarryOverCard";

export default function HomeView() {
  const navigation = useNavigation<any>();
  const { colors, comfyColors, comfyFontColors, esClaro } = useTheme();
const isLight = esClaro;
  const ENERGY_LEVELS = useMemo(() => makeEnergyLevels(comfyColors, colors.cardBackground, isLight), [comfyColors, colors.cardBackground, isLight]);
  const styles = useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);

  // ── Stores ──
  const username = useAppStore((s) => s.username);
  const schedule = useScheduleStore((s) => s.schedule);
  const isLoadedFromStorage = useScheduleStore((s) => s.isLoadedFromStorage);
  const handleGenerateSchedule = useScheduleStore((s) => s.handleGenerateSchedule);
  const startHour = useScheduleStore((s) => s.startHour);
  const perDayStartHours = useScheduleStore((s) => s.perDayStartHours);
  const activities = useActivityStore((s) => s.activities);
  const loadActivities = useActivityStore((s) => s.loadActivities);
  const cargandoActividades = useActivityStore((s) => s.isLoading);
  const racha = useRewardsStore((s) => s.racha);
  const progreso = useRewardsStore((s) => s.progreso);
  const cargarLogros = useRewardsStore((s) => s.cargar);
  const completadas = useRewardsStore((s) => s.progreso.completadosIds);
  const noHechas = useRewardsStore((s) => s.progreso.noHechasIds);
  const alternarCompletada = useRewardsStore((s) => s.alternar);
  const diasTerminados = useRewardsStore((s) => s.diasTerminados);
  const cerrar = useRewardsStore((s) => s.cerrar);
  const pendientesPasados = useRewardsStore((s) => s.pendientesPasados);
  const marcarPasado = useRewardsStore((s) => s.marcarPasado);
  const sesion = useFocusSessionStore((s) => s.sesion);
  const iniciarSesion = useFocusSessionStore((s) => s.iniciarSesion);
  const anotarSalida = useFocusSessionStore((s) => s.anotarSalida);
  const terminarSesion = useFocusSessionStore((s) => s.terminar);
  const descartarSesion = useFocusSessionStore((s) => s.descartar);
  const guardandoSesion = useFocusSessionStore((s) => s.guardando);
  const rachaNueva = racha.actual > 1 && progreso.terminado;

  useEffect(() => {
    cargarLogros();
  }, [cargarLogros]);

  useFocusEffect(
    React.useCallback(() => {
      loadActivities();
    }, [loadActivities]),
  );

  useEffect(() => {
    if (isLoadedFromStorage && activities.length > 0 && schedule === null) {
      handleGenerateSchedule();
    }
  }, [isLoadedFromStorage, activities, schedule, handleGenerateSchedule]);

  const todayItems = useMemo(() => {
    const today = JS_DAY_TO_DAYOFWEEK[new Date().getDay()];
    const dayIndex = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'].indexOf(today);
    const displayStart = perDayStartHours?.[dayIndex] ?? startHour;
    return schedule?.getItemsByDay(today, displayStart) ?? [];
  }, [schedule, startHour, perDayStartHours]);

  // ── Hooks ──
  const currentTime = useCurrentTime();
  const { tipoSapo } = useTipoSapo();

  const currentMinutes = useMemo(
    () => currentTime.getHours() * 60 + currentTime.getMinutes(),
    [currentTime]
  );

  const {
    currentActivity,
    nextActivities,
    firstNext,
    minutesLeft,
    freeTimeMinutes,
    nextDayWithItems,
  } = useTodaySchedule({
    schedule,
    startHour,
    perDayStartHours,
    currentMinutes,
    todayItems,
    completadas,
  });

  const { selectedEnergy, energyIndex, savedEnergyIndex, reflexion, moveEnergy, handleSaveEnergy } = useEnergyLevel({
    energyLevels: ENERGY_LEVELS,
    handleGenerateSchedule,
  });

  const {
    ofrecerCierre,
    diaCerrado,
    setDiaCerrado,
    cerrandoDia,
    setCerrandoDia,
    recapPendiente,
    setRecapPendiente,
    respuestaDelCierre,
    setRespuestaDelCierre,
    sinResolver,
  } = useDayClose({
    currentTime,
    todayItems,
    completadas,
    noHechas,
  });

  // Google Calendar connection state
  const googleCalendarEstado = useGoogleCalendarStore((s) => s.estado);
  const googleCalendarConectado = googleCalendarEstado === 'conectado';

  const [selectedActivity, setSelectedActivity] = useState<ScheduledActivity | null>(null);

  // El carry-over se puede descartar "por ahora" en esta sesión, pero vuelve
  // a aparecer al reabrir la app mientras haya pendientes sin responder:
  // la regla es que siempre pregunta antes de actuar.
  const [carryOverDescartado, setCarryOverDescartado] = useState(false);
  const carryOverVisible =
    !carryOverDescartado && pendientesPasados.length > 0 && !ofrecerCierre;

  // ── Derived UI state ──
  const isCurrentTravel = currentActivity && (currentActivity.tipo === 'viaje' || !currentActivity.activity);

  const cardStatus = currentActivity
    ? {
        pill: isCurrentTravel ? "Traslado" : "En curso",
        pillColor: isCurrentTravel ? '#C8963E' : comfyColors.green,
        pillText: isCurrentTravel ? '#F5DEB3' : comfyFontColors.green,
        label: isCurrentTravel
          ? "Viaje"
          : currentActivity.activity
          ? areaTituloDe(currentActivity.activity.area)
          : "",
      }
    : firstNext
    ? {
        pill: "Siguiente",
        pillColor: comfyColors.skyBlue,
        pillText: comfyFontColors.skyBlue,
        label: firstNext.activity ? areaTituloDe(firstNext.activity.area) : "",
      }
    : {
        pill: "Libre",
        pillColor: colors.cardBorder,
        pillText: colors.surface,
        label: "",
      };

  const currentCardTitle = currentActivity
    ? (isCurrentTravel ? (currentActivity.nombre ?? 'Traslado') : (currentActivity.activity?.title ?? 'Actividad sin nombre'))
    : firstNext
    ? firstNext.activity?.title ?? 'Actividad sin nombre'
    : "Sin actividades pendientes";

  const areaDelDia = useMemo(
    () =>
      calcularAreaDestacada(
        todayItems
          .filter((item) => item.activity)
          .map((item) => ({
            id: String(item.activity!.id),
            area: item.activity!.area,
          })),
        completadas
      ),
    [todayItems, completadas]
  );

  // ── Empty states ──
  // isLoading arranca en true en el store, asi que cubre el primer frame.
  // Ademas hay que esperar a que el horario termine de hidratarse desde
  // storage (isLoadedFromStorage), o el render principal mostraria
  // "Sin bloques programados" un instante antes de saber si hay horario.
  if ((cargandoActividades && !activities.length) || !isLoadedFromStorage) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <LoadingScreen />
      </SafeAreaView>
    );
  }

  if (!activities.length) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <EmptyState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <DayModals
        diasTerminados={diasTerminados}
        racha={racha}
        progreso={progreso}
        sesion={sesion}
        guardandoSesion={guardandoSesion}
        todayItems={todayItems}
        onSalir={anotarSalida}
        onDescartar={descartarSesion}
        onTerminar={async () => {
          try {
            await terminarSesion();
            await cargarLogros();
          } catch {
          }
        }}
        ofrecerCierre={ofrecerCierre}
        sinResolver={sinResolver}
        cerrandoDia={cerrandoDia}
        setDiaCerrado={setDiaCerrado}
        setCerrandoDia={setCerrandoDia}
        cerrar={cerrar}
        recapPendiente={recapPendiente}
        diaCerrado={diaCerrado}
        setRecapPendiente={setRecapPendiente}
        respuestaDelCierre={respuestaDelCierre}
        setRespuestaDelCierre={setRespuestaDelCierre}
        areaDelDia={areaDelDia}
        startHour={startHour}
        selectedEnergy={selectedEnergy}
      />
      <CarryOverCard
        pendientes={pendientesPasados}
        onMarcar={async (activityId, fecha, hecha) => {
          await marcarPasado(activityId, fecha, hecha);
          await cargarLogros();
        }}
        onReprogramar={async (activityId, fecha, nuevaFecha) => {
          await useCalendarStore.getState().mover(activityId, fecha, nuevaFecha);
          await cargarLogros();
        }}
        onDismiss={() => setCarryOverDescartado(true)}
      />
      <View style={styles.lotusContainer}>
        <LotusLandscape testID="lotus-card" style={StyleSheet.absoluteFill} />
        <Sapo
          key={`sapo-${tipoSapo}`}
          estado="idle"
          size={300}
          style={styles.sapoOverlay}
          tipoSapo={tipoSapo}
        />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ProgressCard
          completadas={progreso.completadas}
          total={progreso.total}
          fraccion={progreso.fraccion}
        />

        {!googleCalendarConectado && (
          <View style={styles.googleCalendarBanner}>
            <Ionicons name="logo-google" size={24} color={colors.iconPrimary} />
            <Text style={styles.googleCalendarBannerText}>
              Conectá tu Google Calendar para ver tus eventos aquí
            </Text>
            <TouchableOpacity
              testID="vincular-calendario"
              style={styles.googleCalendarBannerButton}
              onPress={() => navigation.navigate("Setting")}
            >
              <Text style={styles.googleCalendarBannerButtonText}>
                Vincular ahora
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <ScheduleStatusCards schedule={schedule} />

        <CurrentActivityCard
          currentActivity={currentActivity}
          firstNext={firstNext}
          freeTimeMinutes={freeTimeMinutes}
          todayItems={todayItems}
          cardStatus={cardStatus}
          currentCardTitle={currentCardTitle}
          minutesLeft={minutesLeft}
          completadas={completadas}
          alternarCompletada={alternarCompletada}
          onPress={() => (currentActivity || firstNext) && setSelectedActivity(currentActivity || firstNext)}
          disabled={!currentActivity && !firstNext}
        />

        <ScheduleTimeline
          nextActivities={nextActivities}
          nextDayWithItems={nextDayWithItems}
          todayItems={todayItems}
          completadas={completadas}
          alternarCompletada={alternarCompletada}
          onPressActivity={setSelectedActivity}
        />

        <ActivityDetailModal
          onEnfocar={iniciarSesion}
          visible={selectedActivity !== null}
          activityItem={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onEdit={(activityId) => navigation.navigate("CreateActivityModal", { activityId })}
        />
      </ScrollView>

      <FABs />
    </SafeAreaView>
  );
}

const createStyles = (
  colors: ReturnType<typeof useTheme>['colors'],
  comfyColors: ReturnType<typeof useTheme>['comfyColors'],
  comfyFontColors: ReturnType<typeof useTheme>['comfyFontColors'],
) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 64,
  },
  lotusContainer: {
    height: 300,
    position: 'relative',
  },
  lotusCard: {
    height: 300,
  },
  sapoOverlay: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 22,
  },
  fabChatBtn: {
    position: 'absolute',
    bottom: 84,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: comfyColors.green,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  fabCreateBtn: {
    position: 'absolute',
    bottom: 16,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: comfyColors.green,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },

  googleCalendarBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.cardBackground,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  googleCalendarBannerText: {
    flex: 1,
    color: colors.surface,
    fontSize: 15,
    fontWeight: "700",
  },
  googleCalendarBannerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: comfyColors.green,
  },
  googleCalendarBannerButtonText: {
    color: comfyFontColors.green,
    fontSize: 14,
    fontWeight: "800",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  statusPill: {
    backgroundColor: comfyColors.green,
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  statusText: {
    color: comfyFontColors.green,
    fontSize: 16,
    fontWeight: "800",
  },
  classLabel: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "800",
  },
  currentTitle: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  timerText: {
    color: comfyColors.green,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: "900",
  },
  timerLabel: {
    color: colors.textTertiary,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 7,
  },
  changeTitle: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: "900",
  },
  changeSubtitle: {
    color: colors.surface,
    fontSize: 15,
    marginTop: 4,
    marginBottom: 18,
  },
  actionButton: {
    height: 44,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 11,
  },
  actionText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "800",
  },
  scheduleSection: {
    marginTop: 10,
  },
  sectionTitle: {
    color: colors.iconPrimary,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.4,
    marginBottom: 10,
    marginLeft: 12,
  },
  timeline: {
    borderLeftColor: colors.textTertiary,
    borderLeftWidth: 1,
    marginLeft: 22,
    paddingLeft: 15,
    gap: 18,
  },
  nextCard: {
    minHeight: 70,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  nextDayLabel: {
    color: comfyColors.skyBlue,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  nextTime: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  nextTitle: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "800",
  },
  saveEnergyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: 12,
    marginTop: 12,
    paddingHorizontal: 16,
    alignSelf: "center",
  },
  saveEnergyButtonText: {
    color: "#2b2d3b",
    fontSize: 14,
    fontWeight: "900",
  },
  infactibleCard: {
    backgroundColor: 'rgba(255, 183, 77, 0.12)',
    borderColor: comfyColors.yellow,
  },
  infactibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infactibleTitle: {
    color: comfyColors.yellow,
    fontSize: 16,
    fontWeight: '900',
  },
  infactibleSection: {
    marginTop: 8,
    paddingLeft: 4,
  },
  infactibleSectionTitle: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  infactibleBullet: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    paddingLeft: 8,
  },
  desconocidoCard: {
    backgroundColor: 'rgba(255, 183, 77, 0.08)',
    borderColor: comfyColors.yellow,
    paddingVertical: 12,
  },
  desconocidoText: {
    color: comfyColors.yellow,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
