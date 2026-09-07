/**
 * Hook que alimenta la función pura `construirSugerenciasSapo` con los datos
 * reales del usuario: actividades cargadas, horario vigente, tiempo libre de
 * hoy y si mañana tiene agenda. Devuelve hasta tres sugerencias para el chat.
 */

import { useMemo } from "react";

import { useActivityStore } from "../../../di/Dependencies";
import { useScheduleStore } from "../../../di/Dependencies";
import { useRewardsStore } from "../../../infrastructure/store/useRewardsStore";
import { useCurrentTime } from "../Home/hooks/useCurrentTime";
import { useTodaySchedule } from "../Home/hooks/useTodaySchedule";
import { JS_DAY_TO_DAYOFWEEK } from "../../utils/scheduleUtils";
import { construirSugerenciasSapo, esManana } from "./sugerenciasSapo";

export const useSugerenciasSapo = (): string[] => {
  const activities = useActivityStore((s) => s.activities);
  const schedule = useScheduleStore((s) => s.schedule);
  const startHour = useScheduleStore((s) => s.startHour);
  const perDayStartHours = useScheduleStore((s) => s.perDayStartHours);
  const currentTime = useCurrentTime();
  const completadas = useRewardsStore((s) => s.progreso.completadosIds);

  const hoy = JS_DAY_TO_DAYOFWEEK[currentTime.getDay()];
  const dayIndex = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'].indexOf(hoy);
  const displayStart = perDayStartHours?.[dayIndex] ?? startHour;
  const todayItems = schedule?.getItemsByDay(hoy, displayStart) ?? [];
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  const { freeTimeMinutes, nextDayWithItems } = useTodaySchedule({
    schedule,
    startHour,
    perDayStartHours,
    currentMinutes,
    todayItems,
    completadas,
  });

  return useMemo(
    () =>
      construirSugerenciasSapo({
        cantidadActividades: activities.length,
        hayHorario: schedule !== null,
        freeTimeMinutes,
        mananaTieneActividades: esManana(nextDayWithItems?.day ?? null, currentTime),
      }),
    [activities.length, schedule, freeTimeMinutes, nextDayWithItems, currentTime]
  );
};