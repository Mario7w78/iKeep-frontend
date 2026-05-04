import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { DayOfWeek } from "../../domain/entities/Activity";
import { calculateEndTime, areOverlapping, dateToMinutes, formatTime } from "../../presentation/utils/timeUtils";
import { timeType } from "../../domain/entities/activity.types";
import { useActivityStore } from "../../infrastructure/store/useActivityStore";
import { useScheduleStore } from "../../infrastructure/store/useScheduleStore";
import { saveActivityProps, PartitionConfig } from "./props";

export default function useTimeForm() {
  const [activityName, setActivityName] = useState("");
  const [isFixed, setIsFixed] = useState(true);

  const [selectedTimeTypeDuration, setSelectedTypeDuration] =
    useState<timeType>(timeType.both);
  const [selectedTimeTypeTravel, setSelectedTimeTypeTravel] =
    useState<timeType>(timeType.both);

  const [partitions, setPartitions] = useState<PartitionConfig[]>([
    {
      startHour: new Date(),
      endHour: calculateEndTime(new Date(), 10),
      durationTime: 0,
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
  const { startHour: dayStartMin, endHour: dayEndMin } = useScheduleStore();

  const updateActivePartition = (updates: Partial<PartitionConfig>) => {
    setPartitions((prev) =>
      prev.map((p, i) => {
        if (i === activePartitionIndex) {
          const updated = { ...p, ...updates };
          if (updates.startHour || updates.durationTime !== undefined) {
            updated.endHour = calculateEndTime(
              updated.startHour,
              updated.durationTime,
            );
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

  const handleDiscardPartition = () => {
    if (partitions.length <= 1) return;
    setPartitions((prev) => prev.filter((_, i) => i !== activePartitionIndex));
    setActivePartitionIndex((prev) => (prev > 0 ? prev - 1 : 0));
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
    setFn((prev) => (prev >= amount ? prev - amount : 0));
  };

  const updateTime = (
    hourString: string,
    minuteString: string,
    period: string,
  ) => {
    const newDate = new Date(startTime);
    let hours = parseInt(hourString, 10);
    if (period === "AM") {
      if (hours === 12) hours = 0;
    } else {
      if (hours !== 12) hours += 12;
    }
    newDate.setHours(hours);
    newDate.setMinutes(parseInt(minuteString, 10));
    setStartTime(newDate);
  };

  

  const validatePartitions = (
    targetPartitions: PartitionConfig[],
    targetDays: DayOfWeek[],
    setAlertText: React.Dispatch<React.SetStateAction<string>>,
    setShouldPopUpAlert: React.Dispatch<React.SetStateAction<boolean>>,
  ): boolean => {
    for (const day of targetDays) {
      for (let i = 0; i < targetPartitions.length; i++) {
        const p = targetPartitions[i];
        const sMin = dateToMinutes(new Date(p.startHour));
        const eMin = dateToMinutes(new Date(p.endHour));

        // Validar límites
        if (sMin < dayStartMin || eMin > dayEndMin) {
          setAlertText(
            `La actividad en ${day} excede los límites del día (${formatTime(new Date(p.startHour))} - ${formatTime(new Date(p.endHour))})`,
          );
          setShouldPopUpAlert(true);
          return false;
        }

        for (let j = i + 1; j < targetPartitions.length; j++) {
          const p2 = targetPartitions[j];
          if (
            areOverlapping(
              sMin,
              eMin,
              dateToMinutes(new Date(p2.startHour)),
              dateToMinutes(new Date(p2.endHour)),
            )
          ) {
            setAlertText(`Hay un solapamiento entre tus propias particiones en ${day}`);
            setShouldPopUpAlert(true);
            return false;
          }
        }

        // Validar solapamientos externos
        for (const otherAct of activities) {
          const otherConfig = otherAct.daysConfig[day];
          if (otherConfig) {
            for (const otherP of otherConfig.partitions) {
              const osMin = dateToMinutes(new Date(otherP.startHour));
              const oeMin = dateToMinutes(new Date(otherP.endHour));

              if (areOverlapping(sMin, eMin, osMin, oeMin)) {
                setAlertText(
                  `Conflicto en ${day}: coincide con "${otherAct.title}" (${formatTime(new Date(otherP.startHour))})`,
                );
                setShouldPopUpAlert(true);
                return false;
              }
            }
          }
        }
      }
    }
    return true;
  };

  const handleSaveActivity = async ({
    daysDict,
    selectedDays,
    setAlertText,
    setShouldPopUpAlert,
  }: saveActivityProps) => {
    const configuredDays = Object.keys(daysDict) as DayOfWeek[];

    if (!activityName.trim()) {
      setAlertText("Ingresa un nombre para la actividad");
      setShouldPopUpAlert(true);
      return;
    }

    if (configuredDays.length === 0) {
      setAlertText("Guardá la configuración de al menos un día");
      setShouldPopUpAlert(true);
      return;
    }

    if (selectedDays.length > 0) {
      setAlertText(`Guardá la configuración de: ${selectedDays.join(", ")}`);
      setShouldPopUpAlert(true);
      return;
    }

    // Usar la función de validación centralizada
    for (const day of configuredDays) {
      const config = daysDict[day]!;
      if (
        !validatePartitions(
          config.partitions,
          [day],
          setAlertText,
          setShouldPopUpAlert,
        )
      ) {
        return;
      }
    }

    await handleCreateActivity({
      activityName,
      isFixed,
      daysConfig: daysDict,
      days: configuredDays,
    });
  };
  const resetPartitions = () => {
    setPartitions([
      {
        startHour: new Date(),
        endHour: calculateEndTime(new Date(), 10),
        durationTime: 0,
        travelTime: 0,
      },
    ]);
    setActivePartitionIndex(0);
  };

  return {
    activityName,
    isFixed,
    selectedTimeTypeDuration,
    selectedTimeTypeTravel,
    durationTimeValue,
    travelTimeValue,
    startTime,
    endTime,
    partitions,
    activePartitionIndex,
    setActivityName,
    setIsFixed,
    setSelectedTypeDuration,
    setSelectedTimeTypeTravel,
    setDurationTime,
    setTravelTime,
    setStartTime,
    handleAddGeneric,
    handleSubGeneric,
    updateTime,
    validatePartitions,
    handleSaveActivity,
    setPartitions,
    setActivePartitionIndex,
    handleAddPartition,
    handleDiscardPartition,
    resetPartitions,
  };
}
