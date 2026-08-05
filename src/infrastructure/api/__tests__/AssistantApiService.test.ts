/**
 * El cliente del asistente. Su trabajo es poco: mandar el mensaje con la
 * memoria de la conversación y devolver lo que responda.
 *
 * Lo que sí importa es que no toque los turnos. Viajan verbatim porque el
 * modelo tiene que recibir de vuelta su propio JSON estructurado;
 * reinterpretarlos aquí desharía el arreglo del "se olvida".
 */

jest.mock('../backendClient', () => ({
  backendRequest: jest.fn(),
  BackendError: class BackendError extends Error {},
}));

import { backendRequest } from '../backendClient';
import { conversarConAsistente } from '../AssistantApiService';

const pedir = backendRequest as jest.Mock;

const RESPUESTA = {
  tipo: 'pregunta',
  mensaje: 'Que dias?',
  borrador: { name: 'Calculo' },
  turnos: [{ role: 'user', content: 'calculo' }],
  propuesta: null,
};

describe('conversarConAsistente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pedir.mockResolvedValue(RESPUESTA);
  });

  it('llama al endpoint del asistente', async () => {
    await conversarConAsistente({ mensaje: 'clase de calculo' });

    expect(pedir).toHaveBeenCalledWith(
      '/api/v1/asistente/conversar',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('manda el borrador y los turnos previos', async () => {
    await conversarConAsistente({
      mensaje: 'los martes',
      borrador: { name: 'Calculo' },
      turnos: [{ role: 'user', content: 'calculo' }],
    });

    const [, opciones] = pedir.mock.calls[0];
    expect(opciones.body.borrador).toEqual({ name: 'Calculo' });
    expect(opciones.body.turnos).toHaveLength(1);
  });

  it('sin memoria previa manda lo vacio, no undefined', async () => {
    await conversarConAsistente({ mensaje: 'hola' });

    const [, opciones] = pedir.mock.calls[0];
    expect(opciones.body.borrador).toEqual({});
    expect(opciones.body.turnos).toEqual([]);
  });

  it('devuelve la respuesta tal cual', async () => {
    const respuesta = await conversarConAsistente({ mensaje: 'hola' });

    expect(respuesta.tipo).toBe('pregunta');
    expect(respuesta.borrador.name).toBe('Calculo');
  });

  it('no reinterpreta los turnos que devuelve el backend', async () => {
    /** Si se tocaran, el modelo dejaria de recibir su propio JSON. */
    const turnosConTools = [
      { role: 'assistant', content: '', tool_calls: [{ id: 'c1', type: 'function' }] },
      { role: 'tool', tool_call_id: 'c1', content: '{"ok":true}' },
    ];
    pedir.mockResolvedValue({ ...RESPUESTA, turnos: turnosConTools });

    const respuesta = await conversarConAsistente({ mensaje: 'hola' });

    expect(respuesta.turnos).toEqual(turnosConTools);
  });

  it('propaga una propuesta', async () => {
    pedir.mockResolvedValue({
      ...RESPUESTA,
      tipo: 'propuesta',
      propuesta: { tipo: 'crear', borrador: { name: 'Calculo' } },
    });

    const respuesta = await conversarConAsistente({ mensaje: 'dale' });

    expect(respuesta.propuesta?.tipo).toBe('crear');
  });

  it('propaga los errores del cliente', async () => {
    pedir.mockRejectedValue(new Error('sin red'));

    await expect(conversarConAsistente({ mensaje: 'hola' })).rejects.toThrow('sin red');
  });
});
