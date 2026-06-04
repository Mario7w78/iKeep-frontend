// src/application/use-cases/ParseVoiceActivityUseCase.ts
import { VoiceActivityParser, ParsedVoiceActivity } from '../ports/out/VoiceActivityParser';
import { CreateActivityPort, CreateActivityCommand } from '../ports/in/CreateActivityPort';
import { ActivityType } from '../../domain/entities/Activity';

const PRIORITY_MAP: Record<string, number> = {
  baja: 1,
  media: 3,
  alta: 5,
};

const DEFAULT_PRIORITY = 3;
const DEFAULT_DIFFICULTY = 'media';
const DEFAULT_IDENTITY = 'tarea';

const MINUTES_FROM_MIDNIGHT = (hour: number, minute: number): number =>
  hour * 60 + minute;

export class ParseVoiceActivityUseCase {
  constructor(
    private readonly parser: VoiceActivityParser,
    private readonly createActivityUseCase: CreateActivityPort,
  ) {}

  /**
   * Parse a voice transcript into a structured ParsedVoiceActivity.
   * Synchronous — the underlying regex parser has no I/O.
   */
  parse(transcript: string): ParsedVoiceActivity {
    return this.parser.parse(transcript);
  }

  /**
   * Confirm the parsed result and persist it as a new Activity.
   * Accepts optional user edits that override parsed fields before saving.
   */
  async confirmAndSave(
    parsed: ParsedVoiceActivity,
    edits?: Partial<ParsedVoiceActivity>,
  ): Promise<void> {
    // 1. Merge user edits over parsed data
    const merged: ParsedVoiceActivity = { ...parsed, ...edits };

    // 2. Type inference: explicit override wins; fallback to identity-based inference
    const resolvedType = merged.type ?? this.inferType(merged.identity);

    // 3. Map to CreateActivityCommand
    const command: CreateActivityCommand = {
      activityName: merged.title ?? 'Actividad sin nombre',
      isFixed: resolvedType === ActivityType.FIXED,
      identity: merged.identity ?? DEFAULT_IDENTITY,
      priority: merged.priority ? (PRIORITY_MAP[merged.priority] ?? DEFAULT_PRIORITY) : DEFAULT_PRIORITY,
      difficulty: merged.difficulty ?? DEFAULT_DIFFICULTY,
      deadline: null,
      daysConfig: {},
      days: merged.days ?? [],
      preferredStartTime:
        merged.startHour !== undefined
          ? MINUTES_FROM_MIDNIGHT(merged.startHour, merged.startMinute ?? 0)
          : null,
      preferredEndTime:
        merged.endHour !== undefined
          ? MINUTES_FROM_MIDNIGHT(merged.endHour, merged.endMinute ?? 0)
          : null,
    };

    // 4. Delegate to the existing CreateActivityUseCase
    await this.createActivityUseCase.execute(command);
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private inferType(identity?: string): ActivityType {
    if (identity === 'clase') return ActivityType.FIXED;
    return ActivityType.FLEXIBLE;
  }
}
