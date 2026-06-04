import { DayConfig } from './activity.types';

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miercoles' | 'Jueves' | 'Viernes' | 'Sabado' | 'Domingo';

export enum ActivityType {
    FIXED = 'FIXED',
    FLEXIBLE = 'FLEXIBLE'
}

export interface ActivityProps {
    id: string;
    title: string;
    type: ActivityType;
    identity: "clase" | "trabajo" | "tarea";
    priority: number;
    difficulty: "baja" | "media" | "alta";
    deadline: string | null;
    daysConfig: Partial<Record<DayOfWeek, DayConfig>>;
    daysEnabled: DayOfWeek[];
    preferredStartTime?: number | null;
    preferredEndTime?: number | null;
}

export class Activity {
    readonly id: string;
    readonly title: string;
    readonly type: ActivityType;
    readonly identity: "clase" | "trabajo" | "tarea";
    readonly priority: number;
    readonly difficulty: "baja" | "media" | "alta";
    readonly deadline: string | null;
    readonly daysEnabled: DayOfWeek[];
    readonly daysConfig: Partial<Record<DayOfWeek, DayConfig>>;
    readonly preferredStartTime?: number | null;
    readonly preferredEndTime?: number | null;

    constructor(props: ActivityProps) {
        this.id = props.id;
        this.title = props.title;
        this.type = props.type;
        this.identity = props.identity;
        this.priority = props.priority;
        this.difficulty = props.difficulty;
        this.deadline = props.deadline;
        this.daysEnabled = props.daysEnabled;
        this.daysConfig = props.daysConfig;
        this.preferredStartTime = props.preferredStartTime ?? null;
        this.preferredEndTime = props.preferredEndTime ?? null;
    }

    isFixed(): boolean {
        return this.type === ActivityType.FIXED;
    }

    getTotalTimeRequired(): number {
        let total = 0;
        for (const day of Object.keys(this.daysConfig) as DayOfWeek[]) {
            const config = this.daysConfig[day];
            if (config) {
                for (const partition of config.partitions) {
                    total += partition.durationTime + partition.travelTime;
                }
            }
        }
        return total / Math.max(Object.keys(this.daysConfig).length, 1);
    }
}