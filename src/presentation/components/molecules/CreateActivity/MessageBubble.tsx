import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sapo } from '../../atoms/Mascot/Sapo';
import { useTheme } from '../../theme/colors';
import { OverlapConflictData } from '../../../../domain/errors/OverlapError';
import { ActivityProposalCard } from './ActivityProposalCard';
import { ConflictPreview } from './ConflictPreview';
import { createStyles } from './chatCards.styles';
import { SimpleActionCard } from './SimpleActionCard';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isError?: boolean;
  isCreated?: boolean;
  pendingActivity?: any;
  isConfirmed?: boolean;
  isCancelled?: boolean;
  type?: 'question' | 'result' | 'chat';
  overlapData?: OverlapConflictData[];
}

interface Props {
  message: ChatMessage;
  isLatest: boolean;
  onRetry?: () => void;
  onViewActivity?: () => void;
  onConfirmPending?: (messageId: string) => Promise<void>;
  onCancelPending?: (messageId: string) => void;
  onAdjustInWizard?: (messageId: string) => void;
}

/**
 * Un mensaje del chat.
 *
 * Solo la burbuja y lo que la rodea. Las tarjetas viven aparte: este archivo
 * llego a 823 lineas siendo cuatro cosas a la vez, y agregar un tipo mas de
 * propuesta significaba hacerlo crecer otra vez.
 */
export const MessageBubble: React.FC<Props> = ({
  message,
  isLatest: _isLatest,
  onRetry,
  onViewActivity,
  onConfirmPending,
  onCancelPending,
  onAdjustInWizard,
}) => {
  const isUser = message.role === 'user';
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Eliminar y regenerar no construyen una actividad: no traen parsedState,
  // asi que la tarjeta de detalles no aplica y accederle reventaria.
  const accionSimple: 'eliminar' | 'regenerar' | null =
    message.pendingActivity?.kind === 'eliminar' ||
    message.pendingActivity?.kind === 'regenerar'
      ? message.pendingActivity.kind
      : null;

  const hayPropuesta = message.type !== 'chat' && !!message.pendingActivity;

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAI]}>
      {!isUser && (
        <Sapo testID="sapo-avatar" estado="idle" size={40} style={styles.avatarSapo} />
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : (message.isError ? styles.bubbleError : styles.bubbleAI),
          message.pendingActivity ? styles.bubbleWithPending : null,
        ]}
      >
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAI]}>
          {message.content}
        </Text>
        {hayPropuesta && accionSimple && (
          <SimpleActionCard
            mensaje={message}
            propuesta={message.pendingActivity}
            accion={accionSimple}
            onConfirmPending={onConfirmPending}
            onCancelPending={onCancelPending}
          />
        )}

        {hayPropuesta && !accionSimple && (
          <ActivityProposalCard
            mensaje={message}
            propuesta={message.pendingActivity}
            onConfirmPending={onConfirmPending}
            onCancelPending={onCancelPending}
            onAdjustInWizard={onAdjustInWizard}
          />
        )}


        {message.isError && message.overlapData && message.overlapData.length > 0 && (
          <ConflictPreview conflicts={message.overlapData} />
        )}
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
