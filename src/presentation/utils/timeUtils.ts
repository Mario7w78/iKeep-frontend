export const calculateEndTime = (start: Date, duration: number): Date => {
  return new Date(start.getTime() + duration * 60000);
};

/** Next o'clock after `from` — 15:47 becomes 16:00, 15:00 becomes 16:00.
 *
 *  Used as the seed value for a new time slot. Seeding with the raw clock
 *  produced times like 15:47, which read as a real choice the user had made
 *  and forced them to correct both spinner wheels every single time.
 */
export const nextRoundHour = (from: Date = new Date()): Date => {
  const date = new Date(from);
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return date;
};

export const formatString = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}:${m < 10 ? "0" : ""}${m}`;
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const dateToMinutes = (date: Date): number => {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  return hours * 60 + minutes;
};

export const getHours = (time: number): string => {
  const hours = Math.floor(time / 60);
  return hours.toString().padStart(2, "0");
};

export const getMinutes = (time: number): string => {
  const minutes = time % 60;
  return minutes.toString().padStart(2, "0");
};

export const minutesToDate = (minutes: number): Date => {
  const date = new Date();
  date.setHours(Math.floor(minutes / 60));
  date.setMinutes(minutes % 60);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
};

export const areOverlapping = (
  start1: number,
  end1: number,
  start2: number,
  end2: number,
): boolean => {
  const wraps1 = end1 < start1;
  const wraps2 = end2 < start2;

  if (wraps1 && wraps2) return true; // Two wrapping intervals always overlap

  if (!wraps1 && !wraps2) {
    // Neither wraps — standard linear overlap
    return start1 < end2 && start2 < end1;
  }

  // One wraps: the wrapping interval covers [start..1439] and [0..end]
  // Overlaps if the non-wrapping start falls in the wrap arc
  if (wraps1) return start2 < end1 || start1 < end2;
  return start1 < end2 || start2 < end1;
};

/** Returns the minute difference handling end < start (crossover).
 *  When end >= start: returns end - start.
 *  When end < start: returns (1440 - start) + end.
 */
export const calculateDurationAcrossMidnight = (start: number, end: number): number => {
  if (end >= start) return end - start;
  return 1440 - start + end;
};

/** Returns true unless start === end (same semantic as settings / onboarding). */
export const isValidTimeRange = (start: number, end: number): boolean => {
  return start !== end;
};

export const getTodayFormatted = () => {
  const today = new Date();
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(today);
};
