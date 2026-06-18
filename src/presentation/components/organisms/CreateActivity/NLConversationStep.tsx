import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageBubble, ChatMessage } from '../../molecules/CreateActivity/MessageBubble';
import { TypingIndicator } from '../../atoms/CreateActivity/TypingIndicator';
import { Theme } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SAPO_BASE64 } from '../../sapoBase64';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  isThinking: boolean;
  onBack: () => void;
  onRetry?: () => void;
  onViewActivity?: () => void;
  onClear?: () => void;
}

export const NLConversationStep: React.FC<Props> = ({
  messages,
  onSend,
  isThinking,
  onBack,
  onRetry,
  onViewActivity,
  onClear,
}) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const [showTyping, setShowTyping] = useState(false);
  const insets = useSafeAreaInsets();
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Minimum 800ms typing display
  useEffect(() => {
    if (isThinking) {
      setShowTyping(true);
    } else {
      // Delay hiding typing indicator to ensure minimum 800ms display
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setShowTyping(false);
      }, 800);
    }
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [isThinking]);

  // Auto-scroll to bottom on new messages or typing state
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length, showTyping]);

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || isThinking) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onSend(trimmed);
    setInputText('');
  }, [inputText, isThinking, onSend]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hablar con la IA</Text>
        {onClear ? (
          <TouchableOpacity onPress={onClear} style={styles.clearButton} testID="clear-chat-button">
            <Ionicons name="trash-outline" size={24} color={Theme.colors.surface} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, index) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isLatest={index === messages.length - 1}
            onRetry={onRetry}
            onViewActivity={onViewActivity}
          />
        ))}
        {showTyping && (
          <View style={styles.typingRow}>
            <View style={styles.avatarContainer}>
              <Image
                testID="sapo-avatar-typing"
                source={{ uri: SAPO_BASE64 }}
                style={styles.typingAvatar}
              />
            </View>
            <View style={styles.typingBubble}>
              <TypingIndicator />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TextInput
          testID="chat-input"
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Escribe más detalles..."
          placeholderTextColor="rgba(255,255,255,0.35)"
          multiline
          maxLength={500}
          editable={!isThinking}
          autoCorrect={false}
        />
        <TouchableOpacity
          testID="send-button"
          style={[styles.sendButton, (!inputText.trim() || isThinking) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isThinking}
        >
          <Text style={styles.sendText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.screenBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backText: {
    color: Theme.colors.iconPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  headerTitle: {
    flex: 1,
    color: Theme.colors.surface,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  clearButton: {
    width: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  typingBubble: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  typingAvatar: {
    width: 28,
    height: 30,
    resizeMode: 'contain',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: Theme.colors.screenBackground,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Theme.colors.surface,
    fontSize: 15,
    fontWeight: '600',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5665dc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(86, 101, 220, 0.4)',
  },
  sendText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
});
