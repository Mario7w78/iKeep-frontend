import { User } from '../../../domain/entities/User';

export interface UpdateUserUseCase {
  execute(data: Partial<User>): Promise<User>;
}
