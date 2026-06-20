/** DTOs for the natural language activity parsing endpoint. */

export interface ParsedScheduleDto {
  day: string;
  start_time: number;
  end_time: number;
}

export interface ParseNLResponseDto {
  name: string | null;
  activity_type: 'clase' | 'trabajo' | 'tarea' | null;
  is_fixed: boolean;
  is_anchor: boolean;
  difficulty: 'baja' | 'media' | 'alta' | null;
  priority: 'baja' | 'media' | 'alta' | null;
  schedule: ParsedScheduleDto[];
  duracion_minutos: number | null;
  hora_preferida_inicio: number | null;
  hora_preferida_fin: number | null;
  location: string | null;
  confidence: number;
  missing_fields: string[];
}

export interface ParseNLRequestDto {
  text: string;
}

export interface MessageDto {
  role: 'user' | 'assistant';
  content: string;
  type?: 'question' | 'result' | 'chat';
}

export interface ParseNLConversationRequestDto {
  text: string;
  history: MessageDto[];
}

export type ParseNLConversationResponseDto =
  | {
      type: 'question';
      ai_message: string;
      missing_fields?: string[];
    }
  | {
      type: 'chat';
      ai_message: string;
    }
  | {
      type: 'result';
      name: string | null;
      activity_type: 'clase' | 'trabajo' | 'tarea' | null;
      is_fixed: boolean;
      is_anchor: boolean;
      difficulty: 'baja' | 'media' | 'alta' | null;
      priority: 'baja' | 'media' | 'alta' | null;
      schedule: Array<{
        day: string;
        start_time: number | null;
        end_time: number | null;
      }>;
      duracion_minutos: number | null;
      hora_preferida_inicio: number | null;
      hora_preferida_fin: number | null;
      location: string | null;
      confidence: number;
      missing_fields: string[];
    };
