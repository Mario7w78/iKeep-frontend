import { Schedule, ScheduledActivity } from '../../../domain/entities/Schedule';
import { Activity, DayOfWeek, ActivityType } from '../../../domain/entities/Activity';
import { PartitionConfig } from '../../../presentation/hooks/props';

const INT_TO_DAY: Record<number, DayOfWeek> = {
    0: 'Lunes', 1: 'Martes', 2: 'Miercoles',
    3: 'Jueves', 4: 'Viernes', 5: 'Sabado', 6: 'Domingo',
};

const mapDaysToInt = (days: string[]): number[] => {
    const dayMap: Record<string, number> = {
        'Lunes': 0, 'Martes': 1, 'Miercoles': 2, 'Jueves': 3,
        'Viernes': 4, 'Sabado': 5, 'Domingo': 6
    };
    return days.map(d => dayMap[d]).filter(d => d !== undefined);
};

const dateToMinutes = (date: Date): number => {
    const d = new Date(date);
    return d.getHours() * 60 + d.getMinutes();
};

export const mapActivitiesForBackend = (activities: Activity[]) => {
    const result: any[] = [];
    activities.forEach(act => {
        const isFixed = act.type === ActivityType.FIXED;

        // Agrupamos días que comparten la misma configuración de particiones
        const uniqueConfigs = new Map<number, { days: DayOfWeek[], partitions: PartitionConfig[] }>();
        Object.entries(act.daysConfig).forEach(([day, config]) => {
            if (config) {
                if (!uniqueConfigs.has(config.groupId)) {
                    uniqueConfigs.set(config.groupId, { days: [], partitions: config.partitions });
                }
                uniqueConfigs.get(config.groupId)!.days.push(day as DayOfWeek);
            }
        });

        uniqueConfigs.forEach((cfg, groupId) => {
            cfg.partitions.forEach((partition, pIdx) => {
                const inicio = dateToMinutes(partition.startHour);
                const fin = dateToMinutes(partition.endHour);
                result.push({
                    id: `${act.id}-${groupId}-${pIdx}`, // ID compuesto para el backend
                    id_actividad_original: act.id,
                    nombre: act.title || "Actividad sin nombre",
                    es_fija: isFixed,
                    duracion_minutos: Number(partition.durationTime) || 0,
                    tiempo_traslado_minutos: Number(partition.travelTime) || 0,
                    dias_permitidos: mapDaysToInt(cfg.days),
                    inicio_minutos: inicio,
                    fin_minutos: fin
                });
            });
        });
    });
    return result;
};

const minutesToHHmm = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`;
};

export const mapBackendToSchedule = (
    rawItems: any[],
    originalActivities: Activity[]
): Schedule => {
    console.log("DATA DEL BACKEND:", JSON.stringify(rawItems, null, 2));
    const scheduledActivities: ScheduledActivity[] = rawItems.map(item => {
        // El backend devuelve id_actividad_original o id_actividad. 
        // Usamos id_actividad_original si existe, sino parseamos id_actividad.
        const originalId = item.id_actividad_original 
            ? String(item.id_actividad_original) 
            : String(item.id_actividad).split('-')[0];
            
        const activity = originalActivities.find(a => String(a.id) === originalId);

        if (!activity) throw new Error(`Actividad no encontrada: ${originalId}`);

        return {
            activity,
            assignedStartTime: minutesToHHmm(item.inicio),
            assignedEndTime: minutesToHHmm(item.fin),
            day: INT_TO_DAY[item.dia] || 'Lunes',
        };
    });
    return new Schedule({
        id: `schedule-${Date.now()}`,
        userId: 'local',
        createdAt: new Date(),
        scheduledActivities,
    });
};