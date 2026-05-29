import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRepository } from '../../application/ports/out/UserRepository';
import { User } from '../../domain/entities/User';

const STORAGE_KEY = '@ikeep_user';

export class AsyncStorageUserRepository implements UserRepository {
  async get(): Promise<User | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    const raw = JSON.parse(data);
    return new User(raw);
  }

  async save(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  async delete(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}
