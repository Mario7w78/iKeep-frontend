import { AreaDeVida } from '../../domain/entities/lifeArea';
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
    area?: AreaDeVida;
    identity?: 'clase' | 'trabajo' | 'tarea';
    priority?: 'baja' | 'media' | 'alta';
    difficulty?: 'baja' | 'media' | 'alta';
    deadline?: Date | null;
    preferredStartTime?: number | null;
    preferredEndTime?: number | null;
    optionalDay?: boolean;
    silent?: boolean;
    /**
     * Nota libre de la persona ("para qué es esto"). No participa del solver.
     */
    description?: string | null;
    /**
     * Fecha puntual `YYYY-MM-DD` (modo solo-día desde el mes). Cuando viene,
     * el comando viaja con `days: []`: el backend expande por `fecha_unica` y
     * los días de la semana no aplican. `daysConfig` conserva el día
     * sintético porque la configuración horaria vive ahí.
     */
    fechaUnica?: string | null;
}
