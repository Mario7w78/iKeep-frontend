import { User } from '../../../domain/entities/User';

export interface GetUserUseCase {
  execute(): Promise<User | null>;
}
