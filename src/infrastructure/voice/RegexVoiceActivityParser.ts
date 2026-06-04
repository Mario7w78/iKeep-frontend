// src/infrastructure/voice/RegexVoiceActivityParser.ts
import { VoiceActivityParser, ParsedVoiceActivity } from '../../domain/services/VoiceActivityParser';
import { DayOfWeek, ActivityType } from '../../domain/entities/Activity';

// ── Day name normalization ────────────────────────────────────────────────────

const DAY_MAP: Record<string, DayOfWeek> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miercoles',
  miércoles: 'Miercoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sábado: 'Sabado',
  sabado: 'Sabado',
  domingo: 'Domingo',
};

const DAY_ORDER: DayOfWeek[] = [
  'Lunes',
  'Martes',
  'Miercoles',
  'Jueves',
  'Viernes',
  'Sabado',
  'Domingo',
];

const DAY_NAMES = Object.keys(DAY_MAP).join('|');

// ── Identity keyword → type map ─────────────────────────────────────────────

const IDENTITY_MAP: Record<string, 'clase' | 'trabajo' | 'tarea'> = {
  clase: 'clase',
  trabajo: 'trabajo',
  tarea: 'tarea',
  estudiar: 'tarea',
  estudio: 'tarea',
  estudia: 'tarea',
  aprender: 'tarea',
  repasar: 'tarea',
  leer: 'tarea',
  practicar: 'tarea',
};

const IDENTITY_KEYWORDS = Object.keys(IDENTITY_MAP).join('|');

// ── Regex patterns ──────────────────────────────────────────────────────────

const IDENTITY_REGEX = new RegExp(
  `^(${IDENTITY_KEYWORDS})\\s+(?:de\\s+)?(.+?)(?=\\s+(?:${DAY_NAMES}|los|de|prioridad|dificultad|desde|a\\s+las)|$)`,
  'i',
);

const ALL_DAYS_REGEX = /todos\s+los\s+d[ií]as/i;

const DAY_RANGE_REGEX = new RegExp(
  `(${DAY_NAMES})\\s+a\\s+(${DAY_NAMES})`,
  'i',
);

const INDIVIDUAL_DAY_REGEX = new RegExp(`(${DAY_NAMES})`, 'gi');

const TIME_RANGE_REGEX =
  /(?:desde\s+|de\s+)?(?:las?\s+)?(\d{1,2})(?::(\d{2}))?\s*(?:hasta\s+las|hasta|a\s+las|a)\s+(\d{1,2})(?::(\d{2}))?/i;

const START_TIME_REGEX = /a\s+las\s+(\d{1,2})(?::(\d{2}))?/i;

const PRIORITY_REGEX = /prioridad\s+(alta|media|baja|\d)/i;

const DIFFICULTY_REGEX = /dificultad\s+(alta|media|baja)/i;

const TYPE_OVERRIDE_REGEX = /(fijo|fija|flexible)/i;

// ── Priority digit → word conversion ────────────────────────────────────────

function digitToPriorityWord(digit: number): 'baja' | 'media' | 'alta' {
  if (digit <= 2) return 'baja';
  if (digit === 3) return 'media';
  return 'alta';
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function expandDayRange(start: DayOfWeek, end: DayOfWeek): DayOfWeek[] {
  const startIdx = DAY_ORDER.indexOf(start);
  const endIdx = DAY_ORDER.indexOf(end);
  if (startIdx === -1 || endIdx === -1 || startIdx > endIdx) return [];
  return DAY_ORDER.slice(startIdx, endIdx + 1);
}

// ── RegexVoiceActivityParser ───────────────────────────────────────────────

export class RegexVoiceActivityParser implements VoiceActivityParser {
  parse(transcript: string): ParsedVoiceActivity {
    const normalized = transcript.toLowerCase().trim();
    if (!normalized) return {};

    const result: ParsedVoiceActivity = {};

    // ── 1. Identity + title ──────────────────────────────────────────────
    const identityMatch = normalized.match(IDENTITY_REGEX);
    if (identityMatch) {
      const keyword = identityMatch[1].toLowerCase();
      result.identity = IDENTITY_MAP[keyword] ?? 'tarea';

      const rawTitle = identityMatch[2].trim();
      if (rawTitle) {
        result.title = rawTitle;
      }
    }

    // ── 2/3/4. Days ─────────────────────────────────────────────────────

    // 4. All days — check first, before other day patterns
    if (ALL_DAYS_REGEX.test(normalized)) {
      result.days = [...DAY_ORDER];
    }

    // 3. Day range (e.g. "lunes a viernes")
    if (!result.days) {
      const rangeMatch = normalized.match(DAY_RANGE_REGEX);
      if (rangeMatch) {
        const startDay = DAY_MAP[rangeMatch[1].toLowerCase()];
        const endDay = DAY_MAP[rangeMatch[2].toLowerCase()];
        if (startDay && endDay) {
          const expanded = expandDayRange(startDay, endDay);
          if (expanded.length > 0) {
            result.days = expanded;
          }
        }
      }
    }

    // 2. Individual days (only if days not already resolved)
    if (!result.days) {
      const dayMatches = [...normalized.matchAll(INDIVIDUAL_DAY_REGEX)];
      if (dayMatches.length > 0) {
        const uniqueDays = new Set<DayOfWeek>();
        for (const m of dayMatches) {
          const day = DAY_MAP[m[0].toLowerCase()];
          if (day) uniqueDays.add(day);
        }
        result.days = [...uniqueDays];
      }
    }

    // ── 5/6. Times ──────────────────────────────────────────────────────

    // 6. Time range (start AND end) — check before standalone start time
    const rangeMatch = normalized.match(TIME_RANGE_REGEX);
    if (rangeMatch) {
      result.startHour = parseInt(rangeMatch[1], 10);
      if (rangeMatch[2] !== undefined) {
        result.startMinute = parseInt(rangeMatch[2], 10);
      }
      result.endHour = parseInt(rangeMatch[3], 10);
      if (rangeMatch[4] !== undefined) {
        result.endMinute = parseInt(rangeMatch[4], 10);
      }
    }

    // 5. Standalone start time (only if no range was found)
    if (result.startHour === undefined) {
      const startTimeMatch = normalized.match(START_TIME_REGEX);
      if (startTimeMatch) {
        result.startHour = parseInt(startTimeMatch[1], 10);
        if (startTimeMatch[2] !== undefined) {
          result.startMinute = parseInt(startTimeMatch[2], 10);
        }
      }
    }

    // ── 7. Priority ─────────────────────────────────────────────────────
    const priorityMatch = normalized.match(PRIORITY_REGEX);
    if (priorityMatch) {
      const raw = priorityMatch[1].toLowerCase();
      if (raw === 'alta' || raw === 'media' || raw === 'baja') {
        result.priority = raw;
      } else {
        const num = parseInt(raw, 10);
        if (num >= 1 && num <= 5) {
          result.priority = digitToPriorityWord(num);
        }
      }
    }

    // ── 8. Difficulty ───────────────────────────────────────────────────
    const difficultyMatch = normalized.match(DIFFICULTY_REGEX);
    if (difficultyMatch) {
      result.difficulty = difficultyMatch[1].toLowerCase() as 'baja' | 'media' | 'alta';
    }

    // ── 9. Type override ────────────────────────────────────────────────
    const typeMatch = normalized.match(TYPE_OVERRIDE_REGEX);
    if (typeMatch) {
      const typeStr = typeMatch[1].toLowerCase();
      result.type = typeStr.startsWith('fij') ? ActivityType.FIXED : ActivityType.FLEXIBLE;
    }

    // ── Type inference (fallback when no explicit override) ─────────────
    if (!result.type && result.identity) {
      result.type = result.identity === 'clase' ? ActivityType.FIXED : ActivityType.FLEXIBLE;
    }

    return result;
  }
}
