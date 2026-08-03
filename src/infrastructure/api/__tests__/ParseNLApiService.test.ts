import { ParseNLApiService, sendConversation } from '../ParseNLApiService';

const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

describe('ParseNLApiService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('sends POST request to parse-nl endpoint with text payload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'Test', schedule: [], confidence: 1, missing_fields: [] }),
    });

    await ParseNLApiService({ text: 'Fútbol los lunes' });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/parse-nl');
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body)).toEqual({ text: 'Fútbol los lunes' });
  });

  it('returns parsed response on success', async () => {
    const apiResponse = {
      name: 'Fútbol',
      activity_type: 'tarea' as const,
      is_fixed: true,
      is_anchor: false,
      difficulty: 'media' as const,
      priority: 'alta' as const,
      schedule: [{ day: 'Lunes', start_time: 540, end_time: 660 }],
      location: 'Cancha',
      confidence: 0.95,
      missing_fields: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => apiResponse,
    });

    const result = await ParseNLApiService({ text: 'test' });
    expect(result).toEqual(apiResponse);
  });

  it('throws error when API returns 422', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ detail: 'Invalid text' }),
    });

    await expect(ParseNLApiService({ text: '' })).rejects.toThrow();
  });

  it('throws error when API returns 503', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ detail: 'LLM unavailable' }),
    });

    await expect(ParseNLApiService({ text: 'test' })).rejects.toThrow();
  });

  it('retries on network error', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Network request failed'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Retry', schedule: [], confidence: 0.8, missing_fields: [] }),
      });

    const result = await ParseNLApiService({ text: 'test' });
    expect(result.name).toBe('Retry');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting retries', async () => {
    mockFetch.mockRejectedValue(new Error('Network request failed'));

    await expect(ParseNLApiService({ text: 'test' })).rejects.toThrow('Network request failed');
    // Called initial + 2 retries = 3 total
    expect(mockFetch).toHaveBeenCalledTimes(3);
  }, 10000);
});

describe('sendConversation', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('passes an abort signal to fetch so the timeout can actually fire', async () => {
    // Regression: the signal used to be created and then dropped, leaving
    // the conversation endpoint with no timeout at all.
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ type: 'chat', ai_message: 'hola' }),
    });

    await sendConversation('hola', []);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/parse-nl-conversation');
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(options.signal.aborted).toBe(false);
  });

  it('aborts the request once the timeout elapses', async () => {
    jest.useFakeTimers();

    let captured: AbortSignal | undefined;
    mockFetch.mockImplementationOnce((_url: string, options: any) => {
      captured = options.signal;
      return new Promise(() => {
        // Never settles: stands in for a backend that is still asleep.
      });
    });

    void sendConversation('hola', []);
    await Promise.resolve();

    expect(captured?.aborted).toBe(false);
    // First attempt gets the cold-start budget.
    jest.advanceTimersByTime(60_000);
    expect(captured?.aborted).toBe(true);

    jest.useRealTimers();
  });

  it('sends history and agenda context in the body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ type: 'chat', ai_message: 'ok' }),
    });

    await sendConversation(
      'agrega algebra',
      [{ role: 'user', content: 'hola' }],
      'Nombre: "Cálculo"',
      'Martes'
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.text).toBe('agrega algebra');
    expect(body.history).toHaveLength(1);
    expect(body.agenda_context).toBe('Nombre: "Cálculo"');
    expect(body.current_day).toBe('Martes');
  });
});
