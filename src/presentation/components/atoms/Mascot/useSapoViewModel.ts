import { useEffect, useMemo, useState } from 'react';

import { EtapaSapo, frogStageDe } from '../../../../domain/services/frogStage';
import { useRewardsStore } from '../../../../infrastructure/store/useRewardsStore';
import { AnimacionSapo, SapoState, animacionDe } from './sapoStates';

/** Los artboards coinciden uno a uno con las etapas del archivo Rive. */
export type ArtboardSapo = 'Baby_Sapo' | 'Kid_Sapo' | 'Adult_Sapo';

const ARTBOARD_POR_ETAPA: Record<EtapaSapo, ArtboardSapo> = {
  'bebé': 'Baby_Sapo',
  'niño': 'Kid_Sapo',
  adulto: 'Adult_Sapo',
};

export interface SapoViewModel {
  etapa: EtapaSapo;
  artboard: ArtboardSapo;
  /** Qué reproducir ahora. */
  animacion: string;
  /** Loop que corre encima del principal (el parpadeo), si hay. */
  ambiental?: string;
  /** false ⇒ OneShot; al terminar, `alTerminar` devuelve al reposo. */
  enBucle: boolean;
  /** Lo llama el componente cuando el runtime avisa que terminó una. */
  alTerminar(nombre: string): void;
}

/**
 * Del dato a la pantalla: racha → etapa → artboard y animación.
 *
 * El estado de la app (`estado`, la racha) elige qué se ve; el cambio de
 * etapa o de estado remonta el componente por `key` (ver Sapo), así que
 * acá no hay que negociar con un runtime ya cargado.
 */
export function useSapoViewModel(estado: SapoState): SapoViewModel {
  const racha = useRewardsStore((s) => s.racha.actual);

  const etapa = useMemo(() => frogStageDe(racha), [racha]);
  const mapeo: AnimacionSapo = useMemo(
    () => animacionDe(estado, etapa),
    [estado, etapa]
  );

  // Los estados de una sola pasada vuelven al reposo cuando terminan:
  // una celebración congelada a mitad de salto deja de celebrar nada.
  const [terminada, setTerminada] = useState<string | null>(null);
  useEffect(() => setTerminada(null), [estado, etapa]);

  const volvioAlReposo =
    !mapeo.enBucle && terminada !== null && mapeo.principal === terminada;

  return {
    etapa,
    artboard: ARTBOARD_POR_ETAPA[etapa],
    animacion: volvioAlReposo ? 'Idle' : mapeo.principal,
    ambiental: volvioAlReposo ? 'Blinking' : mapeo.ambiental,
    enBucle: volvioAlReposo ? true : mapeo.enBucle,
    // Si termina otra (por ejemplo el ambiente pausado al irse de la
    // app), no cambia nada: solo interesa la del propio estado.
    alTerminar: (nombre: string) => {
      if (nombre === mapeo.principal) setTerminada(nombre);
    },
  };
}
