import { BackendError } from '../api/backendClient';

/**
 * Lo que el chat le dice al usuario cuando algo falla.
 *
 * Antes el mapeador terminaba en `return errMsg` y dejaba pasar el texto
 * técnico: "El servidor respondió 500." aparecía tal cual en la conversación.
 * Un código de estado no es información para quien está creando una clase —
 * es ruido con aspecto de culpa suya, y encima no le dice qué hacer.
 *
 * La regla es simple: un `BackendError` es siempre técnico y nunca se muestra
 * literal. Cualquier otro error viene de una validación —solapamientos,
 * formatos— y ese sí se muestra, porque dice exactamente qué corregir.
 *
 * El tono es español neutro. La versión anterior decía "me voy a tomar una
 * siestita arriba de un camalote", que además de regional no ayudaba a nadie.
 */

const SIN_CONEXION =
  'No pude conectarme. Revisa tu conexión y vuelve a intentarlo.';

const TARDO_DEMASIADO =
  'Esto está tardando más de lo normal. La primera vez del día suele ser la más lenta; intenta de nuevo en un momento.';

const SESION_VENCIDA =
  'Tu sesión expiró. Vuelve a iniciar sesión para continuar.';

const DEMASIADOS_INTENTOS =
  'Estoy recibiendo muchas peticiones. Espera un minuto y volvemos a intentarlo.';

const NO_SE_PUDO_APLICAR =
  'No pude acomodar ese cambio en tu horario, así que lo dejé como estaba. Prueba con otro horario o ajusta la actividad a mano.';

const ALGO_SALIO_MAL =
  'Algo salió mal de mi lado. No se perdió nada; vuelve a intentarlo.';

/**
 * Traduce un error a algo que el usuario pueda leer y accionar.
 *
 * `respaldo` se usa solo cuando el error no trae nada aprovechable.
 */
export function mensajeParaElUsuario(
  error: unknown,
  respaldo: string = ALGO_SALIO_MAL
): string {
  if (error instanceof BackendError) {
    if (error.status === 401 || error.status === 403) return SESION_VENCIDA;
    if (error.status === 429) return DEMASIADOS_INTENTOS;
    if (error.status === 409) return NO_SE_PUDO_APLICAR;
    // Sin status es un fallo de red: o no se pudo conectar, o se agotó la
    // espera. El texto original distingue los dos casos.
    if (error.status === null) {
      return /tard/i.test(error.message) ? TARDO_DEMASIADO : SIN_CONEXION;
    }
    return ALGO_SALIO_MAL;
  }

  const texto = (error as any)?.message ?? '';

  // Los proveedores de modelos devuelven su propia jerga. Tampoco es del
  // usuario.
  if (/rate limit|too many requests|429/i.test(texto)) return DEMASIADOS_INTENTOS;
  if (/network|timeout|fetch|service unavailable|503|model not available/i.test(texto)) {
    return SIN_CONEXION;
  }

  return texto.trim() || respaldo;
}
