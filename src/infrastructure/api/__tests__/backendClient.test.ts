/**
 * Every backend route is authenticated, so the client's whole job is to
 * attach the current session token and turn transport failures into errors
 * the app can reason about.
 */

jest.mock('../../supabase/client', () => ({
  supabase: { auth: { getSession: jest.fn() } },
}));

import { supabase } from '../../supabase/client';
import { BackendError, backendRequest, conReintentos } from '../backendClient';

const getSession = supabase.auth.getSession as jest.Mock;

function conSesion(token: string | null) {
  getSession.mockResolvedValue({
    data: { session: token ? { access_token: token } : null },
  });
}

function respuesta(status: number, body: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as Response;
}

describe('backendRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    conSesion('el-jwt');
    (globalThis as any).fetch = jest.fn().mockResolvedValue(respuesta(200, { ok: true }));
  });

  it('manda el token de la sesion actual', async () => {
    await backendRequest('/api/v1/actividades');

    const [, opciones] = ((globalThis as any).fetch as jest.Mock).mock.calls[0];
    expect(opciones.headers.Authorization).toBe('Bearer el-jwt');
  });

  it('falla sin llamar a la red cuando no hay sesion', async () => {
    conSesion(null);

    await expect(backendRequest('/api/v1/actividades')).rejects.toThrow(BackendError);
    expect((globalThis as any).fetch).not.toHaveBeenCalled();
  });

  it('devuelve el cuerpo parseado', async () => {
    (globalThis as any).fetch = jest
      .fn()
      .mockResolvedValue(respuesta(200, [{ id: 'act-1' }]));

    await expect(backendRequest('/api/v1/actividades')).resolves.toEqual([
      { id: 'act-1' },
    ]);
  });

  it('devuelve undefined en un 204', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue(respuesta(204));

    await expect(backendRequest('/api/v1/actividades/x', { method: 'DELETE' }))
      .resolves.toBeUndefined();
  });

  it('serializa el cuerpo como JSON', async () => {
    await backendRequest('/api/v1/actividades/act-1', {
      method: 'PUT',
      body: { title: 'Calculo' },
    });

    const [, opciones] = ((globalThis as any).fetch as jest.Mock).mock.calls[0];
    expect(opciones.body).toBe(JSON.stringify({ title: 'Calculo' }));
    expect(opciones.headers['Content-Type']).toBe('application/json');
  });

  it('convierte un error HTTP en BackendError con su status', async () => {
    (globalThis as any).fetch = jest
      .fn()
      .mockResolvedValue(respuesta(404, { detail: 'No existe' }));

    await expect(backendRequest('/api/v1/actividades/x')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('marca los 401 para que la app pueda cerrar sesion', async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue(respuesta(401));

    await expect(backendRequest('/api/v1/actividades')).rejects.toMatchObject({
      status: 401,
      isAuthError: true,
    });
  });

  it('un fallo de red tambien llega como BackendError', async () => {
    (globalThis as any).fetch = jest.fn().mockRejectedValue(new TypeError('sin red'));

    await expect(backendRequest('/api/v1/actividades')).rejects.toThrow(BackendError);
  });
});

describe('conReintentos', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('reintenta un 502 y termina devolviendo el exito', async () => {
    jest.useFakeTimers();
    const peticion = jest
      .fn()
      .mockRejectedValueOnce(new BackendError('El servidor respondio 502.', 502))
      .mockResolvedValueOnce('ok');

    const promesa = conReintentos(peticion);
    await jest.advanceTimersByTimeAsync(10_000);

    await expect(promesa).resolves.toBe('ok');
    expect(peticion).toHaveBeenCalledTimes(2);
  });

  it('reintenta un fallo de red (status null)', async () => {
    jest.useFakeTimers();
    const peticion = jest
      .fn()
      .mockRejectedValueOnce(new BackendError('No se pudo conectar.', null))
      .mockResolvedValueOnce('ok');

    const promesa = conReintentos(peticion);
    await jest.advanceTimersByTimeAsync(10_000);

    await expect(promesa).resolves.toBe('ok');
    expect(peticion).toHaveBeenCalledTimes(2);
  });

  it('no reintenta un 4xx: no se arregla insistiendo', async () => {
    const peticion = jest.fn().mockRejectedValue(new BackendError('Fecha invalida', 422));

    await expect(conReintentos(peticion)).rejects.toMatchObject({ status: 422 });
    expect(peticion).toHaveBeenCalledTimes(1);
  });

  it('se rinde tras agotar los intentos', async () => {
    jest.useFakeTimers();
    const peticion = jest
      .fn()
      .mockRejectedValue(new BackendError('El servidor respondio 503.', 503));

    const promesa = conReintentos(peticion);
    // El handler se engancha antes de avanzar: si no, la promesa rechaza
    // mientras corren los timers y Jest lo reporta como rechazo sin manejar.
    const asercion = expect(promesa).rejects.toMatchObject({ status: 503 });
    await jest.advanceTimersByTimeAsync(60_000);

    await asercion;
    expect(peticion).toHaveBeenCalledTimes(3);
  });

  it('aborta los reintentos cuando debeSeguir lo dice', async () => {
    jest.useFakeTimers();
    const peticion = jest
      .fn()
      .mockRejectedValue(new BackendError('El servidor respondio 502.', 502));

    const promesa = conReintentos(peticion, { debeSeguir: () => false });
    const asercion = expect(promesa).rejects.toMatchObject({ status: 502 });
    await jest.advanceTimersByTimeAsync(10_000);

    await asercion;
    expect(peticion).toHaveBeenCalledTimes(1);
  });
});
