// Ubicación recomendada: src/infrastructure/repositories/AsyncStorageActivityRepository.ts

import { ActivityRepository } from '../../domain/repositories/ActivityRepository';
import { Activity } from '../../domain/entities/Activity';
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
        
        return rawActivities.map((raw: any) => {
            // Restore Date objects inside partitions of daysConfig
            const restoredDaysConfig = raw.daysConfig ? { ...raw.daysConfig } : {};
            Object.keys(restoredDaysConfig).forEach(day => {
                const config = restoredDaysConfig[day];
                if (config && config.partitions) {
                    config.partitions = config.partitions.map((p: any) => ({
                        ...p,
                        startHour: new Date(p.startHour),
                        endHour: new Date(p.endHour)
                    }));
                }
            });

            return new Activity({ 
                id: raw.id, 
                title: raw.title,
                type: raw.type,
                daysEnabled: raw.daysEnabled,
                daysConfig: restoredDaysConfig,
            });
        });
    }

    async delete(id: string): Promise<void> {
        const all = await this.getAll();
        const filtered = all.filter(a => a.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
}