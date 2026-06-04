// src/domain/services/VoiceActivityParser.ts
import { DayOfWeek, ActivityType } from '../entities/Activity';

export interface ParsedVoiceActivity {
  identity?: 'clase' | 'trabajo' | 'tarea';
  title?: string;
  days?: DayOfWeek[];
  startHour?: number;
  startMinute?: number;
  endHour?: number;
  endMinute?: number;
  priority?: 'baja' | 'media' | 'alta';
  difficulty?: 'baja' | 'media' | 'alta';
  type?: ActivityType;
}

export interface VoiceActivityParser {
  parse(transcript: string): ParsedVoiceActivity;
}
