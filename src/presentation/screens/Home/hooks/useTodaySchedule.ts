import { useMemo } from "react";

import { ScheduledActivity } from "../../../../domain/entities/Schedule";
import { JS_DAY_TO_DAYOFWEEK } from "../../../utils/scheduleUtils";
import { toMinutes } from "../HomeView.utils";
import { Schedule } from "../../../../domain/entities/Schedule";

interface UseTodayScheduleParams {
  schedule: Schedule | null;
  startHour: number | null;
  perDayStartHours: number[] | null;
  currentMinutes: number;
  todayItems: ScheduledActivity[];
  completadas: string[];
}

interface UseTodayScheduleReturn {
  currentActivity: ScheduledActivity | null;
  nextActivities: ScheduledActivity[];
  firstNext: ScheduledActivity | null;
  minutesLeft: number | null;
  freeTimeMinutes: number | null;
  nextDayWithItems: { day: string; items: ScheduledActivity[] } | null;
}

/**
 * Hook que deriva todo el estado computado del horario de hoy
 * a partir de los datos crudos del store y la hora actual.
 */
export const useTodaySchedule = ({
  schedule,
  startHour,
  perDayStartHours,
  currentMinutes,
  todayItems,
  completadas,
}: UseTodayScheduleParams): UseTodayScheduleReturn => {
  const currentActivity = useMemo(() => {
    return todayItems.find((item) => {
      const start = toMinutes(item.assignedStartTime);
      const end = toMinutes(item.assignedEndTime);
      return currentMinutes >= start && currentMinutes <= end;
    }) ?? null;
  }, [todayItems, currentMinutes]);

  const nextActivities = useMemo(() => {
    return todayItems.filter((item) => {
      const start = toMinutes(item.assignedStartTime);
      return start > currentMinutes && item.activity !== undefined && item.tipo !== 'viaje';
    });
  }, [todayItems, currentMinutes]);

  const firstNext = nextActivities[0] ?? null;

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

  const nextDayWithItems = useMemo(() => {
    if (!schedule) return null;
    const today = new Date().getDay();
    for (let offset = 1; offset <= 7; offset++) {
      const dayIndex = (today + offset) % 7;
      const dayOfWeek = JS_DAY_TO_DAYOFWEEK[dayIndex];
      const loopDayIndex = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'].indexOf(dayOfWeek);
      const displayStart = perDayStartHours?.[loopDayIndex] ?? startHour ?? undefined;
      const items = schedule.getItemsByDay(dayOfWeek, displayStart);
      const filteredItems = items.filter(item => item.activity !== undefined && item.tipo !== 'viaje');
      if (filteredItems.length > 0) {
        return { day: dayOfWeek, items: filteredItems };
      }
    }
    return null;
  }, [schedule, startHour, perDayStartHours]);

  return {
    currentActivity,
    nextActivities,
    firstNext,
    minutesLeft,
    freeTimeMinutes,
    nextDayWithItems,
  };
};