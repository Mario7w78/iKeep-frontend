import { Schedule, ScheduledActivity } from '../../../domain/entities/Schedule';
import { Activity, DayOfWeek, ActivityType } from '../../../domain/entities/Activity';
import { ScheduleRequestDto } from '../dto/ScheduleRequestDto';
import { ScheduleResponseDto } from '../dto/ScheduleResponseDto';
import { ActividadFijaDto, TareaPendienteDto, BackendActivityType, BackendDifficulty } from '../dto/ActivityDto';
import { GenerateScheduleOptions } from '../../../application/ports/in/GenerateSchedulePort';

const DAY_TO_INT: Record<DayOfWeek, number> = {
    'Lunes': 0, 'Martes': 1, 'Miercoles': 2, 'Jueves': 3,
    'Viernes': 4, 'Sabado': 5, 'Domingo': 6,
};

const INT_TO_DAY: Record<number, DayOfWeek> = {
    0: 'Lunes', 1: 'Martes', 2: 'Miercoles',
    3: 'Jueves', 4: 'Viernes', 5: 'Sabado', 6: 'Domingo',
};

const dateToMinutes = (date: Date): number => {
    const d = new Date(date);
    return d.getHours() * 60 + d.getMinutes();
};

const minutesToHHmm = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`;
};

export const domainToScheduleRequest = (
    activities: Activity[],
    startHour: number,
    endHour: number,
    options?: GenerateScheduleOptions
): ScheduleRequestDto => {
    const actividades_fijas: ActividadFijaDto[] = [];
    const tareas_pendientes: TareaPendienteDto[] = [];

    activities.forEach(act => {
        act.daysEnabled.forEach(day => {
            const config = act.daysConfig[day];
            if (!config) return;

            config.partitions.forEach((partition, pIdx) => {
                const inicio = dateToMinutes(partition.startHour);
                const fin = dateToMinutes(partition.endHour);

                const baseDto = {
                    id: `${act.id}-${config.groupId}-${pIdx}`,
                    nombre: act.title || 'Actividad sin nombre',
                    tipo: 'tarea' as BackendActivityType,
                    dia: DAY_TO_INT[day],
                    hora_inicio: inicio,
                    hora_fin: fin,
                    ubicacion_id: 'default',
                    prioridad: 5,
                    duracion_estimada: partition.durationTime,
                    dificultad: 'media' as BackendDifficulty,
                };

                if (act.type === ActivityType.FIXED) {
                    actividades_fijas.push(baseDto);
                } else {
                    tareas_pendientes.push(baseDto);
                }
            });
        });
    });

    return {
        actividades_fijas,
        tareas_pendientes,
        ubicaciones: options?.ubicaciones ?? [],
        tiempos_traslado: options?.tiempos_traslado ?? [],
        contexto_usuario: {
            nivel_energia: options?.nivel_energia ?? 5,
            horario_inicio: startHour,
            horario_fin: endHour,
            bloques_sueno: options?.bloques_sueno ?? [],
        },
    };
};

export const scheduleResponseToDomain = (
    response: ScheduleResponseDto,
    originalActivities: Activity[]
): Schedule => {
    // Filter out travel blocks
    const filteredBloques = response.bloques.filter(bloque => {
        if (bloque.tipo === 'viaje') return false;
        if (bloque.id_actividad.startsWith('viaje_')) return false;
        return true;
    });

    const scheduledActivities: ScheduledActivity[] = filteredBloques.map(bloque => {
        const originalId = bloque.id_actividad.split('-')[0];
        const activity = originalActivities.find(a => String(a.id) === originalId);

        if (!activity) {
            throw new Error(`Actividad no encontrada: ${originalId}`);
        }

        return {
            activity,
            assignedStartTime: minutesToHHmm(bloque.hora_inicio),
            assignedEndTime: minutesToHHmm(bloque.hora_fin),
            day: INT_TO_DAY[bloque.dia] || 'Lunes',
        };
    });

    return new Schedule({
        id: `schedule-${Date.now()}`,
        userId: 'local',
        createdAt: new Date(),
        scheduledActivities,
        estado: response.estado,
        mensaje: response.mensaje,
    });
};
