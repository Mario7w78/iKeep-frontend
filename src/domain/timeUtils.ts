export const getDurationInMinutes = (durationLabel: string): number => {
  if (durationLabel.includes('m')) return parseInt(durationLabel.replace('m', ''));
  if (durationLabel.includes('hr')) return parseInt(durationLabel.replace('hr', '')) * 60;
  return 0;
};

export const calculateEndTime = (start: Date, durationLabel: string): Date => {
  const minutes = getDurationInMinutes(durationLabel);
  return new Date(start.getTime() + minutes * 60000);
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
  });
};