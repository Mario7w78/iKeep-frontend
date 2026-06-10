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
    const actividades_optimizables: TareaPendienteDto[] = [];

    activities.forEach(act => {
        // Optional day: optimizable activities without fixed day constraint
        if (act.type === ActivityType.FLEXIBLE && act.optionalDay) {
            const firstDay = act.daysEnabled[0];
            if (!firstDay) return;
            const config = act.daysConfig[firstDay];
            if (!config) return;

            config.partitions.forEach((partition, pIdx) => {
                const inicio = dateToMinutes(partition.startHour);
                const fin = dateToMinutes(partition.endHour);

                const entry: TareaPendienteDto = {
                    id: `${act.id}-${config.groupId}-${pIdx}`,
                    nombre: act.title || 'Actividad sin nombre',
                    tipo: act.identity || ('tarea' as BackendActivityType),
                    hora_inicio: inicio,
                    hora_fin: fin,
                    ubicacion_id: null,
                    prioridad: act.priority ?? 5,
                    duracion_estimada: partition.durationTime,
                    fecha_limite: act.deadline || null,
                    dificultad: act.difficulty || ('media' as BackendDifficulty),
                    hora_preferida_inicio: config.preferredStartTime ?? act.preferredStartTime ?? null,
                    hora_preferida_fin: config.preferredEndTime ?? act.preferredEndTime ?? null,
                    dias_permitidos: act.daysEnabled.map(d => DAY_TO_INT[d]),
                    es_ancla: act.isAnchor || undefined,
                    travel_to: partition.travelTo ?? undefined,
                    travel_from: partition.travelFrom ?? undefined,
                };

                // Day range for optionalDay activities
                if (act.dayFrom != null && act.dayTo != null) {
                    entry.dia_desde = act.dayFrom;
                    entry.dia_hasta = act.dayTo;
                }

                actividades_optimizables.push(entry);
            });
            return; // skip per-day iteration
        }

        // Range mode: optimizable or fixed activities with day range
        if (act.dayFrom != null && act.dayTo != null && act.type !== ActivityType.FIXED) {
            const firstDay = act.daysEnabled[0] || (Object.keys(act.daysConfig)[0] as DayOfWeek | undefined);
            if (!firstDay) return;
            const config = act.daysConfig[firstDay];
            if (!config) return;

            config.partitions.forEach((partition, pIdx) => {
                const inicio = dateToMinutes(partition.startHour);
                const fin = dateToMinutes(partition.endHour);

                actividades_optimizables.push({
                    id: `${act.id}-${config.groupId}-${pIdx}`,
                    nombre: act.title || 'Actividad sin nombre',
                    tipo: act.identity || ('tarea' as BackendActivityType),
                    hora_inicio: inicio,
                    hora_fin: fin,
                    ubicacion_id: null,
                    prioridad: act.priority ?? 5,
                    duracion_estimada: partition.durationTime,
                    fecha_limite: act.deadline || null,
                    dificultad: act.difficulty || ('media' as BackendDifficulty),
                    hora_preferida_inicio: config.preferredStartTime ?? act.preferredStartTime ?? null,
                    hora_preferida_fin: config.preferredEndTime ?? act.preferredEndTime ?? null,
                    dias_permitidos: act.daysEnabled.map(d => DAY_TO_INT[d]),
                    dia_desde: act.dayFrom,
                    dia_hasta: act.dayTo,
                    es_ancla: act.isAnchor || undefined,
                    travel_to: partition.travelTo ?? undefined,
                    travel_from: partition.travelFrom ?? undefined,
                });
            });
            return; // skip per-day iteration
        }

        act.daysEnabled.forEach(day => {
            const config = act.daysConfig[day];
            if (!config) return;

            config.partitions.forEach((partition, pIdx) => {
                const inicio = dateToMinutes(partition.startHour);
                const fin = dateToMinutes(partition.endHour);

                const baseDto = {
                    id: `${act.id}-${config.groupId}-${day}-${pIdx}`,
                    nombre: act.title || 'Actividad sin nombre',
                    tipo: act.identity || ('tarea' as BackendActivityType),
                    dia: DAY_TO_INT[day],
                    hora_inicio: inicio,
                    hora_fin: fin,
                    ubicacion_id: null,
                    prioridad: act.priority ?? 5,
                    duracion_estimada: partition.durationTime,
                    fecha_limite: act.deadline || null,
                    dificultad: act.difficulty || ('media' as BackendDifficulty),
                    travel_to: partition.travelTo ?? undefined,
                    travel_from: partition.travelFrom ?? undefined,
                };

                if (act.type === ActivityType.FIXED) {
                    actividades_fijas.push(baseDto);
                } else {
                    actividades_optimizables.push({
                        ...baseDto,
                        hora_preferida_inicio: config.preferredStartTime ?? act.preferredStartTime ?? null,
                        hora_preferida_fin: config.preferredEndTime ?? act.preferredEndTime ?? null,
                        es_ancla: act.isAnchor || undefined,
                    });
                }
            });
        });
    });

    return {
        actividades_fijas,
        actividades_optimizables,
        ubicaciones: options?.ubicaciones ?? [],
        tiempos_traslado: options?.tiempos_traslado ?? [],
        dia_inicio: options?.dia_inicio ?? 0,
        dias_totales: options?.dias_totales ?? 7,
        contexto_usuario: {
            nivel_energia: options?.nivel_energia ?? 2,
            horario_inicio: options?.perDayStartHours ?? startHour,
            horario_fin: options?.perDayEndHours ?? endHour,
            bloques_sueno: options?.bloques_sueno ?? [],
            historial_energia: options?.historial_energia,
            patron_energia_manual: options?.patron_energia_manual ?? undefined,
        },
    };
};

export const scheduleResponseToDomain = (
    response: ScheduleResponseDto,
    originalActivities: Activity[]
): Schedule => {
    const scheduledActivities: ScheduledActivity[] = response.bloques.map(bloque => {
        const originalId = bloque.id_actividad.split('-')[0];
        const activity = originalActivities.find(a => String(a.id) === originalId);

        // Travel blocks and unknown activities are rendered without an Activity reference
        if (!activity) {
            return {
                assignedStartTime: minutesToHHmm(bloque.hora_inicio),
                assignedEndTime: minutesToHHmm(bloque.hora_fin),
                day: INT_TO_DAY[bloque.dia] || 'Lunes',
                tipo: bloque.tipo,
                nombre: bloque.nombre,
            };
        }

        return {
            activity,
            assignedStartTime: minutesToHHmm(bloque.hora_inicio),
            assignedEndTime: minutesToHHmm(bloque.hora_fin),
            day: INT_TO_DAY[bloque.dia] || 'Lunes',
            tipo: bloque.tipo,
            nombre: bloque.nombre,
        };
    });

    return new Schedule({
        id: `schedule-${Date.now()}`,
        userId: 'local',
        createdAt: new Date(),
        scheduledActivities,
        estado: response.estado,
        mensaje: response.mensaje,
        recomendaciones: response.recomendaciones ?? [],
        tareasOmitidas: response.tareas_omitidas ?? [],
    });
};
