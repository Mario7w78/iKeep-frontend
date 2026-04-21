import { DayOfWeek } from '../../domain/entities/Activity';

export type PartitionConfig = {
    startHour: Date;
    endHour: Date;
    durationTime: number;
    travelTime: number;
};

export type DayConfig = {
    partitions: PartitionConfig[];
    groupId: number;
};

export type frecuencyProps = {
    partitions: PartitionConfig[];
}

export type editGroupProps = {
    groupId: number, 
    days: DayOfWeek[], 
    config: DayConfig,
    setPartitions: React.Dispatch<React.SetStateAction<PartitionConfig[]>>,
    setActivePartitionIndex: React.Dispatch<React.SetStateAction<number>>,
}

export type saveActivityProps = {
    daysDict: Partial<Record<DayOfWeek, DayConfig>>,
    selectedDays: DayOfWeek[],
    setAlertText: React.Dispatch<React.SetStateAction<string>>,
    setShouldPopUpAlert: React.Dispatch<React.SetStateAction<boolean>>, 
}
