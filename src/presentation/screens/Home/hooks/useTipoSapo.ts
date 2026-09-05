import { useRewardsStore } from "../../../../infrastructure/store/useRewardsStore";
import {
  EtapaSapo,
  TIPO_SAPO_POR_ETAPA,
  frogStageDe,
} from "../../../../domain/services/frogStage";

/**
 * El tipo de sapo que le toca mostrar, derivado de un estado global: la racha.
 *
 * La racha vive en `useRewardsStore` y se actualiza sola con cada cierre y
 * con cada actividad completada. Este hook es el puente que traduce esa
 * racha a la etapa (`bebé` / `niño` / `adulto`) y de ahí al artboard numérico
 * que entiende Rive (`0` / `1` / `2`).
 *
 * Al cambiar la racha cambia el `tipoSapo` devuelto. El Home lo usa como
 * `key` del `<Sapo>`, así el componente se recrea y arranca de cero con el
 * nuevo artboard en el momento en que se cruza un umbral.
 */
export function useTipoSapo(): { tipoSapo: 0 | 1 | 2; etapa: EtapaSapo } {
  const rachaActual = useRewardsStore((s) => s.racha.actual);
  const etapa = frogStageDe(rachaActual);
  return { tipoSapo: TIPO_SAPO_POR_ETAPA[etapa], etapa };
}
