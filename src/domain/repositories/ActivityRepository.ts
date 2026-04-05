import { Activity } from '../entities/Activity';

export interface ActivityRepository {
    save(activity: Activity): Promise<void>;
    getAll(): Promise<Activity[]>;
    delete(id: string): Promise<void>;
    // El puerto para hablar con el backend de Python
    generateSchedule(activities: Activity[]): Promise<any[]>;
}