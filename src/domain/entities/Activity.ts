import { AreaDeVida, areaDesdeIdentidad, comoArea } from './lifeArea';
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
    /** De qué parte de tu vida es. Ver `lifeArea`. */
    area?: AreaDeVida;
    identity: "clase" | "trabajo" | "tarea";
    priority: number;
    difficulty: "baja" | "media" | "alta";
    deadline: string | null;
    daysConfig: Partial<Record<DayOfWeek, DayConfig>>;
    daysEnabled: DayOfWeek[];
    preferredStartTime?: number | null;
    preferredEndTime?: number | null;
    optionalDay?: boolean;
    dayFrom?: number;
    dayTo?: number;
    isAnchor?: boolean;
    /**
     * Nota libre de la persona ("para qué es esto"). No participa del solver:
     * es texto que se muestra tal cual. null = sin descripción.
     */
    description?: string | null;
    /**
     * Si está puesta, la actividad ocurre una sola vez ese día y los días de
     * la semana no aplican. Viaja como string local `YYYY-MM-DD`, nunca por
     * UTC. Es lo que permite representar un parcial.
     */
    fechaUnica?: string | null;
}

export class Activity {
    readonly id: string;
    readonly title: string;
    readonly type: ActivityType;
    readonly area: AreaDeVida;
    readonly identity: "clase" | "trabajo" | "tarea";
    readonly priority: number;
    readonly difficulty: "baja" | "media" | "alta";
    readonly deadline: string | null;
    readonly daysEnabled: DayOfWeek[];
    readonly daysConfig: Partial<Record<DayOfWeek, DayConfig>>;
    readonly preferredStartTime?: number | null;
    readonly preferredEndTime?: number | null;
    readonly optionalDay?: boolean;
    readonly dayFrom?: number;
    readonly dayTo?: number;
    readonly isAnchor?: boolean;
    /** Fecha puntual `YYYY-MM-DD`; null cuando la actividad se repite. */
    readonly fechaUnica: string | null;
    /** Nota libre de la persona; null cuando la actividad no tiene descripción. */
    readonly description: string | null;

    constructor(props: ActivityProps) {
        this.id = props.id;
        this.title = props.title;
        this.type = props.type;
        // Una actividad creada antes del campo se deriva de su identidad: es
        // lo único que ese dato permite afirmar.
        this.area = props.area
            ? comoArea(props.area)
            : areaDesdeIdentidad(props.identity);
        this.identity = props.identity;
        this.priority = props.priority;
        this.difficulty = props.difficulty;
        this.deadline = props.deadline;
        this.daysEnabled = props.daysEnabled;
        this.daysConfig = props.daysConfig;
        this.preferredStartTime = props.preferredStartTime ?? null;
        this.preferredEndTime = props.preferredEndTime ?? null;
        this.optionalDay = props.optionalDay ?? false;
        this.dayFrom = props.dayFrom;
        this.dayTo = props.dayTo;
        this.isAnchor = props.isAnchor ?? false;
        this.fechaUnica = props.fechaUnica ?? null;
        this.description = props.description ?? null;
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
                    total += partition.durationTime + (partition.travelTo ?? 0) + (partition.travelFrom ?? 0);
                }
            }
        }
        return total / Math.max(Object.keys(this.daysConfig).length, 1);
    }
}