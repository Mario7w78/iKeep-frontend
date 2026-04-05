export type DayOfWeek = 'Lunes' | 'Martes' | 'Miercoles' | 'Jueves' | 'Viernes' | 'Sabado' | 'Domingo';

export enum ActivityType {
    FIXED = 'FIXED',
    FLEXIBLE = 'FLEXIBLE'
}

export interface ActivityProps {
    id: string;
    title: string;
    type: ActivityType;
    durationMinutes: number;
    commuteMinutes: number;
    daysEnabled: DayOfWeek[];
    startTime?: string;
    endTime?: string;   
}

export class Activity {
    readonly id: string;
    readonly title: string;
    readonly type: ActivityType;
    readonly durationMinutes: number;
    readonly commuteMinutes: number;
    readonly daysEnabled: DayOfWeek[];
    readonly startTime?: string;
    readonly endTime?: string;

    constructor(props: ActivityProps) {
        this.id = props.id;
        this.title = props.title;
        this.type = props.type;
        this.durationMinutes = props.durationMinutes;
        this.commuteMinutes = props.commuteMinutes;
        this.daysEnabled = props.daysEnabled;
        this.startTime = props.startTime;
        this.endTime = props.endTime;
    }

    // Ejemplo de lógica de negocio dentro de la entidad
    getTotalTimeRequired(): number {
        return this.durationMinutes + this.commuteMinutes;
    }

    isFixed(): boolean {
        return this.type === ActivityType.FIXED;
    }
}