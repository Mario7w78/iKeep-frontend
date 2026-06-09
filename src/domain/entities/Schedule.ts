// src/domain/entities/Schedule.ts
import { Activity, DayOfWeek } from './Activity';

export interface ScheduledActivity {
    activity?: Activity;
    assignedStartTime: string; // HH:mm
    assignedEndTime: string;   // HH:mm
    day: DayOfWeek;
    tipo?: string;
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
        this.items = props.scheduledActivities;
    }
    
    getAllItems(): ScheduledActivity[] {
        return [...this.items];
    }

    getItemsByDay(day: DayOfWeek, startHour: number = 0): ScheduledActivity[] {
        const timeToVal = (timeStr: string) => {
            const [h, m] = timeStr.split(':').map(Number);
            const mins = h * 60 + m;
            return mins < startHour ? mins + 1440 : mins;
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