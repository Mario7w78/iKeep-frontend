import { ScheduleRepository } from '../../domain/repositories/ScheduleRepository';
import { Activity, DayOfWeek } from '../../domain/entities/Activity';
import { Schedule, ScheduledActivity } from '../../domain/entities/Schedule';
import { ScheduleApiAdapter } from '../api/ScheduleApiAdapter';

const DAY_MAP: Record<number, DayOfWeek> = {
    0: 'Lunes', 1: 'Martes', 2: 'Miercoles', 3: 'Jueves',
    4: 'Viernes', 5: 'Sabado', 6: 'Domingo'
};

const minutesToTimeString = (minutes: number): string => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
};

export class ApiScheduleRepository implements ScheduleRepository {
    async generate(activities: Activity[]): Promise<Schedule> {
        const result = await ScheduleApiAdapter(activities);

        // result.actividades es el array que devuelve el backend
        const scheduledActivities: ScheduledActivity[] = result.actividades.map((item: any) => {
            const activity = activities.find(a => String(a.id) === String(item.id_actividad));

            return {
                activity: activity!,
                assignedStartTime: minutesToTimeString(item.inicio),
                assignedEndTime: minutesToTimeString(item.fin),
                day: DAY_MAP[item.dia],
            };
        });

        return new Schedule({
            id: Date.now().toString(),
            userId: 'local',
            createdAt: new Date(),
            scheduledActivities,
        });
    }
}