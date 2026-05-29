import { User } from '../../domain/entities/User';
import { UserProps } from '../../domain/entities/user.types';
import { UserRepository } from '../ports/out/UserRepository';
import { UpdateUserUseCase } from '../ports/in/UpdateUserUseCase';

export class UpdateUserUseCaseImpl implements UpdateUserUseCase {
  constructor(
    private userRepository: UserRepository
  ) {}

  async execute(data: Partial<User>): Promise<User> {
    const existing = await this.userRepository.get();

    const props: UserProps = {
      id: data.id ?? existing?.id ?? 'local',
      name: data.name ?? existing?.name ?? '',
      energyLevel: data.energyLevel ?? existing?.energyLevel ?? 1,
      wakeUpTime: data.wakeUpTime ?? existing?.wakeUpTime ?? '08:00',
      sleepTime: data.sleepTime ?? existing?.sleepTime ?? '22:00',
    };

    const user = new User(props);
    await this.userRepository.save(user);
    return user;
  }
}
