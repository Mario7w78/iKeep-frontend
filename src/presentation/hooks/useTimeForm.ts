import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { DayOfWeek } from '../../domain/entities/Activity';
import { calculateEndTime } from '../../presentation/utils/timeUtils';
import { timeType } from '../../domain/entities/activity.types';
import { useActivityStore } from '../../infrastructure/store/useActivityStore';
import { saveActivityProps } from './props';


export default function useTimeForm() {
    const [activityName, setActivityName] = useState('');
    const [isFixed, setIsFixed] = useState(true);

    const [selectedTimeTypeDuration, setSelectedTypeDuration] = useState<timeType>(timeType.both);
    const [selectedTimeTypeTravel, setSelectedTimeTypeTravel] = useState<timeType>(timeType.both);

    const [durationTimeValue, setDurationTime] = useState(10);
    const [travelTimeValue, setTravelTime] = useState(0);
    const [startTime, setStartTime] = useState(new Date());
    const endTime = calculateEndTime(startTime, durationTimeValue);

    const { handleCreateActivity } = useActivityStore();

    const handleAddGeneric = (setFn: React.Dispatch<React.SetStateAction<number>>, type: timeType) => {
        const amount = type === timeType.hour ? 60 : 10;
        setFn(prev => prev + amount);
    };

    const handleSubGeneric = (setFn: React.Dispatch<React.SetStateAction<number>>, type: timeType) => {
        const amount = type === timeType.hour ? 60 : 10;
        setFn(prev => (prev >= amount ? prev - amount : 0));
    };

    const updateTime = (hourString: string, minuteString: string, period: string) => {
        const newDate = new Date(startTime);
        let hours = parseInt(hourString, 10);
        if (period === 'AM') { if (hours === 12) hours = 0; }
        else { if (hours !== 12) hours += 12; }
        newDate.setHours(hours);
        newDate.setMinutes(parseInt(minuteString, 10));
        setStartTime(newDate);
    };

    const handleSaveActivity = async ({ daysDict, selectedDays, setAlertText, setShouldPopUpAlert }: saveActivityProps) => {
        const configuredDays = Object.keys(daysDict) as DayOfWeek[];

        if (!activityName.trim()) {
            setAlertText('Ingresa un nombre para la actividad');
            setShouldPopUpAlert(true);
            return;
        }
        if (configuredDays.length === 0) {
            setAlertText('Guardá la configuración de al menos un día');
            setShouldPopUpAlert(true);
            return;
        }
        if (selectedDays.length > 0) {
            setAlertText(`Guardá la configuración de: ${selectedDays.join(', ')}`);
            setShouldPopUpAlert(true);
            return;
        }
        // await handleCreateActivity({ activityName, isFixed, daysConfig: daysDict, days: configuredDays });
        navigation.back();
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
    };
}