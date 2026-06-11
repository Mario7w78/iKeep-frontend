import { ActivityRepository } from '../../application/ports/out/ActivityRepository';
import { Activity } from '../../domain/entities/Activity';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ikeep_activities';

export class AsyncStorageActivityRepository implements ActivityRepository {

    async save(activity: Activity): Promise<void> {
        const all = await this.getAll();
        const activityIdStr = String(activity.id);
        const index = all.findIndex(a => String(a.id) === activityIdStr);
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
        const seenIds = new Set<string>();
        const uniqueRawActivities: any[] = [];

        for (const raw of rawActivities) {
            const idStr = String(raw.id);
            if (!seenIds.has(idStr)) {
                seenIds.add(idStr);
                uniqueRawActivities.push(raw);
            }
        }
        
        return uniqueRawActivities.map((raw: any) => {
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
                id: String(raw.id), 
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
        const idStr = String(id);
        const filtered = all.filter(a => String(a.id) !== idStr);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
}