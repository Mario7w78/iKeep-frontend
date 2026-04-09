import { Activity } from "../../../domain/entities/Activity"

export interface GetActivityPort {
    execute(): Promise<Activity[]>
} 