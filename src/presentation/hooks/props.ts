import { DayOfWeek } from '../../domain/entities/Activity';

export type DayConfig = {
    startHour: Date;
    endHour: Date;
    durationTime: number;
    travelTime: number;
    groupId: number;
};

export type frecuencyProps = {
    startTime: Date, 
    endTime: Date, 
    travelTimeValue: number, 
    durationTimeValue: number
}

export type editGroupProps = {
    groupId: number, 
    days: DayOfWeek[], 
    config: DayConfig,
    setStartTime: React.Dispatch<React.SetStateAction<Date>>,
    setDurationTime: React.Dispatch<React.SetStateAction<number>>,
    setTravelTime: React.Dispatch<React.SetStateAction<number>>,
}

export type saveActivityProps = {
    daysDict: Partial<Record<DayOfWeek, DayConfig>>,
    selectedDays: DayOfWeek[],
    setAlertText: React.Dispatch<React.SetStateAction<string>>,
    setShouldPopUpAlert: React.Dispatch<React.SetStateAction<boolean>>, 
}
