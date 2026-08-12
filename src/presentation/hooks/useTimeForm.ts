import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { DayOfWeek, ActivityType } from "../../domain/entities/Activity";
import { calculateEndTime, areOverlapping, dateToMinutes, formatTime, calculateDurationAcrossMidnight, nextRoundHour } from "../../presentation/utils/timeUtils";
import { timeType } from "../../domain/entities/activity.types";
import { useActivityStore, useScheduleStore } from "../../di/Dependencies";
import { PartitionConfig } from "../../domain/entities/activity.types";
import { saveActivityProps } from "./props";
import {
  aBanderas,
  ComportamientoActividad,
  desdeBanderas,
} from "../../domain/entities/activityBehavior";
import { CampoConError } from "./useFormErrors";

/**
 * @param reportarError Donde mostrar los errores de validacion. Por defecto
 *   sigue siendo Alert.alert, para que cualquier llamador que no lo pase no
 *   cambie de comportamiento. La pantalla de crear actividad le pasa el
 *   reportador de errores por campo, que los deja bajo el control afectado en
 *   vez de taparlos con un popup que desaparece al tocarlo.
 */
export default function useTimeForm(
  reportarError: (campo: CampoConError, mensaje: string) => void = (_campo, mensaje) =>
    Alert.alert("Atención", mensaje),
) {
  const [activityName, setActivityName] = useState("");
  const [activityId, setActivityId] = useState<string | null>(null);
  const [isFixed, setIsFixed] = useState(true);
  const [identity, setIdentity] = useState<"clase" | "trabajo" | "tarea">("clase");
  const [priority, setPriority] = useState<"baja" | "media" | "alta">("media");
  const [difficulty, setDifficulty] = useState<"baja" | "media" | "alta">("media");
  const [deadline, setDeadline] = useState<Date | null>(null);

  const [preferredStartTime, setPreferredStartTime] = useState<number | null>(null);
  const [preferredEndTime, setPreferredEndTime] = useState<number | null>(null);
  const [optionalDay, setOptionalDay] = useState(false);
  const [dayFrom, setDayFrom] = useState<number | null>(null);
  const [dayTo, setDayTo] = useState<number | null>(null);
  const [isAnchor, setIsAnchor] = useState(false);

  const [selectedTimeTypeDuration, setSelectedTypeDuration] =
    useState<timeType>(timeType.both);
  const [selectedTimeTypeTravel, setSelectedTimeTypeTravel] =
    useState<timeType>(timeType.both);

  // travelTo/travelFrom default to 0 ("no travel") rather than null: the chip
  // row compares `partition.travelTo === chip.value`, so null left every chip
  // — including "Sin" — looking unselected, which reads as a pending required
  // field when the value is in fact already settled.
  const [partitions, setPartitions] = useState<PartitionConfig[]>(() => {
    const start = nextRoundHour();
    return [
      {
        startHour: start,
        endHour: calculateEndTime(start, 60),
        durationTime: 60,
        travelTo: 0,
        travelFrom: 0,
      },
    ];
  });
  const [activePartitionIndex, setActivePartitionIndex] = useState(0);

  const activePartition = partitions[activePartitionIndex] || partitions[0] || {
    startHour: nextRoundHour(),
    endHour: calculateEndTime(nextRoundHour(), 60),
    durationTime: 60,
    travelTo: 0,
    travelFrom: 0,
  };

  const durationTimeValue = activePartition.durationTime ?? 60;
  const travelToValue = activePartition.travelTo ?? null;
  const travelFromValue = activePartition.travelFrom ?? null;
  const startTime = activePartition.startHour ?? new Date();
  const endTime = activePartition.endHour ?? new Date();

  const { handleCreateActivity, activities } = useActivityStore();
  const { startHour: dayStartMin, endHour: dayEndMin, handleGenerateSchedule } = useScheduleStore();

  const handleSetIsFixed = (fixed: boolean) => {
    setIsFixed(fixed);
    // Ya no se tocan prioridad ni dificultad. Antes pasar a fija las ponia en
    // "alta" y "media" pisando lo que el usuario habia elegido, sin avisar y
    // ademas ocultando la seccion donde las habia elegido: el usuario volvia
    // y encontraba otros valores sin saber por que.
    //
    // Lo que sigue si corresponde: es una conversion de representacion, no
    // una preferencia. Una actividad fija describe su tiempo con inicio y
    // fin; una flexible, con una duracion. Al cambiar de una a otra hay que
    // derivar el dato que falta del que sobra.
    if (fixed) {
      setPartitions((prev) =>
        prev.map((p) => ({
          ...p,
          durationTime: calculateDurationAcrossMidnight(
            dateToMinutes(new Date(p.startHour)),
            dateToMinutes(new Date(p.endHour)),
          ),
        }))
      );
    } else {
      setPartitions((prev) =>
        prev.map((p) => ({
          ...p,
          endHour: calculateEndTime(p.startHour, p.durationTime),
        }))
      );
    }
  };

  /**
   * La identidad es solo una etiqueta: icono y color.
   *
   * Antes elegir "Clase" ponia la actividad en fija y "Tarea" en flexible, de
   * forma invisible. Eso convertia una eleccion estetica en una decision de
   * comportamiento, y dejaba al usuario sin forma de tener una clase flexible
   * o una tarea a hora fija, que son casos perfectamente normales.
   */
  const handleSetIdentity = (newIdentity: "clase" | "trabajo" | "tarea") => {
    setIdentity(newIdentity);
  };

  /**
   * El eje unico, derivado de las dos banderas que espera el solver.
   *
   * Se expone asi para que el formulario haga una sola pregunta en vez de
   * dos, sin tener que cambiar como se guarda la actividad.
   */
  const comportamiento = desdeBanderas(isFixed, isAnchor);

  const setComportamiento = (nuevo: ComportamientoActividad) => {
    const banderas = aBanderas(nuevo);
    // handleSetIsFixed y no setIsFixed: al cambiar entre hora fija y las
    // otras hay que convertir la representacion del tiempo, que es lo unico
    // que ese metodo sigue haciendo.
    handleSetIsFixed(banderas.isFixed);
    setIsAnchor(banderas.isAnchor);
  };

  const updateActivePartition = (updates: Partial<PartitionConfig>, index?: number) => {
    const idx = index ?? activePartitionIndex;
    setPartitions((prev) =>
      prev.map((p, i) => {
        if (i === idx) {
          const updated = { ...p, ...updates };
          if (isFixed) {
            // Both pickers sit on today's date, so a slot that runs past
            // midnight (23:00 -> 01:00) yields a negative raw difference.
            // Clamping that to 0 silently produced empty blocks; the rest of
            // the codebase (areOverlapping, the solver) already handles wrap,
            // so compute the duration the same way here.
            updated.durationTime = calculateDurationAcrossMidnight(
              dateToMinutes(new Date(updated.startHour)),
              dateToMinutes(new Date(updated.endHour)),
            );
          } else {
            if (updates.startHour || updates.durationTime !== undefined) {
              updated.endHour = calculateEndTime(
                updated.startHour,
                updated.durationTime,
              );
            }
          }
          return updated;
        }
        return p;
      }),
    );
  };

  const setDurationTime = (val: number | ((prev: number) => number)) => {
    const newValue = typeof val === "function" ? val(durationTimeValue) : val;
    updateActivePartition({ durationTime: newValue });
  };

  const setTravelToValue = (val: number | ((prev: number) => number), partitionIndex?: number) => {
    const current = travelToValue ?? 0;
    const newValue = typeof val === "function" ? val(current) : val;
    updateActivePartition({ travelTo: newValue }, partitionIndex);
  };

  const setTravelFromValue = (val: number | ((prev: number) => number), partitionIndex?: number) => {
    const current = travelFromValue ?? 0;
    const newValue = typeof val === "function" ? val(current) : val;
    updateActivePartition({ travelFrom: newValue }, partitionIndex);
  };

  const setStartTime = (val: Date | ((prev: Date) => Date)) => {
    const newValue = typeof val === "function" ? val(startTime) : val;
    updateActivePartition({ startHour: newValue });
  };

  const setEndTime = (val: Date | ((prev: Date) => Date)) => {
    const newValue = typeof val === "function" ? val(endTime) : val;
    updateActivePartition({ endHour: newValue });
  };

  const handleAddPartition = () => {
    const lastPartition = partitions[partitions.length - 1];
    const newStart = new Date(lastPartition.endHour.getTime() + 30 * 60000); 
    const newPartition: PartitionConfig = {
      startHour: newStart,
      endHour: calculateEndTime(newStart, 10),
      durationTime: 10,
      travelTo: null,
      travelFrom: null,
    };
    setPartitions((prev) => [...prev, newPartition]);
    setActivePartitionIndex(partitions.length);
  };

  const handleDiscardPartition = (index?: number) => {
    if (partitions.length <= 1) return;
    const targetIndex = index !== undefined ? index : activePartitionIndex;
    setPartitions((prev) => prev.filter((_, i) => i !== targetIndex));
    setActivePartitionIndex((prev) => {
      if (targetIndex === prev) {
        return prev > 0 ? prev - 1 : 0;
      }
      if (targetIndex < prev) {
        return prev - 1;
      }
      return prev;
    });
  };

  const handleAddGeneric = (
    setFn: (val: number | ((prev: number) => number)) => void,
    type: timeType,
  ) => {
    const amount = type === timeType.hour ? 60 : 10;
    setFn((prev) => prev + amount);
  };

  const handleSubGeneric = (
    setFn: (val: number | ((prev: number) => number)) => void,
    type: timeType,
  ) => {
    const amount = type === timeType.hour ? 60 : 10;
    setFn((prev) => Math.max(0, prev - amount));
  };

  const updateTime = (
    text: string,
    setFn: (val: number) => void,
    isHour: boolean,
    currentValue: number,
  ) => {
    const cleanText = text.replace(/[^0-9]/g, "");
    const value = Number(cleanText) || 0;

    if (isHour) {
      const currentMin = currentValue % 60;
      setFn(value * 60 + currentMin);
    } else {
      const currentH = Math.floor(currentValue / 60);
      setFn(currentH * 60 + value);
    }
  };

  const validatePartitions = (
    parts: PartitionConfig[],
    days: DayOfWeek[],
    silent?: boolean,
  ): boolean => {
    if (isFixed) {
      for (let i = 0; i < parts.length; i++) {
        const sMin = dateToMinutes(new Date(parts[i].startHour));
        const eMin = dateToMinutes(new Date(parts[i].endHour));

        // A slot that starts and ends at the same time has no duration and
        // would be saved as an empty block the solver cannot place.
        if (sMin === eMin) {
          const errorMsg = `El horario del día ${days.join(", ")} empieza y termina a la misma hora (${formatTime(new Date(parts[i].startHour))}). Ajusta la hora de fin.`;
          if (silent) throw new Error(errorMsg);
          reportarError("horario", errorMsg);
          return false;
        }

        for (let j = i + 1; j < parts.length; j++) {
          const sMin2 = dateToMinutes(new Date(parts[j].startHour));
          const eMin2 = dateToMinutes(new Date(parts[j].endHour));
          if (areOverlapping(sMin, eMin, sMin2, eMin2)) {
            const errorMsg = `Los bloques horarios para el día ${days.join(", ")} no pueden superponerse.`;
            if (silent) throw new Error(errorMsg);
            reportarError("horario", errorMsg);
            return false;
          }
        }
      }
    }
    return true;
  };

  const timeStrToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const minutesToTimeStr = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const hStr = h < 10 ? `0${h}` : `${h}`;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return `${hStr}:${mStr}`;
  };

  const validateOverlapWithSchedule = (
    currentId: string | null,
    isFixedActivity: boolean,
    days: DayOfWeek[],
    parts: PartitionConfig[],
    prefStart: number | null,
    prefEnd: number | null,
    duration: number,
    silent?: boolean,
  ): boolean => {
    const storeState = useScheduleStore.getState();
    const schedule = storeState.schedule;
    if (!schedule) return true;

    for (const day of days) {
      const dayIndex = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'].indexOf(day);
      const loopDisplayStartHour = storeState.perDayStartHours?.[dayIndex] ?? storeState.startHour;
      const scheduledItems = schedule.getItemsByDay(day, loopDisplayStartHour);
      const otherItems = scheduledItems.filter(
        (item) => item.activity && item.activity.id !== currentId && item.activity.type === ActivityType.FIXED
      );

      if (isFixedActivity) {
        for (const part of parts) {
          // El traslado forma parte del bloque ocupado: si sales media hora
          // antes y vuelves media hora despues, ese tiempo tampoco esta
          // libre. Comparar solo la actividad dejaba pasar choques que el
          // usuario despues veia superpuestos en el calendario.
          const partStart =
            dateToMinutes(new Date(part.startHour)) - (part.travelTo ?? 0);
          const partEnd =
            dateToMinutes(new Date(part.endHour)) + (part.travelFrom ?? 0);

          for (const item of otherItems) {
            const itemStart = timeStrToMinutes(item.assignedStartTime);
            const itemEnd = timeStrToMinutes(item.assignedEndTime);

            if (partStart < itemEnd && partEnd > itemStart) {
              // Se nombra el traslado en el mensaje: si no, el usuario ve
              // dos horarios que no se tocan y el aviso parece un error.
              const viaje =
                (part.travelTo ?? 0) > 0 || (part.travelFrom ?? 0) > 0
                  ? ", contando el tiempo de viaje"
                  : "";
              const errorMsg = `El horario del día ${day} (${formatTime(part.startHour)} - ${formatTime(part.endHour)})${viaje} se superpone con la actividad ya establecida "${item.activity?.title ?? 'Actividad sin nombre'}" (${item.assignedStartTime} - ${item.assignedEndTime}).`;
              if (silent) throw new Error(errorMsg);
              reportarError("horario", errorMsg);
              return false;
            }
          }
        }
      } else {
        if (prefStart !== null && prefEnd !== null) {
          let blockedMinutes = 0;
          let overlappingActivities: string[] = [];

          // Normalise preferred window to a flat timeline handling crossover
          let normPrefStart = prefStart;
          let normPrefEnd = prefEnd;
          if (normPrefEnd < normPrefStart) {
            normPrefEnd += 1440;
          }

          for (const item of otherItems) {
            const itemStart = timeStrToMinutes(item.assignedStartTime);
            let itemEnd = timeStrToMinutes(item.assignedEndTime);

            // Normalise item if it crosses midnight
            let normItemStart = itemStart;
            let normItemEnd = itemEnd;
            if (normItemEnd < normItemStart) {
              normItemEnd += 1440;
            }

            // If the item falls entirely before the normalised preferred window,
            // shift it forward by one day so overlap is computed correctly
            if (normItemEnd <= normPrefStart) {
              normItemStart += 1440;
              normItemEnd += 1440;
            }

            const overlapStart = Math.max(normPrefStart, normItemStart);
            const overlapEnd = Math.min(normPrefEnd, normItemEnd);

            if (overlapStart < overlapEnd) {
              blockedMinutes += (overlapEnd - overlapStart);
              overlappingActivities.push(`"${item.activity?.title ?? 'Actividad sin nombre'}" (${item.assignedStartTime} - ${item.assignedEndTime})`);
            }
          }

          const totalWindowMinutes = calculateDurationAcrossMidnight(prefStart, prefEnd);
          const freeMinutes = totalWindowMinutes - blockedMinutes;

          if (freeMinutes < duration) {
            const overlapText = overlappingActivities.length > 0
              ? ` debido a la superposición con: ${overlappingActivities.join(", ")}`
              : "";
            const errorMsg = `La ventana preferida el día ${day} (${minutesToTimeStr(prefStart)} - ${minutesToTimeStr(prefEnd)}) no deja suficiente tiempo libre para realizar la actividad (${duration} min)${overlapText}.`;
            if (silent) throw new Error(errorMsg);
            reportarError("ventana", errorMsg);
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleSaveActivity = async (overrides: saveActivityProps) => {
    const { daysDict, selectedDays, silent } = overrides;
    const configuredDays = Object.keys(daysDict) as DayOfWeek[];

    const finalName = overrides.activityName !== undefined ? overrides.activityName : activityName;
    const finalIsFixed = overrides.isFixed !== undefined ? overrides.isFixed : isFixed;
    const finalIdentity = overrides.identity !== undefined ? overrides.identity : identity;
    const finalPriorityStr = overrides.priority !== undefined ? overrides.priority : priority;
    const finalDifficultyStr = overrides.difficulty !== undefined ? overrides.difficulty : difficulty;
    const finalDeadline = overrides.deadline !== undefined ? overrides.deadline : deadline;
    const finalPrefStart = overrides.preferredStartTime !== undefined ? overrides.preferredStartTime : preferredStartTime;
    const finalPrefEnd = overrides.preferredEndTime !== undefined ? overrides.preferredEndTime : preferredEndTime;
    const finalOptionalDay = overrides.optionalDay !== undefined ? overrides.optionalDay : optionalDay;
    const finalDayFrom = overrides.dayFrom !== undefined ? overrides.dayFrom : dayFrom;
    const finalDayTo = overrides.dayTo !== undefined ? overrides.dayTo : dayTo;
    const finalIsAnchor = overrides.isAnchor !== undefined ? overrides.isAnchor : isAnchor;

    // Domain rule: una actividad flexible NO puede ser "clase" — clase siempre es fija.
    const sanitizedIdentity: 'clase' | 'trabajo' | 'tarea' =
      !finalIsFixed && finalIdentity === 'clase' ? 'tarea' : finalIdentity;

    if (!finalName.trim()) {
      const errorMsg = "Ingresa un nombre para la actividad";
      if (silent) throw new Error(errorMsg);
      reportarError("nombre", errorMsg);
      return;
    }

    if (configuredDays.length === 0) {
      const errorMsg = "Guarda la configuración de al menos un día";
      if (silent) throw new Error(errorMsg);
      reportarError("nombre", errorMsg);
      return;
    }

    // Usar la función de validación centralizada
    for (const day of configuredDays) {
      const config = daysDict[day]!;
      if (
        !validatePartitions(
          config.partitions,
          [day],
          silent,
        )
      ) {
        return;
      }
    }

    const priorityMap: Record<"baja" | "media" | "alta", number> = {
      baja: 1,
      media: 3,
      alta: 5,
    };

    // Validate per-day preferred windows are long enough
    for (const day of configuredDays) {
      const dayConfig = daysDict[day]!;
      const prefStart = dayConfig.preferredStartTime;
      const prefEnd = dayConfig.preferredEndTime;
      if (prefStart != null && prefEnd != null) {
        const partDuration = dayConfig.partitions.reduce(
          (sum, p) => sum + p.durationTime, 0
        );
        if (calculateDurationAcrossMidnight(prefStart, prefEnd) < partDuration) {
          const errorMsg = `La ventana preferida del ${day} es más corta que la duración estimada de la actividad en ese día.`;
          if (silent) throw new Error(errorMsg);
          reportarError("horario", errorMsg);
          return;
        }
      }
    }

    // Validate overlap with schedule
    for (const day of configuredDays) {
      const config = daysDict[day]!;
      if (
        !validateOverlapWithSchedule(
          activityId,
          finalIsFixed,
          [day],
          config.partitions,
          config.preferredStartTime ?? finalPrefStart,
          config.preferredEndTime ?? finalPrefEnd,
          config.partitions.reduce((sum, p) => sum + p.durationTime, 0),
          silent,
        )
      ) {
        return;
      }
    }

    const finalPriority = finalIsFixed ? 5 : priorityMap[finalPriorityStr];
    const finalDifficulty = finalIsFixed ? "media" : finalDifficultyStr;

    const finalId = activityId || Date.now().toString();
    setActivityId(finalId);

    await handleCreateActivity({
      id: finalId,
      activityName: finalName,
      isFixed: finalIsFixed,
      identity: sanitizedIdentity,
      priority: finalPriority,
      difficulty: finalDifficulty,
      deadline: finalDeadline ? finalDeadline.toISOString() : null,
      daysConfig: daysDict as Record<string, any>,
      days: configuredDays,
      preferredStartTime: finalPrefStart,
      preferredEndTime: finalPrefEnd,
      optionalDay: finalOptionalDay,
      dayFrom: finalDayFrom ?? undefined,
      dayTo: finalDayTo ?? undefined,
      isAnchor: finalIsAnchor || undefined,
    });

    try {
      await handleGenerateSchedule();
    } catch (e) {
      console.error("Error generating schedule after save:", e);
    }

    // Se devuelve el id porque `setActivityId` no sirve para leerlo aca: es
    // estado de React y no esta disponible hasta el proximo render. Quien
    // guarda a veces necesita saber que actividad quedo —el chat, para poder
    // llevar al usuario a verla.
    return finalId;
  };
  const resetPartitions = () => {
    setPartitions([
      {
        startHour: new Date(),
        endHour: calculateEndTime(new Date(), 60),
        durationTime: 60,
        travelTo: null,
        travelFrom: null,
      },
    ]);
    setActivePartitionIndex(0);
  };

  return {
    activityId,
    setActivityId,
    activityName,
    isFixed,
    identity,
    priority,
    difficulty,
    deadline,
    selectedTimeTypeDuration,
    selectedTimeTypeTravel,
    durationTimeValue,
    travelToValue,
    travelFromValue,
    startTime,
    endTime,
    partitions,
    activePartitionIndex,
    preferredStartTime,
    preferredEndTime,
    optionalDay,
    setActivityName,
    setIsFixed: handleSetIsFixed,
    comportamiento,
    setComportamiento,
    setIdentity: handleSetIdentity,
    setPriority,
    setDifficulty,
    setDeadline,
    setSelectedTypeDuration,
    setSelectedTimeTypeTravel,
    setDurationTime,
    setTravelToValue,
    setTravelFromValue,
    setStartTime,
    setEndTime,
    handleAddGeneric,
    handleSubGeneric,
    updateTime,
    validatePartitions,
    validateOverlapWithSchedule,
    handleSaveActivity,
    setPartitions,
    setActivePartitionIndex,
    handleAddPartition,
    handleDiscardPartition,
    resetPartitions,
    setPreferredStartTime,
    setPreferredEndTime,
    setOptionalDay,
    dayFrom,
    dayTo,
    isAnchor,
    setDayFrom,
    setDayTo,
    setIsAnchor,
  };
}
