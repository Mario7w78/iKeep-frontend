import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NLConversationStep } from '../organisms/CreateActivity/NLConversationStep';
import { ChatMessage } from '../molecules/CreateActivity/MessageBubble';
import { SAPO_BASE64 } from '../sapoBase64';

import { LayoutAnimation } from 'react-native';

// Mock LayoutAnimation as it is not fully supported in test environments
if (LayoutAnimation) {
  LayoutAnimation.configureNext = jest.fn();
  (LayoutAnimation as any).Presets = {
    easeInEaseOut: 'easeInEaseOut',
    easeIn: 'easeIn',
    easeOut: 'easeOut',
    keyboard: 'keyboard',
    linear: 'linear',
    spring: 'spring',
  };
}

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock TypingIndicator to prevent any infinite loop issues with Animated loops in Jest
jest.mock('../atoms/CreateActivity/TypingIndicator', () => ({
  TypingIndicator: () => null,
}));

// Mock useSafeAreaInsets
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: (props: any) => {
    const { View } = require('react-native');
    const { children, style, ...rest } = props;
    return <View style={style} {...rest}>{children}</View>;
  },
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('NLConversationStep', () => {
  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      role: 'user',
      content: 'Hola sapo',
      timestamp: 1000,
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Hola! ¿En qué te puedo ayudar hoy?',
      timestamp: 2000,
    },
  ];

  const defaultProps = {
    messages: mockMessages,
    onSend: jest.fn(),
    isThinking: false,
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header title, back button, and conversation messages correctly', async () => {
    const screen = await render(<NLConversationStep {...defaultProps} />);

    expect(screen.getByText('Hablar con Sapo')).toBeTruthy();
    expect(screen.getByText('← Volver')).toBeTruthy();
    expect(screen.getByText('Hola sapo')).toBeTruthy();
    expect(screen.getByText('Hola! ¿En qué te puedo ayudar hoy?')).toBeTruthy();
  });

  it('calls onBack when the back button is pressed', async () => {
    const screen = await render(<NLConversationStep {...defaultProps} />);
    const backButton = screen.getByText('← Volver');
    fireEvent.press(backButton);
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  it('handles typing text and sending messages correctly', async () => {
    const screen = await render(<NLConversationStep {...defaultProps} />);
    const input = screen.getByTestId('chat-input');
    const sendButton = screen.getByTestId('send-button');

    // Button should be disabled initially when input is empty
    expect(sendButton.props.accessibilityState?.disabled).toBe(true);

    // Change text
    fireEvent.changeText(input, '  Quiero agendar fútbol el lunes a las 9pm  ');
    
    // Button should be enabled now
    await waitFor(() => {
      expect(sendButton.props.accessibilityState?.disabled).toBeFalsy();
    });

    // Press send
    fireEvent.press(sendButton);

    // onSend should be called with trimmed text
    await waitFor(() => {
      expect(defaultProps.onSend).toHaveBeenCalledWith('Quiero agendar fútbol el lunes a las 9pm');
    });
    
    // Input should be cleared
    await waitFor(() => {
      expect(input.props.value).toBe('');
    });
  });

  it('renders the Sapo avatar for assistant messages', async () => {
    const screen = await render(<NLConversationStep {...defaultProps} />);
    
    // Find assistant avatar by testID
    const avatarImages = screen.queryAllByTestId('sapo-avatar');
    expect(avatarImages.length).toBe(1);
    expect(avatarImages[0].props.source.uri).toBe(SAPO_BASE64);
  });

  it('handles disabled state and prevents inputs/sending when thinking', async () => {
    const screen = await render(
      <NLConversationStep {...defaultProps} isThinking={true} />
    );
    
    const input = screen.getByTestId('chat-input');
    const sendButton = screen.getByTestId('send-button');

    // Input should not be editable
    expect(input.props.editable).toBe(false);
    
    // Send button should be disabled
    expect(sendButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('displays typing indicator when thinking and hides it with delay when thinking stops', async () => {
    // 1. Initial render with isThinking = true
    const screen = await render(
      <NLConversationStep {...defaultProps} isThinking={true} />
    );

    // Sapo avatar for typing indicator should be present
    expect(screen.queryByTestId('sapo-avatar-typing')).toBeTruthy();

    // 2. Change isThinking to false
    await screen.rerender(
      <NLConversationStep {...defaultProps} isThinking={false} />
    );

    // Immediately after rerender, it should still be present due to the 800ms minimum display rule
    expect(screen.queryByTestId('sapo-avatar-typing')).toBeTruthy();

    // 3. Wait for it to disappear (timers will advance in the background)
    await waitFor(() => {
      expect(screen.queryByTestId('sapo-avatar-typing')).toBeNull();
    }, { timeout: 1500 });
  });

  it('renders the trash button when onClear is provided and calls callback on press', async () => {
    const onClearMock = jest.fn();
    const screen = await render(
      <NLConversationStep {...defaultProps} onClear={onClearMock} />
    );

    const clearButton = screen.getByTestId('clear-chat-button');
    expect(clearButton).toBeTruthy();

    fireEvent.press(clearButton);
    expect(onClearMock).toHaveBeenCalledTimes(1);
  });

  it('does not render the trash button when onClear is not provided', async () => {
    const screen = await render(<NLConversationStep {...defaultProps} />);
    const clearButton = screen.queryByTestId('clear-chat-button');
    expect(clearButton).toBeNull();
  });
});
