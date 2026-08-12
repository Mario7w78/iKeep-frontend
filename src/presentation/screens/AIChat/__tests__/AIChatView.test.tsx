import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AIChatView from '../AIChatView';
import { createChatStore } from '../../../../infrastructure/store/useChatStore';
import { useChatStore } from '../../../../di/Dependencies';

// Mock required modules
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: (props: any) => {
    const { View } = require('react-native');
    const { children, style, ...rest } = props;
    return <View style={style} {...rest}>{children}</View>;
  },
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));


jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('useChatStore', () => {
  let mockActivityStore: any;
  let mockScheduleStore: any;
  let mockConversar: any;
  let handleCreateActivityMock: any;
  let handleGenerateScheduleMock: any;

  beforeEach(() => {
    handleCreateActivityMock = jest.fn().mockResolvedValue(undefined);
    handleGenerateScheduleMock = jest.fn().mockResolvedValue(undefined);

    mockActivityStore = {
      getState: () => ({
        handleCreateActivity: handleCreateActivityMock,
      }),
    };
    mockScheduleStore = {
      getState: () => ({
        schedule: {
          getItemsByDay: jest.fn().mockReturnValue([]),
        },
        perDayStartHours: null,
        startHour: 0,
        handleGenerateSchedule: handleGenerateScheduleMock,
      }),
    };
    mockConversar = jest.fn();
  });

  it('initializes with greeting message and not thinking', () => {
    const store = createChatStore(mockActivityStore, mockScheduleStore, mockConversar);
    const state = store.getState();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe('assistant');
    expect(state.messages[0].id).toBe('sapo-greeting');
    expect(state.isThinking).toBe(false);
    expect(state.createdActivityId).toBeNull();
  });

  it('sendMessage appends user message instantly, clears input, and sets isThinking to true', async () => {
    const store = createChatStore(mockActivityStore, mockScheduleStore, mockConversar);
    mockConversar.mockResolvedValue({
      tipo: 'pregunta',
      mensaje: '¿De qué color es la actividad?',
      borrador: {},
      turnos: [],
      propuesta: null,
    });

    const sendPromise = store.getState().sendMessage('Quiero estudiar inglés');

    // user message is appended after greeting (index 1)
    expect(store.getState().isThinking).toBe(true);
    expect(store.getState().messages.length).toBe(2);
    expect(store.getState().messages[1].content).toBe('Quiero estudiar inglés');
    expect(store.getState().messages[1].role).toBe('user');

    await sendPromise;

    expect(store.getState().isThinking).toBe(false);
    expect(store.getState().messages.length).toBe(3);
    expect(store.getState().messages[2].content).toBe('¿De qué color es la actividad?');
    expect(store.getState().messages[2].role).toBe('assistant');

    expect(mockConversar).toHaveBeenCalled();
  });

  it('handles result response, queues activity, and calls saves on confirm', async () => {
    const store = createChatStore(mockActivityStore, mockScheduleStore, mockConversar);
    const borrador = {
      name: 'Estudiar Inglés',
      activity_type: 'tarea',
      is_fixed: false,
      is_anchor: false,
      difficulty: 'media',
      priority: 'media',
      schedule: [{ day: 'Sabado', start_time: 480, end_time: 600 }],
      duracion_minutos: 120,
    };
    mockConversar.mockResolvedValue({
      tipo: 'propuesta',
      mensaje: '¿La creo?',
      borrador,
      turnos: [],
      propuesta: { tipo: 'crear', borrador, activity_id: null },
    });

    await store.getState().sendMessage('Quiero estudiar inglés el sábado de 8 a 10 am');

    // It should not save immediately
    expect(handleCreateActivityMock).not.toHaveBeenCalled();
    expect(handleGenerateScheduleMock).not.toHaveBeenCalled();

    // It should have created a confirmation message with pendingActivity
    const messages = store.getState().messages;
    const confirmMsg = messages[messages.length - 1];
    expect(confirmMsg.pendingActivity).toBeTruthy();
    expect(confirmMsg.pendingActivity.parsedState.activityName).toBe('Estudiar Inglés');

    // Now confirm the pending activity
    await store.getState().confirmPendingActivity(confirmMsg.id);

    // Mocks should now be called
    expect(handleCreateActivityMock).toHaveBeenCalled();
    expect(handleGenerateScheduleMock).toHaveBeenCalled();
    expect(store.getState().createdActivityId).toBeTruthy();
    expect(store.getState().messages.some((m) => m.isCreated)).toBe(true);
  });

  it('handles API failure correctly and retries', async () => {
    const store = createChatStore(mockActivityStore, mockScheduleStore, mockConversar);
    mockConversar.mockRejectedValueOnce(new Error('Network error'));

    await store.getState().sendMessage('Quiero estudiar inglés');

    expect(store.getState().isThinking).toBe(false);
    expect(store.getState().messages.some((m) => m.isError)).toBe(true);

    // Y al reintentar, que funcione.
    mockConversar.mockResolvedValue({
      tipo: 'pregunta',
      mensaje: '¿Qué día?',
      borrador: {},
      turnos: [],
      propuesta: null,
    });

    await act(async () => {
      store.getState().retry();
    });

    expect(store.getState().isThinking).toBe(false);
    expect(store.getState().messages.some((m) => m.isError)).toBe(false);
    expect(store.getState().messages.some((m) => m.content === '¿Qué día?')).toBe(true);
  });

  it('clearChat resets to greeting', () => {
    const store = createChatStore(mockActivityStore, mockScheduleStore, mockConversar);

    // Set some state
    store.setState({
      messages: [{ id: '1', role: 'user', content: 'test', timestamp: 0 }],
      isThinking: true,
      inputText: 'hello',
      createdActivityId: '123',
    });

    store.getState().clearChat();

    const state = store.getState();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].id).toBe('sapo-greeting');
    expect(state.isThinking).toBe(false);
    expect(state.inputText).toBe('');
    expect(state.createdActivityId).toBeNull();
  });
});

describe('AIChatView Component', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useChatStore.getState().clearChat();
  });

  it('renders conversational screen correctly', async () => {
    const screen = await render(<AIChatView navigation={mockNavigation} />);
    expect(screen.getByTestId('ai-chat-view-container')).toBeTruthy();
    expect(screen.getByText('Hablar con Sapo')).toBeTruthy();
  });
});
