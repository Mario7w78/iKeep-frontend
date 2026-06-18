import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { SAPO_BASE64 } from '../../sapoBase64';
import { useTheme, ThemeColors } from '../../theme/colors';

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
}

interface Props {
  message: ChatMessage;
  isLatest: boolean;
  onRetry?: () => void;
  onViewActivity?: () => void;
  onConfirmPending?: (messageId: string) => Promise<void>;
  onCancelPending?: (messageId: string) => void;
}

const formatHour = (dateInput: any) => {
  try {
    const d = new Date(dateInput);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  } catch {
    return '00:00';
  }
};

const formatMins = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const MessageBubble: React.FC<Props> = ({
  message,
  isLatest,
  onRetry,
  onViewActivity,
  onConfirmPending,
  onCancelPending,
}) => {
  const isUser = message.role === 'user';
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

        {message.pendingActivity && (
          <View style={styles.card}>
            {/* Header / Mode Indicator */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {message.pendingActivity.isModification
                  ? '🔄 Confirmar Modificación'
                  : '➕ Confirmar Creación'}
              </Text>
            </View>

            {/* Info Fields */}
            <View style={styles.cardBody}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Actividad:</Text>
                <Text style={styles.infoValue}>
                  {message.pendingActivity.parsedState.activityName}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Categoría:</Text>
                <Text style={styles.infoValue}>
                  {(() => {
                    const identity = message.pendingActivity.parsedState.identity;
                    if (identity === 'clase') return 'Clase';
                    if (identity === 'trabajo') return 'Trabajo';
                    return 'Tarea';
                  })()}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tipo de horario:</Text>
                <Text style={styles.infoValue}>
                  {message.pendingActivity.parsedState.isFixed
                    ? 'Fijo (horas y días específicos)'
                    : 'Flexible (organizado automáticamente)'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Días:</Text>
                <Text style={styles.infoValue}>
                  {message.pendingActivity.parsedState.selectedDays.join(', ')}
                </Text>
              </View>

              {/* Show schedule depending on fixed vs flexible */}
              {message.pendingActivity.parsedState.isFixed ? (
                <View style={styles.scheduleBlock}>
                  <Text style={styles.infoLabel}>Horarios configurados:</Text>
                  {message.pendingActivity.parsedState.selectedDays.map((day: string) => {
                    const config = message.pendingActivity.parsedState.daysDict[day];
                    if (!config || !config.partitions || config.partitions.length === 0) return null;
                    return (
                      <Text key={day} style={styles.scheduleDetailText}>
                        • {day}: {config.partitions.map((p: any) => 
                          `${formatHour(p.startHour)} - ${formatHour(p.endHour)}`
                        ).join(', ')}
                      </Text>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.scheduleBlock}>
                  <Text style={styles.infoLabel}>Preferencia de horario:</Text>
                  {(() => {
                    const start = message.pendingActivity.parsedState.horaPreferidaInicio;
                    const end = message.pendingActivity.parsedState.horaPreferidaFin;
                    const duration = message.pendingActivity.parsedState.duracionMinutos;
                    
                    const details: string[] = [];
                    if (start !== null && end !== null) {
                      details.push(`Entre las ${formatMins(start)} y las ${formatMins(end)}`);
                    }
                    if (duration) {
                      details.push(`Duración: ${duration} minutos`);
                    }
                    return (
                      <Text style={styles.scheduleDetailText}>
                        • {details.join(' | ') || 'Cualquier momento del día'}
                      </Text>
                    );
                  })()}
                </View>
              )}

              {/* Priority & Difficulty */}
              {!message.pendingActivity.parsedState.isFixed && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Prioridad:</Text>
                  <Text style={styles.infoValue}>
                    {(() => {
                      const p = message.pendingActivity.parsedState.priority;
                      if (p === 'alta') return 'Alta';
                      if (p === 'baja') return 'Baja';
                      return 'Media';
                    })()}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirmation / Cancellation Actions */}
            {!message.isConfirmed && !message.isCancelled ? (
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  testID="confirm-activity-button"
                  style={[styles.actionButton, styles.confirmButton]}
                  onPress={() => onConfirmPending?.(message.id)}
                >
                  <Text style={styles.actionButtonText}>Confirmar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="cancel-activity-button"
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => onCancelPending?.(message.id)}
                >
                  <Text style={styles.actionButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.statusContainer}>
                <Text style={message.isConfirmed ? styles.confirmedText : styles.cancelledText}>
                  {message.isConfirmed ? '✓ Confirmado y guardado' : '✗ Cancelado'}
                </Text>
              </View>
            )}
          </View>
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderBottomLeftRadius: 4,
  },
  bubbleError: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderColor: '#ff6b6b',
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: colors.secondaryAccent,
    borderBottomRightRadius: 4,
  },
  card: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.screenBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    minWidth: 220,
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    paddingBottom: 6,
    marginBottom: 8,
  },
  cardTitle: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 14,
  },
  cardBody: {
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  infoValue: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  scheduleBlock: {
    marginTop: 4,
  },
  scheduleDetailText: {
    color: colors.surface,
    fontSize: 12,
    marginLeft: 8,
    marginTop: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#2e7d32',
  },
  cancelButton: {
    backgroundColor: '#c62828',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 4,
  },
  confirmedText: {
    color: '#2e7d32',
    fontWeight: 'bold',
    fontSize: 13,
  },
  cancelledText: {
    color: '#c62828',
    fontWeight: 'bold',
    fontSize: 13,
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
    color: colors.surface,
  },
  textUser: {
    color: colors.secondaryAccentText,
  },
  userSpacer: {
    width: 0,
  },
});

