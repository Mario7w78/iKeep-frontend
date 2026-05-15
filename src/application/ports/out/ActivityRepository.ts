import { Activity } from '../../../domain/entities/Activity';

export interface ActivityRepository {
    save(activity: Activity): Promise<void>;
    getAll(): Promise<Activity[]>;
    delete(id: string): Promise<void>;
}
