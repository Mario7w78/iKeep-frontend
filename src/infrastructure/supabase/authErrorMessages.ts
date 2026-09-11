import { AuthError } from '@supabase/supabase-js';

/**
 * Lo que le decimos al usuario cuando falla el inicio de sesión.
 *
 * Supabase devuelve el mensaje original ("Invalid login credentials", "Email
 * not confirmed") y un `code`; el texto en inglés es ruido para quien está
 * tratando de entrar. Este traductor convierte el error en algo accionable:
 * la falla de credenciales es siempre ambigua a propósito (no se dice si el
 * correo existe, para no filtrar cuentas), así que el mensaje cubre los dos
 * casos.
 */

const CREDENCIALES_INVALIDAS =
  'El correo o la contraseña son incorrectos. Si todavía no tienes cuenta, regístrate primero.';

const CORREO_SIN_CONFIRMAR =
  'Todavía no confirmas tu correo. Revisa tu bandeja de entrada y toca el enlace que te enviamos.';

const ALGO_SALIO_MAL =
  'No pudimos iniciar sesión. Revisa tu conexión y vuelve a intentarlo.';

/**
 * Traduce el error del login de Supabase a un mensaje claro.
 *
 * `error` es nullable porque el contrato de `signInWithPassword` devuelve
 * `{ error }` y el nulo es simplemente "no hubo error".
 */
export function traducirErrorLogin(error: AuthError | null): string | null {
  if (!error) return null;

  const codigo = error.code;
  const mensaje = (error.message ?? '').toLowerCase();

  if (codigo === 'invalid_credentials' || mensaje.includes('invalid login credentials')) {
    return CREDENCIALES_INVALIDAS;
  }
  if (codigo === 'email_not_confirmed' || mensaje.includes('email not confirmed')) {
    return CORREO_SIN_CONFIRMAR;
  }

  return ALGO_SALIO_MAL;
}