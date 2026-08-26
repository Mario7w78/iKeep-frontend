import type { EtapaSapo } from '../../../../domain/services/frogStage';

export type SapoState =
  | 'idle'
  | 'thinking'
  | 'happy'
  | 'celebrating'
  | 'sad'
  | 'sleeping'
  | 'waving';

export const ESTADOS_CON_ANIMACION: SapoState[] = [
  'celebrating',
];
export type SapoRiveState = 'Idle' | 'Success';

export function estadoRiveDe(estado: SapoState): SapoRiveState {
  return estado === 'celebrating' ? 'Success' : 'Idle';
}
