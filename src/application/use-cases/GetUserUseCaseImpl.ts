import { User } from '../../domain/entities/User';
import { UserRepository } from '../ports/out/UserRepository';
import { GetUserUseCase } from '../ports/in/GetUserUseCase';

export class GetUserUseCaseImpl implements GetUserUseCase {
  constructor(
    private userRepository: UserRepository
  ) {}

  async execute(): Promise<User | null> {
    return await this.userRepository.get();
  }
}
