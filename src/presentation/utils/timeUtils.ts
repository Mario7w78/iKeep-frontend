export const calculateEndTime = (start: Date, duration: number): Date => {
  return new Date(start.getTime() + duration * 60000);
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
  return start1 < end2 && start2 < end1;
};

export const getTodayFormatted = () => {
  const today = new Date();
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(today);
};
