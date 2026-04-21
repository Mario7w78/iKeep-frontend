import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { DayOfWeek } from "../../domain/entities/Activity";
import { calculateEndTime } from "../../presentation/utils/timeUtils";
import { timeType } from "../../domain/entities/activity.types";
import { useActivityStore } from "../../infrastructure/store/useActivityStore";
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
      durationTime: 10,
      travelTime: 0,
    },
  ]);
  const [activePartitionIndex, setActivePartitionIndex] = useState(0);

  const activePartition = partitions[activePartitionIndex] || partitions[0];

  const durationTimeValue = activePartition.durationTime;
  const travelTimeValue = activePartition.travelTime;
  const startTime = activePartition.startHour;
  const endTime = activePartition.endHour;

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
    const newValue =
      typeof val === "function" ? val(durationTimeValue) : val;
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
    const newStart = new Date(lastPartition.endHour.getTime() + 30 * 60000); // 30 min after last one
    const newPartition: PartitionConfig = {
      startHour: newStart,
      endHour: calculateEndTime(newStart, 10),
      durationTime: 10,
      travelTime: 0,
    };
    setPartitions((prev) => [...prev, newPartition]);
    setActivePartitionIndex(partitions.length);
  };

  const { handleCreateActivity } = useActivityStore();

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
        durationTime: 10,
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
    handleSaveActivity,
    setPartitions,
    setActivePartitionIndex,
    handleAddPartition,
    resetPartitions,
  };
}
