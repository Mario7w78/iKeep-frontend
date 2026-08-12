import React, { useMemo, useState, useEffect } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useActivityStore, useScheduleStore } from "../../../di/Dependencies";
import { useAppStore } from "../../../infrastructure/store/useAppStore";
import { ScheduledActivity } from "../../../domain/entities/Schedule";
import { JS_DAY_TO_DAYOFWEEK } from "../../utils/scheduleUtils";
import { useTheme } from "../../components/theme/colors";
import { Sapo } from "../../components/atoms/Mascot/Sapo";
import { DailyProgress } from "../../components/atoms/Rewards/DailyProgress";
import { LoadingScreen } from "../../components/atoms/Common/LoadingScreen";
import { Celebration } from "../../components/atoms/Rewards/Celebration";
import { CompleteToggle } from "../../components/atoms/Rewards/CompleteToggle";
import { StreakBadge } from "../../components/atoms/Rewards/StreakBadge";
import { useRewardsStore } from "../../../infrastructure/store/useRewardsStore";
import { ActivityDetailModal } from "../../components/organisms/Schedule/ActivityDetailModal";
import {
  saveEnergyRecord,
  makeEnergyRecord,
  getEnergyHistory,
} from "../../../infrastructure/persistence/EnergyHistoryService";

const makeEnergyLevels = (
  c: typeof import("../../components/theme/colors").comfyColors,
  cardBg: string,
  isLight: boolean
) => [
  {
    label: "Baja energia",
    color: c.yellow,
    icon: "battery-dead",
    iconColor: c.yellow,
    gradient: isLight ? [cardBg, "#FFF9E6"] as const : [cardBg, "#4c4832"] as const,
  },
  {
    label: "Energia estable",
    color: c.green,
    icon: "battery-half",
    iconColor: c.green,
    gradient: isLight ? [cardBg, "#E8F9F0"] as const : [cardBg, "#2d3d33"] as const,
  },
  {
    label: "Alta energia",
    color: c.skyBlue,
    icon: "flash",
    iconColor: c.skyBlue,
    gradient: isLight ? [cardBg, "#EBF5FF"] as const : [cardBg, "#2c344d"] as const,
  },
];

const dayFormatter = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

const DAY_DISPLAY_NAMES: Record<string, string> = {
  'Lunes': 'Lunes',
  'Martes': 'Martes',
  'Miercoles': 'Miércoles',
  'Jueves': 'Jueves',
  'Viernes': 'Viernes',
  'Sabado': 'Sábado',
  'Domingo': 'Domingo',
};

export default function HomeView() {
  const navigation = useNavigation<any>();
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const isLight = colors.screenBackground.toLowerCase() === '#f1f6f3' || colors.screenBackground.toLowerCase() === '#ffffff';
  const ENERGY_LEVELS = useMemo(() => makeEnergyLevels(comfyColors, colors.cardBackground, isLight), [comfyColors, colors.cardBackground, isLight]);
  const styles = useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);

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
  const alternarCompletada = useRewardsStore((s) => s.alternar);
  const diasTerminados = useRewardsStore((s) => s.diasTerminados);
  const rachaNueva = racha.actual > 1 && progreso.terminado;

  // Al montar y nada mas: la racha cambia cuando el usuario marca algo, y
  // ese camino ya recarga por su cuenta.
  useEffect(() => {
    cargarLogros();
  }, [cargarLogros]);

  const [energyIndex, setEnergyIndex] = useState(0);
  const [savedEnergyIndex, setSavedEnergyIndex] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<ScheduledActivity | null>(null);

  // Initialize energy level from local storage history on mount
  useEffect(() => {
    const initEnergy = async () => {
      try {
        const history = await getEnergyHistory(1);
        if (history.length > 0) {
          const latest = history[history.length - 1];
          const idx = latest.nivel - 1;
          if (idx >= 0 && idx < ENERGY_LEVELS.length) {
            setEnergyIndex(idx);
            setSavedEnergyIndex(idx);
          }
        } else {
          setEnergyIndex(1); // Default to stable (index 1)
          setSavedEnergyIndex(1);
        }
      } catch (e) {
        console.error("Error loading energy history:", e);
      }
    };
    initEnergy();
  }, []);

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

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const currentMinutes = useMemo(() => {
    return currentTime.getHours() * 60 + currentTime.getMinutes();
  }, [currentTime]);

  const currentActivity = useMemo(() => {
    return todayItems.find((item) => {
      const start = toMinutes(item.assignedStartTime);
      const end = toMinutes(item.assignedEndTime);
      return currentMinutes >= start && currentMinutes <= end;
    });
  }, [todayItems, currentMinutes]);

  const nextActivities = useMemo(() => {
    return todayItems.filter((item) => {
      const start = toMinutes(item.assignedStartTime);
      return start > currentMinutes && item.activity !== undefined && item.tipo !== 'viaje';
    });
  }, [todayItems, currentMinutes]);

  const firstNext = nextActivities[0];

  const nextDayWithItems = useMemo(() => {
    if (!schedule) return null;
    const today = new Date().getDay();
    for (let offset = 1; offset <= 7; offset++) {
      const dayIndex = (today + offset) % 7;
      const dayOfWeek = JS_DAY_TO_DAYOFWEEK[dayIndex];
      const loopDayIndex = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'].indexOf(dayOfWeek);
      const displayStart = perDayStartHours?.[loopDayIndex] ?? startHour;
      const items = schedule.getItemsByDay(dayOfWeek, displayStart);
      const filteredItems = items.filter(item => item.activity !== undefined && item.tipo !== 'viaje');
      if (filteredItems.length > 0) {
        return { day: dayOfWeek, items: filteredItems };
      }
    }
    return null;
  }, [schedule, startHour, perDayStartHours]);

  const minutesLeft = useMemo(() => {
    if (!currentActivity) return null;
    return Math.max(toMinutes(currentActivity.assignedEndTime) - currentMinutes, 0);
  }, [currentActivity, currentMinutes]);

  const freeTimeMinutes = useMemo(() => {
    // Only in "free" state: no current activity AND no upcoming activities
    if (currentActivity || nextActivities.length > 0 || !schedule) return null;
    if (todayItems.length === 0) {
      // No activities scheduled today → free from now to midnight
      return Math.max(24 * 60 - currentMinutes, 0);
    }
    // All today's activities are done → free from last end to midnight
    const lastItem = todayItems[todayItems.length - 1];
    const lastEnd = toMinutes(lastItem.assignedEndTime);
    return Math.max(24 * 60 - Math.max(lastEnd, currentMinutes), 0);
  }, [todayItems, currentMinutes, currentActivity, nextActivities, schedule]);

  const selectedEnergy = ENERGY_LEVELS[energyIndex];

  const moveEnergy = (direction: -1 | 1) => {
    setEnergyIndex((current) => {
      const next = current + direction;
      if (next < 0) return ENERGY_LEVELS.length - 1;
      if (next >= ENERGY_LEVELS.length) return 0;
      return next;
    });
  };

  const handleSaveEnergy = () => {
    Alert.alert(
      "Actualizar horario",
      `¿Estás seguro de que quieres actualizar tu horario para adaptarlo a un nivel de "${selectedEnergy.label.toLowerCase()}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => {
            // Revert back to the saved state
            setEnergyIndex(savedEnergyIndex);
          },
        },
        {
          text: "Sí, actualizar",
          style: "default",
          onPress: async () => {
            setSavedEnergyIndex(energyIndex);
            try {
              const nivel = energyIndex + 1;
              await saveEnergyRecord(makeEnergyRecord(nivel));
              const historial = await getEnergyHistory(14);
              await handleGenerateSchedule({
                nivel_energia: nivel,
                historial_energia: historial,
              }, true);
            } catch (e) {
              console.error("Error updating schedule with energy:", e);
            }
          },
        },
      ]
    );
  };



  const getIdentityLabel = (val?: string) => {
    switch (val) {
      case "clase": return "Clase";
      case "trabajo": return "Trabajo";
      default: return "Tarea";
    }
  };

  const isCurrentTravel = currentActivity && (currentActivity.tipo === 'viaje' || !currentActivity.activity);

  const cardStatus = currentActivity
    ? {
        pill: isCurrentTravel ? "Traslado" : "En curso",
        pillColor: isCurrentTravel ? '#C8963E' : comfyColors.green,
        pillText: isCurrentTravel ? '#F5DEB3' : comfyFontColors.green,
        label: isCurrentTravel ? "Viaje" : getIdentityLabel(currentActivity.activity?.identity),
      }
    : firstNext
    ? {
        pill: "Siguiente",
        pillColor: comfyColors.skyBlue,
        pillText: comfyFontColors.skyBlue,
        label: getIdentityLabel(firstNext.activity?.identity),
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

  const formatMinutesRemaining = (minutes: number | null) => {
    if (minutes === null) return "--";
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };



  // Antes del estado vacio: mientras los datos vienen, "no hay actividades"
  // es una afirmacion que todavia no se puede hacer, y quien tiene veinte
  // creadas la lee como que se le borraron.
  if (cargandoActividades && !activities.length) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <LoadingScreen />
      </SafeAreaView>
    );
  }

  if (!activities.length) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={54} color={comfyColors.skyBlue} />
          </View>
          <Text style={styles.emptyTitle}>No hay actividades</Text>
          <Text style={styles.emptyDescription}>
            Crea tu primera actividad para que iKeep pueda armar tu horario.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("CreateActivityModal")}
          >
            <Ionicons name="add-circle-outline" size={22} color={comfyFontColors.green} />
            <Text style={styles.emptyButtonText}>Crear actividad manualmente</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.emptyButton, styles.emptyButtonSecondary]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("AIChatView")}
          >
            <Ionicons name="chatbubbles-outline" size={22} color={comfyColors.green} />
            <Text style={[styles.emptyButtonText, { color: comfyColors.green }]}>Crear actividad con el asistente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* La `key` es lo que hace que cada celebracion sea un montaje nuevo.
          Reusar el componente obligaria a reiniciar sus valores animados con
          setValue, que es justo lo que rompe cuando los maneja el hilo
          nativo. */}
      <Celebration
        key={diasTerminados}
        disparo={diasTerminados}
        mensaje={rachaNueva ? `¡${racha.actual} días seguidos!` : undefined}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.mascot}
            activeOpacity={0.75}
            onPress={() => navigation.navigate("AIChatView")}
          >
            {/* La pantalla que el usuario abre todos los dias, y ya era
                el atajo al chat: es donde la mascota mas se ve. */}
            <Sapo estado="idle" tamano={72} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Hola, {username || "Usuario"}. Tu día está listo.</Text>
            <Text style={styles.date}>{dayFormatter.format(new Date())}</Text>
          </View>
          {/* La racha vive en el encabezado y no en una pantalla aparte: si
              hay que ir a buscarla, deja de ser un motivo para volver. */}
          <StreakBadge dias={racha.actual} enRiesgo={racha.enRiesgo} />
        </View>

        <View style={styles.progresoDelDia}>
          <DailyProgress
            completadas={progreso.completadas}
            total={progreso.total}
            fraccion={progreso.fraccion}
          />
        </View>

        <LinearGradient
          colors={selectedEnergy.gradient}
          style={[styles.card, styles.energyCard]}
        >
          <Text style={styles.cardTitle}>¿Cómo está tu nivel de energía hoy?</Text>
          <View style={styles.energySelector}>
            <Pressable onPress={() => moveEnergy(-1)} hitSlop={12}>
              <Ionicons name="chevron-back" size={34} color={colors.surface} />
            </Pressable>
            <View style={styles.energyOrb}>
              <Ionicons 
                name={selectedEnergy.icon as any} 
                size={40} 
                color={selectedEnergy.iconColor} 
              />
            </View>
            <Pressable onPress={() => moveEnergy(1)} hitSlop={12}>
              <Ionicons name="chevron-forward" size={34} color={colors.surface} />
            </Pressable>
          </View>
          <Text style={styles.energyLabel}>{selectedEnergy.label}</Text>

          {/* Guardar Button */}
          {energyIndex !== savedEnergyIndex && (
            <TouchableOpacity
              style={[
                styles.saveEnergyButton,
                { backgroundColor: selectedEnergy.iconColor },
              ]}
              activeOpacity={0.8}
              onPress={handleSaveEnergy}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={colors.screenBackground}
              />
              <Text style={styles.saveEnergyButtonText}>Guardar</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>

        {/* INFACTIBLE info card */}
        {schedule?.estado === 'INFACTIBLE' && (
          <View style={[styles.card, styles.infactibleCard]}>
            <View style={styles.infactibleHeader}>
              <Ionicons name="warning-outline" size={22} color={comfyColors.yellow} />
              <Text style={styles.infactibleTitle}>Horario parcialmente generado</Text>
            </View>
            {schedule.recomendaciones.length > 0 && (
              <View style={styles.infactibleSection}>
                <Text style={styles.infactibleSectionTitle}>Recomendaciones:</Text>
                {schedule.recomendaciones.map((rec, idx) => (
                  <Text key={idx} style={styles.infactibleBullet}>• {rec}</Text>
                ))}
              </View>
            )}
            {schedule.tareasOmitidas.length > 0 && (
              <View style={styles.infactibleSection}>
                <Text style={styles.infactibleSectionTitle}>
                  {schedule.tareasOmitidas.length} tarea{schedule.tareasOmitidas.length > 1 ? 's' : ''} no se pudieron programar:
                </Text>
                {schedule.tareasOmitidas.map((name, idx) => (
                  <Text key={idx} style={styles.infactibleBullet}>• {name}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* DESCONOCIDO warning */}
        {schedule?.estado === 'DESCONOCIDO' && (
          <View style={[styles.card, styles.desconocidoCard]}>
            <View style={styles.infactibleHeader}>
              <Ionicons name="time-outline" size={20} color={comfyColors.yellow} />
              <Text style={styles.desconocidoText}>
                El servidor no encontró respuesta a tiempo, mostrando horario base
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.card}
          activeOpacity={0.75}
          onPress={() => (currentActivity || firstNext) && setSelectedActivity(currentActivity || firstNext)}
          disabled={!currentActivity && !firstNext}
        >
          <View style={styles.statusRow}>
            <View style={[styles.statusPill, { backgroundColor: cardStatus.pillColor }]}>
              <Text style={[styles.statusText, { color: cardStatus.pillText }]}>
                {cardStatus.pill}
              </Text>
            </View>
            {cardStatus.label !== "" && (
              <Text style={styles.classLabel}>{cardStatus.label}</Text>
            )}
          </View>
          <Text style={styles.currentTitle}>
            {currentCardTitle}
          </Text>
          {currentActivity ? (
            <View style={styles.timerRow}>
              <Text style={styles.timerText}>
                {formatMinutesRemaining(minutesLeft)}
              </Text>
              <Text style={styles.timerLabel}>restantes</Text>
            </View>
          ) : firstNext ? (
            <View style={styles.timerRow}>
              <Text style={[styles.timerText, { color: comfyColors.skyBlue }]}>
                {firstNext.assignedStartTime}
              </Text>
              <Text style={styles.timerLabel}>hora de inicio</Text>
            </View>
          ) : freeTimeMinutes !== null ? (
            <View style={styles.timerRow}>
              <Text style={[styles.timerText, { color: comfyColors.green }]}>
                {formatMinutesRemaining(freeTimeMinutes)}
              </Text>
              <Text style={styles.timerLabel}>
                {todayItems.length > 0 ? "hasta fin del día" : "libres hoy"}
              </Text>
            </View>
          ) : (
            <View style={styles.timerRow}>
              <Text style={[styles.timerText, { color: comfyColors.green }]}>
                Listo
              </Text>
              <Text style={styles.timerLabel}>¡Día completado!</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.changeTitle}>¿Algo cambió hoy?</Text>
          <Text style={styles.changeSubtitle}>
            Crea una actividad o administra las que ya tienes
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.75}
            onPress={() => navigation.navigate("CreateActivityModal")}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.surface} />
            <Text style={styles.actionText}>Crear nueva actividad</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.75}
            onPress={() => navigation.navigate("Activities")}
          >
            <Ionicons name="list-outline" size={20} color={colors.surface} />
            <Text style={styles.actionText}>Ver mis actividades</Text>
          </TouchableOpacity>
        </View>

        {schedule && (nextActivities.length > 0 || nextDayWithItems || todayItems.length > 0) && (
          <View style={styles.scheduleSection}>
            <Text style={styles.sectionTitle}>PRÓXIMO EN TU HORARIO</Text>
            <View style={styles.timeline}>
              {nextActivities.length > 0 ? (
                nextActivities.slice(0, 3).map((item, index) => (
                  <TouchableOpacity 
                    key={`${item.activity?.id ?? item.tipo ?? index}-${index}`} 
                    style={styles.nextCard}
                    activeOpacity={0.75}
                    onPress={() => item.activity && setSelectedActivity(item)}
                  >
                    {/* La casilla va acá y no en una pantalla aparte: se
                        marca al pasar, muchas veces caminando. Si hay que
                        entrar a buscarla, no se marca nada. */}
                    {item.activity && (
                      <CompleteToggle
                        completada={completadas.includes(String(item.activity.id))}
                        nombre={item.activity.title}
                        onToggle={() => alternarCompletada(String(item.activity!.id))}
                      />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nextTime}>
                        {item.assignedStartTime} - {item.assignedEndTime}
                      </Text>
                      <Text
                        style={[
                          styles.nextTitle,
                          item.activity &&
                            completadas.includes(String(item.activity.id)) &&
                            styles.nextTitleHecha,
                        ]}
                      >
                        {item.activity?.title ?? (item.tipo === 'trabajo' || item.tipo === 'viaje' ? '🚗 Viaje' : 'Actividad')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.iconSecondary} />
                  </TouchableOpacity>
                ))
              ) : nextDayWithItems ? (
                <>
                  <Text style={styles.nextDayLabel}>{DAY_DISPLAY_NAMES[nextDayWithItems.day]}</Text>
                  {nextDayWithItems.items.slice(0, 3).map((item, index) => (
                    <TouchableOpacity 
                      key={`nextday-${item.activity?.id ?? item.tipo ?? index}-${index}`} 
                      style={styles.nextCard}
                      activeOpacity={0.75}
                      onPress={() => item.activity && setSelectedActivity(item)}
                    >
                      <View>
                        <Text style={styles.nextTime}>
                          {item.assignedStartTime} - {item.assignedEndTime}
                        </Text>
                        <Text style={styles.nextTitle}>{item.activity?.title ?? (item.tipo === 'trabajo' || item.tipo === 'viaje' ? '🚗 Viaje' : 'Actividad')}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.iconSecondary} />
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <View style={styles.nextCard}>
                  <View>
                    <Text style={styles.nextTime}>
                      {todayItems.length > 0 ? "Día completado" : "Sin bloques programados"}
                    </Text>
                    <Text style={styles.nextTitle}>
                      {todayItems.length > 0 ? "¡Terminaste por hoy!" : "Genera tu horario"}
                    </Text>
                  </View>
                  <Ionicons
                    name={todayItems.length > 0 ? "checkmark-circle-outline" : "calendar-outline"}
                    size={22}
                    color={todayItems.length > 0 ? comfyColors.green : colors.iconSecondary}
                  />
                </View>
              )}
            </View>
          </View>
        )}
        <ActivityDetailModal
          visible={selectedActivity !== null}
          activityItem={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onEdit={(activityId) => navigation.navigate("CreateActivityModal", { activityId })}
        />
      </ScrollView>

      {/* Chat FAB */}
      <TouchableOpacity
        style={styles.fabChatBtn}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("AIChatView")}
      >
        <Ionicons name="chatbubbles-outline" size={26} color={comfyColors.green} />
      </TouchableOpacity>

      {/* FAB to create activity */}
      <TouchableOpacity
        style={styles.fabCreateBtn}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("CreateActivityModal")}
      >
        <Ionicons name="add" size={32} color={comfyFontColors.green} />
      </TouchableOpacity>
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
  progresoDelDia: {
    marginBottom: 18,
  },
  nextTitleHecha: {
    textDecorationLine: 'line-through',
    opacity: 0.55,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 64,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 28,
  },
  mascot: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${comfyColors.green}24`,
    shadowColor: comfyColors.green,
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  sapoMascotImage: {
    width: 38,
    height: 40,
    resizeMode: "contain",
  },
  title: {
    color: colors.surface,
    fontSize: 20,
    fontStyle: "italic",
    fontWeight: "800",
  },
  date: {
    color: colors.textTertiary,
    fontSize: 14,
    marginTop: 2,
  },
  energyCard: {
    minHeight: 200,
  },
  cardTitle: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  energySelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 18,
  },
  energyOrb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  energyLabel: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(165, 178, 235, 0.15)",
    borderColor: comfyColors.skyBlue,
    borderWidth: 2,
    borderStyle: "dashed",
    marginBottom: 22,
  },
  emptyTitle: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },
  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 26,
    textAlign: "center",
  },
  emptyButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: comfyColors.green,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 28,
    width: '100%',
  },
  emptyButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: comfyColors.green,
    marginTop: 12,
  },
  emptyButtonText: {
    color: comfyFontColors.green,
    fontSize: 16,
    fontWeight: "900",
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
    // Con la casilla delante, el hueco lo pone el gap y no el space-between:
    // asi el titulo se queda pegado a su casilla en vez de irse al centro.
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
