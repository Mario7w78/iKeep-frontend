import { ActivityRepository } from '../../domain/repositories/ActivityRepository';
import { Activity } from '../../domain/entities/Activity';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ikeep_activities';

export class ApiActivityRepository implements ActivityRepository {

    async save(activity: Activity): Promise<void> {
        const all = await this.getAll();
        all.push(activity);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }

    async getAll(): Promise<Activity[]> {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    async delete(id: string): Promise<void> {
        const all = await this.getAll();
        const filtered = all.filter(a => a.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
}