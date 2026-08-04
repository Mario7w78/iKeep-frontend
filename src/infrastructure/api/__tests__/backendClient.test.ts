/**
 * Every backend route is authenticated, so the client's whole job is to
 * attach the current session token and turn transport failures into errors
 * the app can reason about.
 */

jest.mock('../../supabase/client', () => ({
  supabase: { auth: { getSession: jest.fn() } },
}));

import { supabase } from '../../supabase/client';
import { BackendError, backendRequest } from '../backendClient';

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
