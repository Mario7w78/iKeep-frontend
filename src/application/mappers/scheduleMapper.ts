import { Activity, ActivityType } from '../../domain/entities/Activity';

const mapDaysToInt = (days: string[]): number[] => {
    const dayMap: Record<string, number> = {
        'Lunes': 0, 'Martes': 1, 'Miercoles': 2, 'Jueves': 3,
        'Viernes': 4, 'Sabado': 5, 'Domingo': 6
    };
    return days.map(d => dayMap[d]).filter(d => d !== undefined);
};

const timeStringToMinutes = (timeStr?: string | null): number => {
    if (!timeStr || typeof timeStr !== 'string') return 0;

    const match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match12) {
        let hours = parseInt(match12[1], 10);
        const minutes = parseInt(match12[2], 10);
        const period = match12[3].toUpperCase();

        if (period === 'AM' && hours === 12) hours = 0;       // 12:xx AM → 0h
        if (period === 'PM' && hours !== 12) hours += 12;     // 4:xx PM → 16h

        return hours * 60 + minutes;
    }

    const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
        const hours = parseInt(match24[1], 10);
        const minutes = parseInt(match24[2], 10);
        return hours * 60 + minutes;
    }

    console.warn(`timeStringToMinutes: formato no reconocido → "${timeStr}"`);
    return 0;
};

export const mapActivitiesForBackend = (activities: Activity[]) => {
    return activities.map(act => {
       const isFixed = act.type === ActivityType.FIXED;
        
        const inicio = timeStringToMinutes(act.startTime);
        const fin = timeStringToMinutes(act.endTime);
        
        if (isFixed && !act.startTime) {
            console.warn(`Actividad fija "${act.title}" sin hora de inicio. Usando default.`);
        }
        
        console.log(act.id, act.title, isFixed,  act.durationMinutes || 0, act.travelMinutes || 0, mapDaysToInt(act.daysEnabled), isFixed ? (isNaN(inicio) ? 0 : inicio) : 0, isFixed ? (isNaN(fin) ? 0 : fin) : 0)

        return {
            id: String(act.id),
            nombre: act.title || "Actividad sin nombre",
            es_fija: isFixed,
            duracion_minutos: Number(act.durationMinutes) || 0,
            tiempo_traslado_minutos: Number(act.travelMinutes) || 0,
            dias_permitidos: mapDaysToInt(act.daysEnabled || []),
            inicio_minutos: isFixed ? (isNaN(inicio) ? 0 : inicio) : 0,
            fin_minutos: isFixed ? (isNaN(fin) ? 0 : fin) : 0
        };
    });
};