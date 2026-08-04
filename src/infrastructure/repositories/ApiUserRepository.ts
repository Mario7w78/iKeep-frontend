import { UserRepository } from '../../application/ports/out/UserRepository';
import { User } from '../../domain/entities/User';
import { backendRequest } from '../api/backendClient';

/**
 * Perfil del usuario a traves del backend.
 *
 * Implementa el mismo puerto que SupabaseUserRepository, asi que los casos de
 * uso no cambian.
 */

const RUTA = '/api/v1/perfil';

interface ProfileDto {
  id: string;
  username: string | null;
  energy_level: number | null;
  wake_up_time: string | null;
  sleep_time: string | null;
  is_complete: boolean;
}

export class ApiUserRepository implements UserRepository {
  async get(): Promise<User | null> {
    const dto = await backendRequest<ProfileDto>(RUTA);

    // El backend responde 200 con un perfil vacio cuando el onboarding no
    // termino, y calcula is_complete para que la regla viva en un solo lado.
    // Un perfil a medias se trata como inexistente porque User valida sus
    // campos y construirlo con nulos lanzaria.
    if (!dto?.is_complete) return null;

    return new User({
      id: dto.id,
      name: dto.username ?? '',
      energyLevel: dto.energy_level as number,
      wakeUpTime: dto.wake_up_time as string,
      sleepTime: dto.sleep_time as string,
    });
  }

  async save(user: User): Promise<void> {
    // Sin id: el backend lo toma del token.
    await backendRequest<ProfileDto>(RUTA, {
      method: 'PUT',
      body: {
        username: user.name,
        energy_level: user.energyLevel,
        wake_up_time: user.wakeUpTime,
        sleep_time: user.sleepTime,
      },
    });
  }

  async delete(): Promise<void> {
    // Vacia los campos sin borrar la fila; el backend explica por que.
    await backendRequest<ProfileDto>(RUTA, { method: 'DELETE' });
  }
}
