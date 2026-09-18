import { Alert } from 'react-native';

import { Activity } from '../../../domain/entities/Activity';
import { Schedule } from '../../../domain/entities/Schedule';

const mockMover = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../infrastructure/store/useCalendarStore', () => ({
  useCalendarStore: { getState: () => ({ mover: mockMover }) },
}));

const mockActivities: any[] = [];
jest.mock('../../../di/Dependencies', () => ({
  useActivityStore: { getState: () => ({ activities: mockActivities }) },
  useScheduleStore: { getState: () => ({ schedule: null }) },
}));

import { avisosAlMover, moverOcurrencia } from '../moverOcurrencia';

const fija = (over: Partial<Activity> = {}) =>
  ({ id: 'a1', title: 'Cálculo', isFixed: () => true, ...over } as unknown as Activity);

const flexible = () =>
  ({ id: 'a1', title: 'Leer', isFixed: () => false } as unknown as Activity);

function scheduleFalso(
  items: any[],
  porDia: Record<string, any[]> = {},
): Schedule {
  return {
    getAllItems: () => items,
    getItemsByDay: (day: string) => porDia[day] ?? [],
  } as unknown as Schedule;
}

beforeEach(() => {
  mockMover.mockClear();
  mockActivities.length = 0;
  jest.restoreAllMocks();
});

describe('avisosAlMover', () => {
  it('avisa cuando la actividad es a hora fija', () => {
    const avisos = avisosAlMover('a1', '2026-08-13', fija(), null);

    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toContain('a hora fija');
    expect(avisos[0]).toContain('Cálculo');
  });

  it('no dice nada de una actividad flexible sin horario cargado', () => {
    expect(avisosAlMover('a1', '2026-08-13', flexible(), null)).toEqual([]);
  });

  it('avisa del choque con otra actividad del día destino', () => {
    const schedule = scheduleFalso(
      [{ activity: { id: 'a1' }, assignedStartTime: '08:00', assignedEndTime: '10:00' }],
      {
        Jueves: [
          {
            activity: { id: 'b1', title: 'Trabajo' },
            assignedStartTime: '09:00',
            assignedEndTime: '11:00',
          },
        ],
      },
    );

    const avisos = avisosAlMover('a1', '2026-08-13', flexible(), schedule);

    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toContain('Trabajo');
    expect(avisos[0]).toContain('09:00');
  });

  it('no avisa de choque si el bloque no se superpone', () => {
    const schedule = scheduleFalso(
      [{ activity: { id: 'a1' }, assignedStartTime: '08:00', assignedEndTime: '10:00' }],
      {
        Jueves: [
          {
            activity: { id: 'b1', title: 'Trabajo' },
            assignedStartTime: '10:00',
            assignedEndTime: '11:00',
          },
        ],
      },
    );

    expect(avisosAlMover('a1', '2026-08-13', flexible(), schedule)).toEqual([]);
  });

  it('no se compara consigo misma', () => {
    const schedule = scheduleFalso(
      [{ activity: { id: 'a1' }, assignedStartTime: '08:00', assignedEndTime: '10:00' }],
      {
        Jueves: [
          {
            activity: { id: 'a1', title: 'Cálculo' },
            assignedStartTime: '08:00',
            assignedEndTime: '10:00',
          },
        ],
      },
    );

    expect(avisosAlMover('a1', '2026-08-13', flexible(), schedule)).toEqual([]);
  });
});

describe('moverOcurrencia', () => {
  it('mueve directo cuando no hay nada que avisar', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    await moverOcurrencia('a1', '2026-08-11', '2026-08-13');

    expect(alert).not.toHaveBeenCalled();
    expect(mockMover).toHaveBeenCalledWith('a1', '2026-08-11', '2026-08-13');
  });

  it('pregunta antes de mover una fija y mueve si el usuario acepta', async () => {
    mockActivities.push(fija());
    let botones: any[] = [];
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, b) => {
      botones = (b as any[]) ?? [];
    });

    const promesa = moverOcurrencia('a1', '2026-08-11', '2026-08-13');
    expect(mockMover).not.toHaveBeenCalled();

    botones.find((b) => b.text === 'Mover').onPress();
    await promesa;

    expect(mockMover).toHaveBeenCalledWith('a1', '2026-08-11', '2026-08-13');
  });

  it('no mueve si el usuario decide dejarla', async () => {
    mockActivities.push(fija());
    let botones: any[] = [];
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, b) => {
      botones = (b as any[]) ?? [];
    });

    const promesa = moverOcurrencia('a1', '2026-08-11', '2026-08-13');
    botones.find((b) => b.text === 'Dejarla').onPress();
    await promesa;

    expect(mockMover).not.toHaveBeenCalled();
  });
});
