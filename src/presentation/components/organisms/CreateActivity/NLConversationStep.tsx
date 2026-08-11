import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageBubble, ChatMessage } from '../../molecules/CreateActivity/MessageBubble';
import { TypingIndicator } from '../../atoms/CreateActivity/TypingIndicator';
import { useTheme, ThemeColors } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sapo } from '../../atoms/Mascot/Sapo';

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
  onConfirmPending?: (messageId: string) => Promise<void>;
  onCancelPending?: (messageId: string) => void;
  onAdjustInWizard?: (messageId: string) => void;
}

export const NLConversationStep: React.FC<Props> = ({
  messages,
  onSend,
  isThinking,
  onBack,
  onRetry,
  onViewActivity,
  onClear,
  onConfirmPending,
  onCancelPending,
  onAdjustInWizard,
}) => {
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);
  const [inputText, setInputText] = useState('');

  /**
   * Solo mientras la conversacion no arranco y el campo esta vacio. Despues
   * estorban: el usuario ya sabe que puede escribir, y ocupan el lugar donde
   * mira las respuestas.
   */
  const mostrarSugerencias =
    !inputText.trim() && !isThinking && messages.filter((m) => m.role === 'user').length === 0;
  const scrollRef = useRef<ScrollView>(null);
  const [showTyping, setShowTyping] = useState(false);
  const insets = useSafeAreaInsets();
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  /**
   * La ref del contenedor, que ademas se mide.
   *
   * Va sobre un KeyboardAvoidingView, cuyos tipos no declaran `measure` aunque
   * en tiempo de ejecucion lo tenga: por debajo es una vista nativa. El codigo
   * de abajo ya comprueba que exista antes de llamarla, asi que se declara lo
   * que realmente hay en vez de forzar el tipo del elemento entero.
   */
  const containerRef = useRef<
    (KeyboardAvoidingView & Partial<Pick<View, 'measure'>>) | null
  >(null);
  const [verticalOffset, setVerticalOffset] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const inputTextRef = useRef('');

  const handleLayout = useCallback(() => {
    if (verticalOffset > 0) return;
    if (containerRef.current && typeof containerRef.current.measure === 'function') {
      containerRef.current.measure((_x, _y, _width, _height, _pageX, pageY) => {
        if (pageY !== undefined && pageY > 0) {
          setVerticalOffset(pageY);
        }
      });
    }
  }, [verticalOffset]);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsKeyboardVisible(true);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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

  // Sync ref on every change so handleSend never reads stale inputText
  const handleInputChange = useCallback((text: string) => {
    setInputText(text);
    inputTextRef.current = text;
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = inputTextRef.current.trim();
    if (!trimmed || isThinking) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onSend(trimmed);
    setInputText('');
    inputTextRef.current = '';
    // Native clear as fallback — bypasses any React stale-state race
    inputRef.current?.clear();
  }, [isThinking, onSend]);

  return (
    <KeyboardAvoidingView
      ref={containerRef}
      onLayout={handleLayout}
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? verticalOffset : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.iconPrimary} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hablar con Sapo</Text>
        {onClear ? (
          <TouchableOpacity onPress={onClear} style={styles.clearButton} testID="clear-chat-button">
            <Ionicons name="trash-outline" size={24} color={colors.surface} />
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
            onConfirmPending={onConfirmPending}
            onCancelPending={onCancelPending}
            onAdjustInWizard={onAdjustInWizard}
          />
        ))}
        {showTyping && (
          <View style={styles.typingRow}>
            <View style={styles.avatarContainer}>
              {/* El sapo espera junto al indicador. Cuando exista la
                  animacion de 'thinking' se ve sola: hoy cae a reposo, que
                  sigue leyendose como que esta ahi esperando. */}
              <Sapo
                testID="sapo-avatar-typing"
                estado="thinking"
                tamano={32}
              />
            </View>
            <View style={styles.typingBubble}>
              <TypingIndicator />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sugerencias
          El asistente sabe consultar la agenda, eliminar y reorganizar, pero
          nada en la pantalla lo dice: sin esto el usuario asume que solo
          crea, que es lo unico que hacia antes. Se ocultan apenas escribe o
          apenas empieza la conversacion, para no competir con lo que esta
          haciendo. */}
      {/* Antes del primer mensaje hay pantalla de sobra y nada que
          competir: es donde la mascota puede verse grande. Al arrancar la
          conversacion desaparece para dejarle el lugar a las respuestas. */}
      {mostrarSugerencias && (
        <View style={styles.mascotaGrande}>
          <Sapo estado="idle" tamano={140} />
        </View>
      )}

      {mostrarSugerencias && (
        <View style={styles.sugerencias} testID="chat-suggestions">
          {SUGERENCIAS.map((s: string) => (
            <TouchableOpacity
              key={s}
              style={styles.chipSugerencia}
              onPress={() => onSend(s)}
              disabled={isThinking}
            >
              <Text style={styles.textoSugerencia}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: isKeyboardVisible ? 10 : Math.max(insets.bottom, 10) }]}>
        <TextInput
          ref={inputRef}
          testID="chat-input"
          style={styles.textInput}
          value={inputText}
          onChangeText={handleInputChange}
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
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

/**
 * Ejemplos de lo que el asistente sabe hacer ademas de crear. Son tres a
 * proposito: mas se leen como un menu y menos no alcanzan para sugerir que
 * hay variedad.
 */
const SUGERENCIAS = [
  '¿Qué tengo mañana?',
  'Tengo 2 horas libres',
  'Reorganiza mi semana',
];

function createStyles(colors: ThemeColors, _comfyColors: Record<string, string>, _comfyFontColors: Record<string, string>) {
  return StyleSheet.create({
    mascotaGrande: {
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: 4,
    },
    sugerencias: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    chipSugerencia: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.cardBackground,
    },
    textoSugerencia: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    container: {
      flex: 1,
      backgroundColor: colors.screenBackground,
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
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingRight: 12,
      gap: 4,
    },
    backText: {
      color: colors.iconPrimary,
      fontSize: 16,
      fontWeight: '800',
    },
    headerTitle: {
      flex: 1,
      color: colors.surface,
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
      backgroundColor: colors.screenBackground,
      gap: 8,
    },
    textInput: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      color: colors.surface,
      fontSize: 15,
      fontWeight: '600',
      maxHeight: 100,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.secondaryAccent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: `${colors.secondaryAccent}66`,
    },
    sendText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '900',
    },
  });
}
