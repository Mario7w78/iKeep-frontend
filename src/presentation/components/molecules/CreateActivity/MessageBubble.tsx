import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { SAPO_BASE64 } from '../../sapoBase64';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isError?: boolean;
  isCreated?: boolean;
}

interface Props {
  message: ChatMessage;
  isLatest: boolean;
  onRetry?: () => void;
  onViewActivity?: () => void;
}

export const MessageBubble: React.FC<Props> = ({ message, isLatest, onRetry, onViewActivity }) => {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAI]}>
      {!isUser && (
        <View style={styles.avatarContainer}>
          <Image
            testID="sapo-avatar"
            source={{ uri: SAPO_BASE64 }}
            style={styles.avatar}
          />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : (message.isError ? styles.bubbleError : styles.bubbleAI),
        ]}
      >
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAI]}>
          {message.content}
        </Text>
        {message.isError && onRetry && (
          <TouchableOpacity
            testID="retry-button"
            style={styles.retryButton}
            onPress={onRetry}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        )}
        {message.isCreated && onViewActivity && (
          <TouchableOpacity
            testID="view-activity-button"
            style={styles.viewActivityButton}
            onPress={onViewActivity}
          >
            <Text style={styles.viewActivityText}>Ver actividad creada</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* Spacer for user messages to push bubble right */}
      {isUser && <View style={styles.userSpacer} />}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAI: {
    justifyContent: 'flex-start',
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
  avatar: {
    width: 28,
    height: 30,
    resizeMode: 'contain',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleAI: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomLeftRadius: 4,
  },
  bubbleError: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderColor: '#ff6b6b',
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: '#5665dc',
    borderBottomRightRadius: 4,
  },
  retryButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  viewActivityButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  viewActivityText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  textAI: {
    color: '#ffffff',
  },
  textUser: {
    color: '#ffffff',
  },
  userSpacer: {
    width: 0,
  },
});
