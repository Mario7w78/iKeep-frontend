// Ubicación recomendada: src/infrastructure/repositories/AsyncStorageActivityRepository.ts

import { ActivityRepository } from '../../domain/repositories/ActivityRepository';
import { Activity, ActivityProps } from '../../domain/entities/Activity';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ikeep_activities';

export class AsyncStorageActivityRepository implements ActivityRepository {

    async save(activity: Activity): Promise<void> {
        const all = await this.getAll();
        all.push(activity);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }

    async getAll(): Promise<Activity[]> {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (!data) return [];

        const rawActivities = JSON.parse(data);
        
        return rawActivities.map((raw: any) => new Activity({ 
            id: raw.id, 
            title: raw.title,
            type: raw.type,
            durationMinutes: raw.durationMinutes,
            travelMinutes: raw.travelMinutes,
            daysEnabled: raw.daysEnabled,
            startTime: raw.startTime,
            endTime: raw.endTime,
        }));
    }

    async delete(id: string): Promise<void> {
        const all = await this.getAll();
        const filtered = all.filter(a => a.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
}