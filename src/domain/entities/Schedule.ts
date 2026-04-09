// src/domain/entities/Schedule.ts
import { Activity, DayOfWeek } from './Activity';

export interface ScheduledActivity {
    activity: Activity;
    assignedStartTime: string; // HH:mm
    assignedEndTime: string;   // HH:mm
    day: DayOfWeek;
}

export interface ScheduleProps {
    id: string;
    userId: string;
    createdAt: Date;
    scheduledActivities: ScheduledActivity[];
}

export class Schedule {
    readonly id: string;
    readonly userId: string;
    readonly createdAt: Date;
    private readonly items: ScheduledActivity[];

    constructor(props: ScheduleProps) {
        this.id = props.id;
        this.userId = props.userId;
        this.createdAt = props.createdAt;
        this.items = props.scheduledActivities;
    }
    
    getAllItems(): ScheduledActivity[] {
        return [...this.items];
    }

    getItemsByDay(day: DayOfWeek): ScheduledActivity[] {
        return this.items
            .filter(item => item.day === day)
            .sort((a, b) => a.assignedStartTime.localeCompare(b.assignedStartTime));
    }

    getTotalActiveMinutes(): number {
        return this.items.reduce((total, item) => {
            return total + item.activity.getTotalTimeRequired();
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