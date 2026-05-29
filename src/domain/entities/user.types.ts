export interface UserProps {
  id: string;
  name: string;
  energyLevel: number;
  wakeUpTime: string;
  sleepTime: string;
}

export interface UserPreferences {
  energyLevel: number;
  wakeUpTime: string;
  sleepTime: string;
}
