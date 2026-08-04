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
export const USA_BACKEND_PARA_DATOS = false;
