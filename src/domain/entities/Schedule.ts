// src/domain/entities/Schedule.ts
import { Activity, DayOfWeek } from './Activity';

export interface ScheduledActivity {
    activity?: Activity;
    assignedStartTime: string; // HH:mm
    assignedEndTime: string;   // HH:mm
    day: DayOfWeek;
    tipo?: string;
    nombre?: string;           // from backend BloqueTiempoDto.nombre (e.g. "Viaje a ITLAB")
}

export interface ScheduleProps {
    id: string;
    userId: string;
    createdAt: Date;
    scheduledActivities: ScheduledActivity[];
    estado?: string;
    mensaje?: string;
    recomendaciones?: string[];
    tareasOmitidas?: string[];
}

/** Enrolla una hora en el rango 00:00-23:59.
 *
 * El backend puede emitir un fin > 1440 min (24:00, 25:00) para bloques que
 * cruzan medianoche. Un `25:00` es en realidad la 01:00 del día siguiente: en
 * vez de propagar el valor roto (que además re-disparaba la validación de
 * integridad en cada carga), lo normalizamos acá, al construir la entidad.
 * Quien no tenga formato numérico queda intacto para que la validación lo vea.
 */
function normalizarHhmm(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number);
    if (!Number.isInteger(h) || !Number.isInteger(m) || m < 0 || m > 59) return hhmm;
    const wrapped = ((h * 60 + m) % 1440 + 1440) % 1440;
    return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
}

export class Schedule {
    readonly id: string;
    readonly userId: string;
    readonly createdAt: Date;
    readonly estado?: string;
    readonly mensaje?: string;
    readonly recomendaciones: string[];
    readonly tareasOmitidas: string[];
    private readonly items: ScheduledActivity[];

    constructor(props: ScheduleProps) {
        this.id = props.id;
        this.userId = props.userId;
        this.createdAt = props.createdAt;
        this.estado = props.estado;
        this.mensaje = props.mensaje;
        this.recomendaciones = props.recomendaciones ?? [];
        this.tareasOmitidas = props.tareasOmitidas ?? [];
        this.items = props.scheduledActivities.map(item => ({
            ...item,
            assignedStartTime: normalizarHhmm(item.assignedStartTime),
            assignedEndTime: normalizarHhmm(item.assignedEndTime),
        }));
    }
    
    getAllItems(): ScheduledActivity[] {
        return [...this.items];
    }

    getItemsByDay(day: DayOfWeek, _startHour: number = 0): ScheduledActivity[] {
        const timeToVal = (timeStr: string) => {
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        };
        return this.items
            .filter(item => item.day === day)
            .sort((a, b) => timeToVal(a.assignedStartTime) - timeToVal(b.assignedStartTime));
    }

    getTotalActiveMinutes(): number {
        return this.items.reduce((total, item) => {
            return total + (item.activity ? item.activity.getTotalTimeRequired() : 0);
        }, 0);
    }

    hasActivityAt(day: DayOfWeek, time: string): boolean {
        return this.items.some(item => 
            item.day === day && 
            time >= item.assignedStartTime && 
            time <= item.assignedEndTime
        );
    }
}

export interface DiagnosticoHorario {
    valido: boolean;
    advertencias: string[];
}

function hhmmToMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}

export function validarIntegridadHorario(schedule: Schedule): DiagnosticoHorario {
    const advertencias: string[] = [];

    for (const item of schedule.getAllItems()) {
        const startMins = hhmmToMinutes(item.assignedStartTime);
        const endMins = hhmmToMinutes(item.assignedEndTime);
        const label = item.activity?.title ?? item.nombre ?? item.assignedStartTime;

        if (!Number.isFinite(startMins) || !Number.isFinite(endMins)) {
            advertencias.push(`${label}: formato de hora inválido (${item.assignedStartTime}-${item.assignedEndTime})`);
            continue;
        }

        if (startMins < 0 || startMins > 1439) {
            advertencias.push(`${label}: hora_inicio fuera de rango (${item.assignedStartTime})`);
        }
        if (endMins < 0 || endMins > 1439) {
            advertencias.push(`${label}: hora_fin fuera de rango (${item.assignedEndTime})`);
        }

        if (item.activity?.isFixed()) {
            const dayConfig = item.activity.daysConfig?.[item.day];
            const particion = dayConfig?.partitions?.[0];
            if (particion?.startHour && particion?.endHour) {
                const cfgStart = particion.startHour.getHours() * 60 + particion.startHour.getMinutes();
                const cfgEnd = particion.endHour.getHours() * 60 + particion.endHour.getMinutes();
                const margen = Math.max(particion.travelTo ?? 0, particion.travelFrom ?? 0) + 30;
                if (cfgEnd > cfgStart && (startMins < cfgStart - margen || startMins > cfgEnd + margen)) {
                    const fmt = (v: number) => `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
                    advertencias.push(
                        `${label}: hora_inicio ${item.assignedStartTime} fuera del rango fijo (${fmt(cfgStart)}–${fmt(cfgEnd)})`
                    );
                }
            }
        }

        if (endMins > startMins && (endMins - startMins) > 960) {
            advertencias.push(`${label}: duración sospechosa (${endMins - startMins} min)`);
        }
    }

    return { valido: advertencias.length === 0, advertencias };
}