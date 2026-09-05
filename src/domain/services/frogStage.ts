/**
 * Etapa de crecimiento del sapo según la racha.
 *
 * La mascota crece con el hábito, no con la compra: la racha es la medida
 * honesta de cuánto viene estudiando la persona. Los cortes son anchos a
 * propósito —pasar de etapa tiene que ser un evento raro— y viven acá y no
 * en la pantalla porque son reglas del dominio, no decisión de interfaz.
 */

/** Las etapas coinciden con los artboards de `sapo_animations.riv`. */
export type EtapaSapo = 'bebé' | 'niño' | 'adulto';

/** Días de racha para pasar de bebé a niño. */
export const RACHA_NIÑO = 8;

/** Días de racha para pasar de niño a adulto. */
export const RACHA_ADULTO = 31;

/**
 * La etapa que le toca a una racha.
 *
 * Una racha negativa solo puede venir de un dato mal cargado: en vez de
 * romper la pantalla por un adorno, se muestra al bebé.
 */
export function frogStageDe(rachaActual: number): EtapaSapo {
  if (rachaActual >= RACHA_ADULTO) return 'adulto';
  if (rachaActual >= RACHA_NIÑO) return 'niño';
  return 'bebé';
}

/**
 * El index del artboard (`Baby_Sapo`, `Kid_Sapo`, `Adult_Sapo`) que le
 * corresponde a una etapa.
 *
 * Es el puente entre el dominio (la etapa) y Rive (el artboard): el Home le
 * pasa este número al `Sapo` como `tipoSapo`, y al cambiar obliga a recrear
 * el componente con la nueva apariencia.
 */
export const TIPO_SAPO_POR_ETAPA: Record<EtapaSapo, 0 | 1 | 2> = {
  bebé: 0,
  niño: 1,
  adulto: 2,
};
