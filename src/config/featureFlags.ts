/**
 * Si el acceso a datos pasa por el backend o va directo a Supabase.
 *
 * Existe para poder volver atras sin revertir codigo: los adaptadores nuevos
 * implementan los mismos puertos, asi que cambiar este valor cambia el camino
 * entero sin tocar casos de uso ni stores.
 *
 * Vive suelto y no en Dependencies.ts porque tambien lo consultan modulos que
 * el propio Dependencies importa —EnergyHistoryService, entre otros— y
 * tenerlo alli crearia un ciclo.
 */
export const USA_BACKEND_PARA_DATOS = true;

/**
 * Si el chat usa el motor conversacional nuevo.
 *
 * El endpoint viejo sigue montado, asi que volver atras es cambiar este
 * valor: no hay que revertir codigo ni redeployar el backend.
 *
 * Arranca apagado hasta probarlo en dispositivo. El motor esta verificado con
 * conversaciones doradas contra modelos reales, pero eso mide la conversacion,
 * no la pantalla.
 */
export const USA_ASISTENTE_V2 = true;
