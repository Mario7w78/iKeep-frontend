import { UserProps } from './user.types';

export class User {
  readonly id: string;
  readonly name: string;
  readonly energyLevel: number;
  readonly wakeUpTime: string;
  readonly sleepTime: string;

  constructor(props: UserProps) {
    if (props.energyLevel < 1 || props.energyLevel > 5) {
      throw new Error('energyLevel must be between 1 and 5');
    }
    if (!/^\d{2}:\d{2}$/.test(props.wakeUpTime)) {
      throw new Error('wakeUpTime must be in HH:mm format');
    }
    if (!/^\d{2}:\d{2}$/.test(props.sleepTime)) {
      throw new Error('sleepTime must be in HH:mm format');
    }

    this.id = props.id;
    this.name = props.name;
    this.energyLevel = props.energyLevel;
    this.wakeUpTime = props.wakeUpTime;
    this.sleepTime = props.sleepTime;
  }
}
