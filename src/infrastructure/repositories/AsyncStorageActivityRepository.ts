import { ActivityRepository } from '../../application/ports/out/ActivityRepository';
import { Activity } from '../../domain/entities/Activity';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ikeep_activities';

export class AsyncStorageActivityRepository implements ActivityRepository {

    async save(activity: Activity): Promise<void> {
        const all = await this.getAll();
        const index = all.findIndex(a => a.id === activity.id);
        if (index >= 0) {
            all[index] = activity;
        } else {
            all.push(activity);
        }
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
                    config.partitions = config.partitions.map((p: any) => {
                        // Migration: legacy travelTime → travelTo, travelFrom = 0
                        const migrated = {
                            ...p,
                            startHour: new Date(p.startHour),
                            endHour: new Date(p.endHour),
                        };
                        if ('travelTime' in p && !('travelTo' in p)) {
                            migrated.travelTo = p.travelTime;
                            migrated.travelFrom = 0;
                            delete migrated.travelTime;
                        }
                        return migrated;
                    });
                }
            });

            return new Activity({ 
                id: raw.id, 
                title: raw.title,
                type: raw.type,
                identity: raw.identity || "tarea",
                priority: raw.priority ?? 3,
                difficulty: raw.difficulty || "media",
                deadline: raw.deadline || null,
                daysEnabled: raw.daysEnabled,
                daysConfig: restoredDaysConfig,
                preferredStartTime: raw.preferredStartTime !== undefined ? raw.preferredStartTime : null,
                preferredEndTime: raw.preferredEndTime !== undefined ? raw.preferredEndTime : null,
                optionalDay: raw.optionalDay ?? false,
                dayFrom: raw.dayFrom !== undefined ? raw.dayFrom : undefined,
                dayTo: raw.dayTo !== undefined ? raw.dayTo : undefined,
                isAnchor: raw.isAnchor ?? false,
            });
        });
    }

    async delete(id: string): Promise<void> {
        const all = await this.getAll();
        const filtered = all.filter(a => a.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
}