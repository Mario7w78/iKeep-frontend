import { DayOfWeek } from '../../domain/entities/Activity';
import { PartitionConfig, DayConfig } from '../../domain/entities/activity.types';

export type frequencyProps = {
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
