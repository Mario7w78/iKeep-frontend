import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { DayOfWeek } from "../../domain/entities/Activity";
import { calculateEndTime, areOverlapping, dateToMinutes, formatTime } from "../../presentation/utils/timeUtils";
import { timeType } from "../../domain/entities/activity.types";
import { useActivityStore, useScheduleStore } from "../../di/Dependencies";
import { PartitionConfig } from "../../domain/entities/activity.types";
import { saveActivityProps } from "./props";

export default function useTimeForm() {
  const [activityName, setActivityName] = useState("");
  const [activityId, setActivityId] = useState<string | null>(null);
  const [isFixed, setIsFixed] = useState(true);
  const [identity, setIdentity] = useState<"clase" | "trabajo" | "tarea">("clase");
  const [priority, setPriority] = useState<"baja" | "media" | "alta">("media");
  const [difficulty, setDifficulty] = useState<"baja" | "media" | "alta">("media");
  const [deadline, setDeadline] = useState<Date | null>(null);

  const [preferredStartTime, setPreferredStartTime] = useState<number | null>(null);
  const [preferredEndTime, setPreferredEndTime] = useState<number | null>(null);

  const [selectedTimeTypeDuration, setSelectedTypeDuration] =
    useState<timeType>(timeType.both);
  const [selectedTimeTypeTravel, setSelectedTimeTypeTravel] =
    useState<timeType>(timeType.both);

  const [partitions, setPartitions] = useState<PartitionConfig[]>([
    {
      startHour: new Date(),
      endHour: calculateEndTime(new Date(), 60),
      durationTime: 60,
      travelTime: 0,
    },
  ]);
  const [activePartitionIndex, setActivePartitionIndex] = useState(0);

  const activePartition = partitions[activePartitionIndex] || partitions[0];

  const durationTimeValue = activePartition.durationTime;
  const travelTimeValue = activePartition.travelTime;
  const startTime = activePartition.startHour;
  const endTime = activePartition.endHour;

  const { handleCreateActivity, activities } = useActivityStore();
  const { startHour: dayStartMin, endHour: dayEndMin, handleGenerateSchedule } = useScheduleStore();

  const handleSetIsFixed = (fixed: boolean) => {
    setIsFixed(fixed);
    if (fixed) {
      setPriority("alta");
      setDifficulty("media");
      setPartitions((prev) =>
        prev.map((p) => {
          const diffMs = p.endHour.getTime() - p.startHour.getTime();
          const diffMin = Math.max(0, Math.round(diffMs / 60000));
          return { ...p, durationTime: diffMin };
        })
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

  const handleSetIdentity = (newIdentity: "clase" | "trabajo" | "tarea") => {
    setIdentity(newIdentity);
    if (newIdentity === "tarea") {
      handleSetIsFixed(false);
    } else if (newIdentity === "clase") {
      handleSetIsFixed(true);
    }
  };

  const updateActivePartition = (updates: Partial<PartitionConfig>) => {
    setPartitions((prev) =>
      prev.map((p, i) => {
        if (i === activePartitionIndex) {
          const updated = { ...p, ...updates };
          if (isFixed) {
            const diffMs = updated.endHour.getTime() - updated.startHour.getTime();
            const diffMin = Math.round(diffMs / 60000);
            updated.durationTime = Math.max(0, diffMin);
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

  const setTravelTime = (val: number | ((prev: number) => number)) => {
    const newValue = typeof val === "function" ? val(travelTimeValue) : val;
    updateActivePartition({ travelTime: newValue });
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
      travelTime: 0,
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
  ): boolean => {
    if (isFixed) {
      for (let i = 0; i < parts.length; i++) {
        const sMin = dateToMinutes(new Date(parts[i].startHour));
        const eMin = dateToMinutes(new Date(parts[i].endHour));
        for (let j = i + 1; j < parts.length; j++) {
          const sMin2 = dateToMinutes(new Date(parts[j].startHour));
          const eMin2 = dateToMinutes(new Date(parts[j].endHour));
          if (areOverlapping(sMin, eMin, sMin2, eMin2)) {
            Alert.alert(
              "Atención",
              `Los bloques horarios para el día ${days.join(", ")} no pueden superponerse.`
            );
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
  ): boolean => {
    const schedule = useScheduleStore.getState().schedule;
    if (!schedule) return true;

    for (const day of days) {
      const scheduledItems = schedule.getItemsByDay(day);
      const otherItems = scheduledItems.filter(
        (item) => item.activity.id !== currentId
      );

      if (isFixedActivity) {
        for (const part of parts) {
          const partStart = dateToMinutes(new Date(part.startHour));
          const partEnd = dateToMinutes(new Date(part.endHour));

          for (const item of otherItems) {
            const itemStart = timeStrToMinutes(item.assignedStartTime);
            const itemEnd = timeStrToMinutes(item.assignedEndTime);

            if (partStart < itemEnd && partEnd > itemStart) {
              Alert.alert(
                "Conflicto de Horario",
                `El horario del día ${day} (${formatTime(part.startHour)} - ${formatTime(part.endHour)}) se superpone con la actividad ya establecida "${item.activity.title}" (${item.assignedStartTime} - ${item.assignedEndTime}).`
              );
              return false;
            }
          }
        }
      } else {
        if (prefStart !== null && prefEnd !== null) {
          let blockedMinutes = 0;
          let overlappingActivities: string[] = [];

          for (const item of otherItems) {
            const itemStart = timeStrToMinutes(item.assignedStartTime);
            const itemEnd = timeStrToMinutes(item.assignedEndTime);

            const overlapStart = Math.max(prefStart, itemStart);
            const overlapEnd = Math.min(prefEnd, itemEnd);

            if (overlapStart < overlapEnd) {
              blockedMinutes += (overlapEnd - overlapStart);
              overlappingActivities.push(`"${item.activity.title}" (${item.assignedStartTime} - ${item.assignedEndTime})`);
            }
          }

          const totalWindowMinutes = prefEnd - prefStart;
          const freeMinutes = totalWindowMinutes - blockedMinutes;

          if (freeMinutes < duration) {
            const overlapText = overlappingActivities.length > 0
              ? ` debido a la superposición con: ${overlappingActivities.join(", ")}`
              : "";
            Alert.alert(
              "Conflicto de Horario",
              `La ventana preferida el día ${day} (${minutesToTimeStr(prefStart)} - ${minutesToTimeStr(prefEnd)}) no deja suficiente tiempo libre para realizar la actividad (${duration} min)${overlapText}.`
            );
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleSaveActivity = async ({
    daysDict,
    selectedDays,
  }: saveActivityProps) => {
    const configuredDays = Object.keys(daysDict) as DayOfWeek[];

    if (!activityName.trim()) {
      Alert.alert("Atención", "Ingresa un nombre para la actividad");
      return;
    }

    if (configuredDays.length === 0) {
      Alert.alert("Atención", "Guarda la configuración de al menos un día");
      return;
    }

    // Usar la función de validación centralizada
    for (const day of configuredDays) {
      const config = daysDict[day]!;
      if (
        !validatePartitions(
          config.partitions,
          [day],
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

    // If preferred window is set, validate length >= duration of task
    if (preferredStartTime !== null && preferredEndTime !== null) {
      const durationVal = durationTimeValue;
      if (preferredEndTime - preferredStartTime < durationVal) {
        Alert.alert("Atención", `La ventana seleccionada es más corta que la duración estimada de la actividad.`);
        return;
      }
    }

    const finalPriority = isFixed ? 5 : priorityMap[priority];
    const finalDifficulty = isFixed ? "media" : difficulty;

    await handleCreateActivity({
      id: activityId || undefined,
      activityName,
      isFixed,
      identity,
      priority: finalPriority,
      difficulty: finalDifficulty,
      deadline: deadline ? deadline.toISOString() : null,
      daysConfig: daysDict,
      days: configuredDays,
      preferredStartTime,
      preferredEndTime,
    });

    try {
      await handleGenerateSchedule();
    } catch (e) {
      console.error("Error generating schedule after save:", e);
    }
  };
  const resetPartitions = () => {
    setPartitions([
      {
        startHour: new Date(),
        endHour: calculateEndTime(new Date(), 60),
        durationTime: 60,
        travelTime: 0,
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
    travelTimeValue,
    startTime,
    endTime,
    partitions,
    activePartitionIndex,
    preferredStartTime,
    preferredEndTime,
    setActivityName,
    setIsFixed: handleSetIsFixed,
    setIdentity: handleSetIdentity,
    setPriority,
    setDifficulty,
    setDeadline,
    setSelectedTypeDuration,
    setSelectedTimeTypeTravel,
    setDurationTime,
    setTravelTime,
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
  };
}
