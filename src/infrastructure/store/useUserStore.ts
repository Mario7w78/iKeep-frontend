import { create, StoreApi, UseBoundStore } from 'zustand';
import { User } from '../../domain/entities/User';
import { GetUserUseCase } from '../../application/ports/in/GetUserUseCase';
import { UpdateUserUseCase } from '../../application/ports/in/UpdateUserUseCase';

interface UserState {
  user: User | null;
  isLoading: boolean;
  loadUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

export type UserStore = UseBoundStore<StoreApi<UserState>>;

export function createUserStore(
  getUserUseCase: GetUserUseCase,
  updateUserUseCase: UpdateUserUseCase
): UserStore {
  return create<UserState>((set) => ({
    user: null,
    isLoading: false,

    loadUser: async () => {
      set({ isLoading: true });
      try {
        const user = await getUserUseCase.execute();
        set({ user });
      } catch (error) {
        console.error('Error al cargar perfil de usuario:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    updateUser: async (data) => {
      try {
        const user = await updateUserUseCase.execute(data);
        set({ user });
      } catch (error) {
        console.error('Error al actualizar perfil de usuario:', error);
      }
    },
  }));
}
