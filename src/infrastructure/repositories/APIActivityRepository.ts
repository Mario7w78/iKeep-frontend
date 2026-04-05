import { ActivityRepository } from '../../domain/repositories/ActivityRepository';
import { Activity } from '../../domain/entities/Activity';
import { mapActivitiesForBackend } from '../../application/mappers/scheduleMapper';
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

    async generateSchedule(activities: Activity[]): Promise<any[]> {
        const payload = {
            hora_inicio_dia: 480,
            hora_fin_dia: 1320,
            actividades: mapActivitiesForBackend(activities)
        };

        const response = await fetch('http://TU_IP:8000/api/v1/horarios/generar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Error en el solver de Python');
        return await response.json();
    }
}