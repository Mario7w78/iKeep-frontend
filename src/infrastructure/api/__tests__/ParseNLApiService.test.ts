import { ParseNLApiService } from '../ParseNLApiService';

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
