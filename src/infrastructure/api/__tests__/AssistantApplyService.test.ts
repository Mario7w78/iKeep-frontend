/**
 * Aplicar una propuesta confirmada en un solo viaje.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const mockBackendRequest = jest.fn();
jest.mock('../backendClient', () => ({
  backendRequest: (...args: any[]) => mockBackendRequest(...args),
}));

import { Activity, ActivityType } from '../../../domain/entities/Activity';
import { aplicarPropuesta } from '../AssistantApplyService';

const RESPUESTA = {
  estado: 'OPTIMO',
  mensaje: 'listo',
  recomendaciones: [],
  tareas_omitidas: [],
  scheduled_activities: [{ assignedStartTime: '10:00', day: 'Martes' }],
  actividades: [
    {
      id: '1754000000000',
      title: 'Calculo',
      type: 'FIXED',
      days_enabled: ['Martes'],
      days_config: {},
    },
  ],
};

function actividad() {
  return new Activity({
    id: '1754000000000',
    title: 'Calculo',
    type: ActivityType.FIXED,
    identity: 'clase',
    priority: 3,
    difficulty: 'media',
    deadline: null,
    daysEnabled: ['Martes'],
    daysConfig: {},
  } as any);
}

function cuerpoEnviado() {
  // `backendRequest` recibe el objeto; el stringify lo hace el cliente real.
  return mockBackendRequest.mock.calls[0][1].body;
}

describe('aplicarPropuesta', () => {
  beforeEach(() => {
    mockBackendRequest.mockReset();
    mockBackendRequest.mockResolvedValue(RESPUESTA);
  });

  it('hace una sola llamada', async () => {
    await aplicarPropuesta({ tipo: 'crear', actividad: actividad() });

    expect(mockBackendRequest).toHaveBeenCalledTimes(1);
  });

  it('manda el desfase del reloj: el servidor no puede adivinarlo', async () => {
    // getTimezoneOffset devuelve el signo invertido respecto de UTC.
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(300);

    await aplicarPropuesta({ tipo: 'crear', actividad: actividad() });

    expect(cuerpoEnviado().desfase_utc_minutos).toBe(-300);
  });

  it('devuelve las actividades ya como entidades', async () => {
    const resultado = await aplicarPropuesta({ tipo: 'regenerar' });

    expect(resultado.actividades[0]).toBeInstanceOf(Activity);
    expect(resultado.actividades[0].title).toBe('Calculo');
  });

  it('eliminar viaja con el id y sin actividad', async () => {
    await aplicarPropuesta({ tipo: 'eliminar', activityId: 'act-9' });

    expect(cuerpoEnviado()).toMatchObject({
      tipo: 'eliminar',
      activity_id: 'act-9',
      actividad: null,
    });
  });

  it('propaga el error en vez de tragarlo', async () => {
    // Si falla, la tarjeta del chat no debe darse por confirmada.
    mockBackendRequest.mockRejectedValue(new Error('409'));

    await expect(
      aplicarPropuesta({ tipo: 'crear', actividad: actividad() })
    ).rejects.toThrow('409');
  });
});
