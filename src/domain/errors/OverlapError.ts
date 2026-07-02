/**
 * OverlapConflictData carries structured information about a single
 * activity overlap to enable visual rendering in ConflictPreview.
 */
export interface OverlapConflictData {
  day: string;
  conflictingActivity: {
    id: string;
    title: string;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
  };
  proposedTime: {
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
  };
}

/**
 * OverlapError is thrown by validateOverlapWithSchedule when detecting
 * activity time conflicts. Carries structured data for the UI layer.
 */
export class OverlapError extends Error {
  readonly conflicts: OverlapConflictData[];
  readonly day: string;
  readonly type: 'fixed' | 'flexible';

  constructor(
    message: string,
    conflicts: OverlapConflictData[],
    day: string,
    type: 'fixed' | 'flexible',
  ) {
    super(message);
    this.name = 'OverlapError';
    this.conflicts = conflicts;
    this.day = day;
    this.type = type;
  }
}
