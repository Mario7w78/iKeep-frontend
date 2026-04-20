import { DayConfig } from "../../presentation/hooks/props";

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miercoles' | 'Jueves' | 'Viernes' | 'Sabado' | 'Domingo';

export enum ActivityType {
    FIXED = 'FIXED',
    FLEXIBLE = 'FLEXIBLE'
}

export interface ActivityProps {
    id: string;
    title: string;
    type: ActivityType;
    daysConfig: Partial<Record<DayOfWeek, DayConfig>>;
    daysEnabled: DayOfWeek[];
}

export class Activity {
    readonly id: string;
    readonly title: string;
    readonly type: ActivityType;
    readonly daysEnabled: DayOfWeek[];
    readonly daysConfig: Partial<Record<DayOfWeek, DayConfig>>;


    constructor(props: ActivityProps) {
        this.id = props.id;
        this.title = props.title;
        this.type = props.type;
        this.daysEnabled = props.daysEnabled;
        this.daysConfig = props.daysConfig
    }

    isFixed(): boolean {
        return this.type === ActivityType.FIXED;
    }
}