/**
 * Las palabras con las que la app le habla al usuario.
 *
 * Existe porque el mismo concepto tenía nombres distintos según la pantalla:
 * una actividad sin hora fija era "Optimizable" en el wizard y "Horario
 * Flexible" en el chat; los días de una actividad eran "Días programados" en
 * un lado y "Días asignados" en otro; un bloque de tiempo se llamaba
 * "Horario", "turno", "capa" y "bloque horario" en cuatro lugares distintos.
 *
 * Para quien usa la app eso no se lee como sinónimos: se lee como cosas
 * diferentes, y lo obliga a aprender un vocabulario más grande del necesario
 * para hacer lo mismo.
 *
 * Importar desde aquí en vez de escribir el literal es lo que evita que
 * vuelvan a separarse.
 */

export const COPY = {
  /** Una actividad cuya hora decide el planificador. */
  flexible: 'Flexible',
  /** Una actividad que siempre ocurre a la misma hora. */
  horaFija: 'Hora fija',
  /** Una actividad cuyo día pone el usuario y cuya hora decide el sistema. */
  diaFijo: 'Día fijo',

  /** Los días en que ocurre una actividad. Sin adjetivos. */
  dias: 'Días',

  /**
   * Un tramo de tiempo dentro de un día.
   *
   * Se elige "turno" porque es la única de las cuatro que un estudiante usa
   * al hablar: nadie dice "mi partición de la mañana".
   */
  turno: 'Turno',
  turnos: 'Turnos',

  /** El tiempo de viaje asociado a una actividad. */
  traslado: 'Traslado',
  trasladoAntes: 'Traslado antes',
  trasladoDespues: 'Traslado después',

  /**
   * El valor intermedio de dificultad y prioridad.
   *
   * Antes era "Normal" en dificultad y "Media" en prioridad, así que la misma
   * posición de la misma escala tenía dos nombres.
   */
  media: 'Media',
  baja: 'Baja',
  alta: 'Alta',
} as const;

/**
 * Abreviaturas de los días. La única del proyecto.
 *
 * Había SIETE definiciones y cuatro palabras distintas para miércoles: `Mi`
 * en el horario, `Mié` acá, `M` en la tarjeta del chat y `X` en los
 * selectores del wizard. La peor era la de una sola letra: `L M M J V S D`
 * obliga a resolver cada vez cuál de las dos `M` es martes.
 *
 * Tres letras porque es lo mínimo que desambigua martes/miércoles y
 * sábado/domingo sin que haya que pensarlo.
 */
export const DIA_CORTO: Record<string, string> = {
  /** Lo usa el horario para las actividades que ocurren todos los días. */
  Diario: 'Diario',
  Lunes: 'Lun',
  Martes: 'Mar',
  Miercoles: 'Mié',
  Miércoles: 'Mié',
  Jueves: 'Jue',
  Viernes: 'Vie',
  Sabado: 'Sáb',
  Sábado: 'Sáb',
  Domingo: 'Dom',
};
