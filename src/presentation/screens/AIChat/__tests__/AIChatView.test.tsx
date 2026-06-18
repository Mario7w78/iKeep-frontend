import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AIChatView from '../AIChatView';
import { createChatStore } from '../../../../infrastructure/store/useChatStore';
import { useChatStore } from '../../../../di/Dependencies';
import { sendConversation } from '../../../../infrastructure/api/ParseNLApiService';

// Mock required modules
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('../../../../infrastructure/api/ParseNLApiService', () => ({
  sendConversation: jest.fn(),
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
  let mockSendConversation: any;
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
    mockSendConversation = jest.fn();
  });

  it('initializes with empty messages and not thinking', () => {
    const store = createChatStore(mockActivityStore, mockScheduleStore, mockSendConversation);
    const state = store.getState();
    expect(state.messages).toEqual([]);
    expect(state.isThinking).toBe(false);
    expect(state.createdActivityId).toBeNull();
  });

  it('sendMessage appends user message instantly, clears input, and sets isThinking to true', async () => {
    const store = createChatStore(mockActivityStore, mockScheduleStore, mockSendConversation);
    mockSendConversation.mockResolvedValue({
      type: 'question',
      ai_message: '¿De qué color es la actividad?',
    });

    const sendPromise = store.getState().sendMessage('Quiero estudiar inglés');

    // Check intermediate state
    expect(store.getState().isThinking).toBe(true);
    expect(store.getState().messages.length).toBe(1);
    expect(store.getState().messages[0].content).toBe('Quiero estudiar inglés');
    expect(store.getState().messages[0].role).toBe('user');

    await sendPromise;

    expect(store.getState().isThinking).toBe(false);
    expect(store.getState().messages.length).toBe(2);
    expect(store.getState().messages[1].content).toBe('¿De qué color es la actividad?');
    expect(store.getState().messages[1].role).toBe('assistant');
  });

  it('handles result response and calls store saves and schedule regeneration', async () => {
    const store = createChatStore(mockActivityStore, mockScheduleStore, mockSendConversation);
    mockSendConversation.mockResolvedValue({
      type: 'result',
      name: 'Estudiar Inglés',
      activity_type: 'tarea',
      is_fixed: false,
      is_anchor: false,
      difficulty: 'media',
      priority: 'media',
      schedule: [
        {
          day: 'Sabado',
          start_time: 480,
          end_time: 600,
        },
      ],
      duracion_minutos: 120,
      confidence: 1.0,
      missing_fields: [],
    });

    await store.getState().sendMessage('Quiero estudiar inglés el sábado de 8 a 10 am');

    expect(handleCreateActivityMock).toHaveBeenCalled();
    expect(handleGenerateScheduleMock).toHaveBeenCalled();
    expect(store.getState().createdActivityId).toBeTruthy();
    expect(store.getState().messages.some((m) => m.isCreated)).toBe(true);
  });

  it('handles API failure correctly and retries', async () => {
    const store = createChatStore(mockActivityStore, mockScheduleStore, mockSendConversation);
    mockSendConversation.mockRejectedValueOnce(new Error('Network error'));

    await store.getState().sendMessage('Quiero estudiar inglés');

    expect(store.getState().isThinking).toBe(false);
    expect(store.getState().messages.some((m) => m.isError)).toBe(true);

    // Mock success for retry
    mockSendConversation.mockResolvedValue({
      type: 'question',
      ai_message: '¿Qué día?',
    });

    await act(async () => {
      store.getState().retry();
    });

    expect(store.getState().isThinking).toBe(false);
    expect(store.getState().messages.some((m) => m.isError)).toBe(false);
    expect(store.getState().messages.some((m) => m.content === '¿Qué día?')).toBe(true);
  });

  it('clearChat resets the state', () => {
    const store = createChatStore(mockActivityStore, mockScheduleStore, mockSendConversation);

    // Set some state
    store.setState({
      messages: [{ id: '1', role: 'user', content: 'test', timestamp: 0 }],
      isThinking: true,
      inputText: 'hello',
      createdActivityId: '123',
    });

    store.getState().clearChat();

    const state = store.getState();
    expect(state.messages).toEqual([]);
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
    expect(screen.getByText('Hablar con la IA')).toBeTruthy();
  });
});
