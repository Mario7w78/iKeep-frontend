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
    dayFrom?: number | null;
    dayTo?: number | null;
    isAnchor?: boolean;
    activityName?: string;
    isFixed?: boolean;
    identity?: 'clase' | 'trabajo' | 'tarea';
    priority?: 'baja' | 'media' | 'alta';
    difficulty?: 'baja' | 'media' | 'alta';
    deadline?: Date | null;
    preferredStartTime?: number | null;
    preferredEndTime?: number | null;
    optionalDay?: boolean;
    silent?: boolean;
}
