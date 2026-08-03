/**
 * The backend sleeps after ~15 min on the free tier and takes 20-50s to wake,
 * so it gets pinged whenever the user is likely to need it soon. Pinging is
 * cheap but not free, and the app warms up from several places, so the
 * throttle lives here rather than in each caller.
 *
 * The throttle keeps its last timestamp in module scope, so every test
 * re-imports the module to start from a clean slate.
 */

describe('warmUpBackend', () => {
  let apiConfig: typeof import('../apiConfig');

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    (globalThis as any).fetch = jest.fn().mockResolvedValue({ ok: true } as Response);
    apiConfig = require('../apiConfig');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('pings the health endpoint', () => {
    apiConfig.warmUpBackend();

    expect((globalThis as any).fetch).toHaveBeenCalledTimes(1);
    expect(((globalThis as any).fetch as jest.Mock).mock.calls[0][0]).toBe(
      `${apiConfig.API_ROOT}/health`
    );
  });

  it('no repite el ping dentro de la ventana', () => {
    apiConfig.warmUpBackend();
    jest.advanceTimersByTime(apiConfig.WARM_UP_THROTTLE_MS - 1000);
    apiConfig.warmUpBackend();

    expect((globalThis as any).fetch).toHaveBeenCalledTimes(1);
  });

  it('vuelve a pinguear pasada la ventana', () => {
    apiConfig.warmUpBackend();
    jest.advanceTimersByTime(apiConfig.WARM_UP_THROTTLE_MS + 1000);
    apiConfig.warmUpBackend();

    expect((globalThis as any).fetch).toHaveBeenCalledTimes(2);
  });

  it('no explota si el ping falla', () => {
    ((globalThis as any).fetch as jest.Mock).mockRejectedValue(new Error('sin red'));

    expect(() => apiConfig.warmUpBackend()).not.toThrow();
  });

  it('un ping fallido no bloquea el siguiente intento', () => {
    ((globalThis as any).fetch as jest.Mock).mockRejectedValue(new Error('sin red'));

    apiConfig.warmUpBackend();
    jest.advanceTimersByTime(apiConfig.WARM_UP_THROTTLE_MS + 1000);
    apiConfig.warmUpBackend();

    expect((globalThis as any).fetch).toHaveBeenCalledTimes(2);
  });
});
