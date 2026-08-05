import {
  PeticionAsistente,
  RespuestaAsistente,
} from '../../domain/entities/conversation.types';
import { backendRequest } from './backendClient';

const RUTA = '/api/v1/asistente/conversar';

/**
 * Un turno de conversación con el asistente.
 *
 * A diferencia del endpoint anterior, aquí no se arma ningún contexto: el
 * backend lee la agenda de la base de datos y la entrega al modelo con ids.
 * Las cincuenta líneas que serializaban la agenda como prosa española
 * desaparecen, y con ellas la razón por la que el asistente solo sabía crear.
 *
 * El borrador y los turnos son la memoria de la conversación. Viajan en cada
 * petición porque el backend es stateless: sostener sesiones en memoria no
 * sobreviviría a que Render duerma el contenedor.
 */
export async function conversarConAsistente(
  peticion: PeticionAsistente
): Promise<RespuestaAsistente> {
  return backendRequest<RespuestaAsistente>(RUTA, {
    method: 'POST',
    body: {
      mensaje: peticion.mensaje,
      // Vacíos y no undefined: el backend los declara con default, pero
      // mandar la forma explícita evita depender de esa coincidencia.
      borrador: peticion.borrador ?? {},
      turnos: peticion.turnos ?? [],
      ya_pregunte: peticion.ya_pregunte ?? [],
      energia: peticion.energia ?? null,
    },
    // Se deja el timeout por defecto, que es el largo: un turno puede
    // necesitar varias llamadas al proveedor y encima el servidor puede estar
    // despertando.
  });
}
