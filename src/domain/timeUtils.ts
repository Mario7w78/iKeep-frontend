export const calculateEndTime = (start: Date, duration: number): Date => {
  return new Date(start.getTime() + duration * 60000);
};

export const formatString = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}:${m < 10 ? '0' : ''}${m}`;
  };

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
  });
};

export const getHours = (time: number): string => {
  const hours = Math.floor(time / 60);
  return hours.toString().padStart(2, '0'); 
};

export const getMinutes = (time: number): string => {
  const minutes = time % 60; 
  return minutes.toString().padStart(2, '0');
};