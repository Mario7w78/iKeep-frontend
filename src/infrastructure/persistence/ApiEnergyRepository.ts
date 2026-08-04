import {
  EnergyRecord,
  EnergyRepository,
} from '../../application/ports/out/EnergyRepository';
import { backendRequest } from '../api/backendClient';

/**
 * Historial de energia a traves del backend.
 *
 * La poda de los registros viejos ya no viaja con cada alta: el backend la
 * hace del lado del servidor, junto al insert. El cliente solo reporta.
 */

const RUTA = '/api/v1/energia';
const RUTA_AJUSTES = '/api/v1/ajustes';

interface EnergyDto {
  timestamp: string;
  nivel: number;
  dia_semana: number;
  contexto: string | null;
}

export class ApiEnergyRepository implements EnergyRepository {
  async save(record: EnergyRecord): Promise<void> {
    // dia_semana no se manda: el backend lo deriva del timestamp para que no
    // puedan llegar contradiciendose.
    await backendRequest<EnergyDto>(RUTA, {
      method: 'POST',
      body: {
        nivel: record.nivel,
        timestamp: record.timestamp,
        contexto: record.contexto ?? null,
      },
    });
  }

  async history(days: number): Promise<EnergyRecord[]> {
    const dtos = await backendRequest<EnergyDto[]>(`${RUTA}?dias=${days}`);
    return (dtos ?? []).map((d) => ({
      timestamp: d.timestamp,
      nivel: d.nivel,
      dia_semana: d.dia_semana,
      contexto: d.contexto ?? undefined,
    }));
  }

  async reportedToday(): Promise<boolean> {
    const respuesta = await backendRequest<{ reportado: boolean }>(
      `${RUTA}/hoy`
    );
    return respuesta?.reportado ?? false;
  }

  async getPatternOverride(): Promise<string | null> {
    const ajustes = await backendRequest<{ custom_energy_pattern: string | null }>(
      RUTA_AJUSTES
    );
    return ajustes?.custom_energy_pattern ?? null;
  }

  async savePatternOverride(pattern: string | null): Promise<void> {
    await backendRequest(RUTA_AJUSTES, {
      method: 'PATCH',
      body: { custom_energy_pattern: pattern },
    });
  }
}
