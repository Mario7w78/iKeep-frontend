import { Activity, ActivityType } from '../../domain/entities/Activity';

/**
 * Mapeo de días de la semana a enteros para el solver de Python (OR-Tools)
 * Backend espera: 0 = Lunes, 6 = Domingo
 */
const mapDaysToInt = (days: string[]): number[] => {
    const dayMap: Record<string, number> = {
        'Lunes': 0, 'Martes': 1, 'Miercoles': 2, 'Jueves': 3,
        'Viernes': 4, 'Sabado': 5, 'Domingo': 6
    };
    return days.map(d => dayMap[d]).filter(d => d !== undefined);
};

/**
 * Convierte "HH:mm" a minutos totales desde las 00:00.
 * Solo se usa para las horas de inicio/fin de actividades FIJAS.
 */
const timeStringToMinutes = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
};

export const mapActivitiesForBackend = (activities: Activity[]) => {
    return activities.map(act => {
        const isFixed = act.type === ActivityType.FIXED;

        // Calculamos los minutos de inicio y fin solo si es fija
        // Si es flexible, el backend se encarga de proponer estas horas
        const inicio_minutos = isFixed ? timeStringToMinutes(act.startTime) : 0;
        const fin_minutos = isFixed ? timeStringToMinutes(act.endTime) : 0;

        return {
            id: act.id,
            nombre: act.title,
            es_fija: isFixed,
            // Usamos directamente los valores numéricos de la Entidad
            duracion_minutos: act.durationMinutes,
            tiempo_traslado_minutos: act.commuteMinutes,
            dias_permitidos: mapDaysToInt(act.daysEnabled),
            inicio_minutos: inicio_minutos,
            fin_minutos: fin_minutos
        };
    });
};