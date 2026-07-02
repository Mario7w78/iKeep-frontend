import { DayOfWeek } from '../../domain/entities/Activity';
import { PartitionConfig } from '../../domain/entities/activity.types';
import { ParseNLResponseDto, ParsedScheduleDto } from '../../infrastructure/api/dto/ParseNLDto';

export interface ParsedFormState {
  activityName: string | null;
  identity: 'clase' | 'trabajo' | 'tarea' | null;
  isFixed: boolean;
  isAnchor: boolean;
  difficulty: 'baja' | 'media' | 'alta' | null;
  priority: 'baja' | 'media' | 'alta' | null;
  selectedDays: DayOfWeek[];
  daysDict: Record<string, {
    partitions: PartitionConfig[];
    groupId: number;
    preferredStartTime: number | null;
    preferredEndTime: number | null;
  }>;
  activeDay: DayOfWeek | null;
  activePartitionIndex: number;
  nextGroupId: number;
  /** Days that were detected but have no time (anchor tasks). */
  dayOnlySlots: string[];
  /** Duration in minutes when the user specified duration but NO specific time. */
  duracionMinutos: number | null;
  /** Preferred window start (minutes from midnight) — when user says "desde las X" with a separate duration. */
  horaPreferidaInicio: number | null;
  /** Preferred window end (minutes from midnight). */
  horaPreferidaFin: number | null;
}

const minutesToDate = (minutes: number): Date => {
  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
};

const NORMALIZE_DAY: Record<string, DayOfWeek> = {
  'lunes': 'Lunes',
  'martes': 'Martes',
  'miercoles': 'Miercoles',
  'miércoles': 'Miercoles',
  'jueves': 'Jueves',
  'viernes': 'Viernes',
  'sabado': 'Sabado',
  'sábado': 'Sabado',
  'sabados': 'Sabado',
  'sábados': 'Sabado',
  'domingo': 'Domingo',
  'domingos': 'Domingo',
};

const normalizeDayName = (day: any): DayOfWeek => {
  if (!day || typeof day !== 'string') return 'Lunes';
  const clean = day.toLowerCase().trim();
  return NORMALIZE_DAY[clean] || 'Lunes';
};

/**
 * Normaliza valores horarios que el AI devuelve en formato inconsistente.
 * valores ≤ 1440 (24*60) → minutos desde medianoche, se usan tal cual.
 * valores > 1440 → probablemente HHMM (ej: 2400 = 24:00 = medianoche).
 *   Se interpreta como horas*60 + minutos.
 */
function normalizeTime(value: number | null): number | null {
  if (value === null || value === undefined) return value;
  if (value <= 1440) return value;
  const hours = Math.floor(value / 100);
  const minutes = value % 100;
  const asMinutes = hours * 60 + minutes;
  return asMinutes <= 1440 ? asMinutes : 1440;
}

export function mapParsedResponseToFormState(
  response: ParseNLResponseDto,
  currentNextGroupId: number,
): ParsedFormState {
  const missingFields = Array.isArray(response.missing_fields) ? response.missing_fields : [];

  const state: ParsedFormState = {
    activityName: null,
    identity: null,
    isFixed: response.is_fixed ?? false,
    isAnchor: response.is_anchor ?? false,
    difficulty: null,
    priority: null,
    selectedDays: [],
    daysDict: {},
    activeDay: null,
    activePartitionIndex: 0,
    nextGroupId: currentNextGroupId,
    dayOnlySlots: [],
    duracionMinutos: null,
    horaPreferidaInicio: null,
    horaPreferidaFin: null,
  };

  // Name
  if (response.name && !missingFields.includes('name')) {
    state.activityName = response.name;
  }

  // Identity
  if (response.activity_type && !missingFields.includes('activity_type')) {
    state.identity = response.activity_type;
  }

  // Domain rule: una actividad flexible (optimizable) NO puede ser "clase".
  // "clase" implica horario fijo. Si el AI devuelve clase+flexible, corregimos a tarea.
  if (!state.isFixed && state.identity === 'clase') {
    state.identity = 'tarea';
  }

  // Difficulty
  if (response.difficulty && !missingFields.includes('difficulty')) {
    state.difficulty = response.difficulty;
  }

  // Priority
  if (response.priority && !missingFields.includes('priority')) {
    state.priority = response.priority;
  }

  // Preferred time window (top-level fields, independientes de schedule)
  if (!missingFields.includes('start_time')) {
    state.horaPreferidaInicio = normalizeTime(response.hora_preferida_inicio) ?? null;
  } else {
    state.horaPreferidaInicio = null;
  }
  if (!missingFields.includes('end_time')) {
    state.horaPreferidaFin = normalizeTime(response.hora_preferida_fin) ?? null;
  } else {
    state.horaPreferidaFin = null;
  }

  // Schedule → daysDict + selectedDays
  const hasSchedule = Array.isArray(response.schedule) && response.schedule.length > 0;
  const scheduleMissing = missingFields.includes('schedule');
  const timeMissing = missingFields.includes('start_time') || missingFields.includes('end_time');

  if (hasSchedule && !scheduleMissing) {
    // Separate slots with time from day-only slots
    const slotsWithTime = response.schedule.filter(
      (s: any) => s && (typeof s.start_time === 'number' || typeof s.end_time === 'number') && (s.start_time > 0 || s.end_time > 0),
    );
    const dayOnlySlots = response.schedule
      .filter((s: any) => s && (s.start_time === 0 || s.start_time === null) && (s.end_time === 0 || s.end_time === null))
      .map((s: any) => normalizeDayName(s?.day));

    state.dayOnlySlots = dayOnlySlots;

    const allDays = [...new Set(response.schedule.filter(s => s).map((s: any) => normalizeDayName(s?.day)))] as DayOfWeek[];
    state.selectedDays = allDays;

    // Day-only slots (anchor): populate daysDict so Confirmar works
    // Use duracion_minutos if specified, otherwise default to 60 min (user can edit in wizard)
    if (dayOnlySlots.length > 0) {
      state.duracionMinutos = response.duracion_minutos ?? null;
      let groupIdCounter = currentNextGroupId;
      const newDaysDict: ParsedFormState['daysDict'] = {};
      const duration = response.duracion_minutos ?? 60;

      for (const day of dayOnlySlots) {
        // Usar hora_preferida_inicio como base para startHour/endHour
        // para evitar mandar medianoche al backend via scheduleMapper
        const prefStart = response.hora_preferida_inicio ?? 0;
        const partition: PartitionConfig = {
          startHour: minutesToDate(prefStart),
          endHour: minutesToDate(prefStart + duration),
          durationTime: duration,
          travelTo: response.travel_to ?? null,
          travelFrom: response.travel_from ?? null,
        };

        newDaysDict[day] = {
          partitions: [partition],
          groupId: groupIdCounter++,
          preferredStartTime: response.hora_preferida_inicio ?? null,
          preferredEndTime: response.hora_preferida_fin ?? null,
        };
      }

      state.daysDict = newDaysDict;
      state.nextGroupId = groupIdCounter;
      state.activeDay = dayOnlySlots[0] as DayOfWeek;
    } else if (slotsWithTime.length > 0) {
      const days = [...new Set(slotsWithTime.map((s: any) => normalizeDayName(s?.day)))] as DayOfWeek[];
      const scheduleByDay: Record<string, any[]> = {};
      slotsWithTime.forEach((s: any) => {
        const normDay = normalizeDayName(s?.day);
        if (!scheduleByDay[normDay]) scheduleByDay[normDay] = [];
        scheduleByDay[normDay].push(s);
      });

      let groupIdCounter = currentNextGroupId;
      const newDaysDict: ParsedFormState['daysDict'] = {};

      for (const day of days) {
        const slots = scheduleByDay[day] || [];
        const partitions: PartitionConfig[] = slots.map((slot: any) => {
          const sTime = normalizeTime(typeof slot.start_time === 'number' ? slot.start_time : 0) ?? 0;
          const eTime = normalizeTime(typeof slot.end_time === 'number' ? slot.end_time : undefined) ?? (sTime + 60);
          return {
            startHour: minutesToDate(sTime),
            endHour: minutesToDate(eTime),
            durationTime: Math.max(0, eTime - sTime),
            travelTo: response.travel_to ?? null,
            travelFrom: response.travel_from ?? null,
          };
        });

        const groupId = response.is_fixed ? groupIdCounter++ : groupIdCounter;

        newDaysDict[day] = {
          partitions,
          groupId,
          preferredStartTime: null,
          preferredEndTime: null,
        };
      }

      state.daysDict = newDaysDict;
      state.nextGroupId = response.is_fixed ? groupIdCounter : groupIdCounter + 1;

      // Set active day to first day with time
      const firstDay = days[0];
      state.activeDay = firstDay;
    } else if (dayOnlySlots.length > 0 && !timeMissing) {
      // All slots are day-only (anchor with no time) — set first day as active
      state.activeDay = dayOnlySlots[0] as DayOfWeek;
    }
  }

  return state;
}

/** Applies parsed form state to wizard hook setters. */
export function applyParsedState(
  state: ParsedFormState,
  setters: {
    setActivityName: (v: string) => void;
    setIdentity: (v: 'clase' | 'trabajo' | 'tarea') => void;
    setIsFixed: (v: boolean) => void;
    setIsAnchor: (v: boolean) => void;
    setDifficulty: (v: 'baja' | 'media' | 'alta') => void;
    setPriority: (v: 'baja' | 'media' | 'alta') => void;
    setSelectedDays: (v: DayOfWeek[]) => void;
    setDaysDict: (v: any) => void;
    setPartitions: (v: PartitionConfig[]) => void;
    setActiveDay: (v: DayOfWeek | null) => void;
    setActivePartitionIndex: (v: number) => void;
    setNextGroupId: (v: number) => void;
    setPreferredStartTime: (v: number | null) => void;
    setPreferredEndTime: (v: number | null) => void;
  },
): void {
  if (state.activityName) setters.setActivityName(state.activityName);
  if (state.identity) setters.setIdentity(state.identity);
  setters.setIsFixed(state.isFixed);
  setters.setIsAnchor(state.isAnchor);
  if (state.difficulty) setters.setDifficulty(state.difficulty);
  if (state.priority) setters.setPriority(state.priority);

  if (state.selectedDays.length > 0) {
    setters.setSelectedDays(state.selectedDays);
    setters.setDaysDict(state.daysDict);
    setters.setNextGroupId(state.nextGroupId);

    if (state.activeDay && state.daysDict[state.activeDay]) {
      setters.setPartitions(state.daysDict[state.activeDay].partitions);
      setters.setActiveDay(state.activeDay);
      setters.setActivePartitionIndex(state.activePartitionIndex);
      setters.setPreferredStartTime(state.horaPreferidaInicio);
      setters.setPreferredEndTime(state.horaPreferidaFin);
    }
  }
}

