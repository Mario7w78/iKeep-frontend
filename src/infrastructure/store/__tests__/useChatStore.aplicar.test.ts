/**
 * Confirmar en el chat con el camino de un solo viaje.
 *
 * Antes eran tres —guardar, generar, persistir— y la compensacion ante un
 * fallo del solver vivia escrita a mano aca dentro.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('../../../config/featureFlags', () => ({
  USA_BACKEND_PARA_DATOS: true,
  USA_APLICAR_EN_BACKEND: true,
}));

const mockAplicar = jest.fn();
jest.mock('../../api/AssistantApplyService', () => ({
  aplicarPropuesta: (...args: any[]) => mockAplicar(...args),
}));

import { createChatStore } from '../useChatStore';

const PROPUESTA: any = {
  id: 'msg-1',
  role: 'assistant',
  content: 'La creo?',
  timestamp: Date.now(),
  type: 'result',
  pendingActivity: {
    id: '1754000000000',
    isModification: false,
    originalName: null,
    parsedState: {
      activityName: 'Calculo',
      identity: 'clase',
      isFixed: true,
      isAnchor: false,
      selectedDays: ['Martes'],
      daysDict: { Martes: { partitions: [], groupId: 1 } },
      difficulty: 'media',
      priority: 'media',
    },
  },
};

function crearStore() {
  const generar = jest.fn().mockResolvedValue(undefined);
  const crear = jest.fn().mockResolvedValue(undefined);
  const hidratar = jest.fn();

  const activityStore: any = {
    getState: () => ({
      activities: [],
      handleCreateActivity: crear,
      handleDeleteActivity: jest.fn().mockResolvedValue(undefined),
    }),
    setState: jest.fn(),
  };
  const scheduleStore: any = {
    getState: () => ({
      schedule: { getItemsByDay: jest.fn().mockReturnValue([]) },
      perDayStartHours: null,
      startHour: 0,
      handleGenerateSchedule: generar,
      hidratarHorario: hidratar,
    }),
  };

  const store = createChatStore(activityStore, scheduleStore, jest.fn());
  return { store, activityStore, generar, crear, hidratar };
}

describe('confirmar con /aplicar', () => {
  beforeEach(() => {
    mockAplicar.mockReset();
    mockAplicar.mockResolvedValue({
      estado: 'OPTIMO',
      mensaje: 'listo',
      recomendaciones: [],
      tareasOmitidas: [],
      scheduledActivities: [],
      actividades: [{ id: '1754000000000' }],
    });
  });

  it('no hace los tres viajes viejos', async () => {
    const { store, generar, crear } = crearStore();
    store.setState({ messages: [PROPUESTA] });

    await store.getState().confirmPendingActivity('msg-1');

    expect(mockAplicar).toHaveBeenCalledTimes(1);
    expect(crear).not.toHaveBeenCalled();
    expect(generar).not.toHaveBeenCalled();
  });

  it('deja el horario que devolvio el servidor sin volver a pedirlo', async () => {
    const { store, hidratar } = crearStore();
    store.setState({ messages: [PROPUESTA] });

    await store.getState().confirmPendingActivity('msg-1');

    expect(hidratar).toHaveBeenCalledTimes(1);
  });

  it('deja las actividades que devolvio el servidor', async () => {
    const { store, activityStore } = crearStore();
    store.setState({ messages: [PROPUESTA] });

    await store.getState().confirmPendingActivity('msg-1');

    expect(activityStore.setState).toHaveBeenCalledWith({
      activities: [{ id: '1754000000000' }],
    });
  });

  it('una modificacion viaja como modificar', async () => {
    const { store } = crearStore();
    store.setState({
      messages: [
        { ...PROPUESTA, pendingActivity: { ...PROPUESTA.pendingActivity, isModification: true } },
      ],
    });

    await store.getState().confirmPendingActivity('msg-1');

    expect(mockAplicar.mock.calls[0][0].tipo).toBe('modificar');
  });

  it('si el servidor rechaza, la propuesta no queda confirmada', async () => {
    // El servidor ya deshizo el cambio: darla por hecha aca seria mentir.
    const { store } = crearStore();
    mockAplicar.mockRejectedValue(new Error('409'));
    store.setState({ messages: [PROPUESTA] });

    await store.getState().confirmPendingActivity('msg-1');

    expect(store.getState().messages[0].isConfirmed).toBeFalsy();
  });
});
