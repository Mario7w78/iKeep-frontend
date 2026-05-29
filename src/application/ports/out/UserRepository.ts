import { User } from '../../../domain/entities/User';

export interface UserRepository {
  get(): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(): Promise<void>;
}
