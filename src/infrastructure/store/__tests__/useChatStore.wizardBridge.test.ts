/**
 * El ciclo del puente, cerrado.
 *
 * Ajustar en el wizard y guardar dejaba la tarjeta del chat pendiente y con
 * los valores viejos: confirmarla ahi creaba una segunda actividad identica a
 * la que el formulario acababa de guardar.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

import { createChatStore } from '../useChatStore';

function crearStore() {
  const activityStore = {
    getState: () => ({
      activities: [],
      handleCreateActivity: jest.fn().mockResolvedValue(undefined),
      handleDeleteActivity: jest.fn().mockResolvedValue(undefined),
    }),
  };
  const scheduleStore = {
    getState: () => ({
      schedule: { getItemsByDay: jest.fn().mockReturnValue([]) },
      perDayStartHours: null,
      startHour: 0,
      handleGenerateSchedule: jest.fn().mockResolvedValue(undefined),
    }),
  };
  return createChatStore(activityStore as any, scheduleStore as any, jest.fn(), jest.fn());
}

const PROPUESTA = {
  id: 'msg-1',
  role: 'assistant' as const,
  content: 'La creo?',
  timestamp: Date.now(),
  type: 'result' as const,
  pendingActivity: {
    id: 'act-1',
    isModification: false,
    originalName: null,
    parsedState: {
      activityName: 'Calculo',
      identity: 'clase',
      isFixed: true,
      isAnchor: false,
      selectedDays: [],
      daysDict: {},
      difficulty: 'media',
      priority: 'media',
      duracionMinutos: 90,
    },
  },
};

const AJUSTES = {
  activityName: 'Calculo II',
  selectedDays: ['Martes'],
  daysDict: { Martes: { partitions: [] } },
};

describe('resolverPropuestaDesdeWizard', () => {
  it('marca la propuesta como confirmada: si no, se podia crear dos veces', () => {
    const store = crearStore();
    store.setState({ messages: [PROPUESTA] as any });

    store.getState().resolverPropuestaDesdeWizard('msg-1', AJUSTES);

    expect(store.getState().messages[0].isConfirmed).toBe(true);
  });

  it('la tarjeta pasa a mostrar lo que el usuario dejo en el wizard', () => {
    const store = crearStore();
    store.setState({ messages: [PROPUESTA] as any });

    store.getState().resolverPropuestaDesdeWizard('msg-1', AJUSTES);

    const parsed = (store.getState().messages[0] as any).pendingActivity.parsedState;
    expect(parsed.activityName).toBe('Calculo II');
    expect(parsed.selectedDays).toEqual(['Martes']);
  });

  it('conserva lo que el wizard no conoce', () => {
    /**
     * `duracionMinutos` lo dedujo el asistente de la conversacion. El
     * formulario no tiene ese campo, asi que pisarlo seria inventarlo.
     */
    const store = crearStore();
    store.setState({ messages: [PROPUESTA] as any });

    store.getState().resolverPropuestaDesdeWizard('msg-1', AJUSTES);

    const parsed = (store.getState().messages[0] as any).pendingActivity.parsedState;
    expect(parsed.duracionMinutos).toBe(90);
    expect(parsed.identity).toBe('clase');
  });

  it('avisa en el chat de que se guardo', () => {
    const store = crearStore();
    store.setState({ messages: [PROPUESTA] as any });

    store.getState().resolverPropuestaDesdeWizard('msg-1', AJUSTES);

    const mensajes = store.getState().messages;
    expect(mensajes).toHaveLength(2);
    expect(mensajes[1].content).toContain('ajustes');
  });

  it('una propuesta ya confirmada no vuelve a avisar', () => {
    const store = crearStore();
    store.setState({ messages: [{ ...PROPUESTA, isConfirmed: true }] as any });

    store.getState().resolverPropuestaDesdeWizard('msg-1', AJUSTES);

    expect(store.getState().messages).toHaveLength(1);
  });

  it('un mensaje que ya no existe no rompe nada', () => {
    /** El borrador dura 24h; el chat se puede limpiar antes. */
    const store = crearStore();
    store.setState({ messages: [PROPUESTA] as any });

    store.getState().resolverPropuestaDesdeWizard('msg-fantasma', AJUSTES);

    expect(store.getState().messages).toHaveLength(1);
    expect(store.getState().messages[0].isConfirmed).toBeUndefined();
  });
});
