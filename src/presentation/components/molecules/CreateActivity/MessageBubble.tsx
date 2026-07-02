import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SAPO_BASE64 } from '../../sapoBase64';
import { useTheme, ThemeColors } from '../../theme/colors';
import { OverlapConflictData } from '../../../../domain/errors/OverlapError';
import { ConflictPreview } from './ConflictPreview';

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

const formatDuration = (mins: number) => {
  if (mins > 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (m === 0) {
      return `${h} ${h === 1 ? 'hora' : 'horas'}`;
    }
    return `${h} ${h === 1 ? 'hora' : 'horas'} y ${m} min`;
  }
  return `${mins} min`;
};

const abbreviateDay = (day: string) => {
  const d = day.trim().toLowerCase();
  if (d.startsWith('lun')) return 'Lu';
  if (d.startsWith('mar')) return 'Ma';
  if (d.startsWith('mié') || d.startsWith('mie')) return 'Mi';
  if (d.startsWith('jue')) return 'Ju';
  if (d.startsWith('vie')) return 'Vi';
  if (d.startsWith('sáb') || d.startsWith('sab')) return 'Sá';
  if (d.startsWith('dom')) return 'Do';
  return day;
};

const WEEK_DAYS = [
  { name: 'Lunes', letter: 'L' },
  { name: 'Martes', letter: 'M' },
  { name: 'Miércoles', letter: 'M' },
  { name: 'Jueves', letter: 'J' },
  { name: 'Viernes', letter: 'V' },
  { name: 'Sábado', letter: 'S' },
  { name: 'Domingo', letter: 'D' },
];

const normalizeStr = (str: string) => {
  try {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  } catch {
    return str.toLowerCase().trim();
  }
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

  const travelTimes = useMemo(() => {
    let travelTo: number | null = null;
    let travelFrom: number | null = null;
    const parsedState = message.pendingActivity?.parsedState;
    if (parsedState?.selectedDays && parsedState.daysDict) {
      for (const day of parsedState.selectedDays) {
        const config = parsedState.daysDict[day];
        if (config?.partitions) {
          for (const p of config.partitions) {
            if (p.travelTo !== undefined && p.travelTo !== null) {
              travelTo = p.travelTo;
            }
            if (p.travelFrom !== undefined && p.travelFrom !== null) {
              travelFrom = p.travelFrom;
            }
            if (travelTo !== null || travelFrom !== null) {
              break;
            }
          }
        }
        if (travelTo !== null || travelFrom !== null) {
          break;
        }
      }
    }
    return { travelTo, travelFrom };
  }, [message.pendingActivity]);

  const travelText = useMemo(() => {
    const { travelTo, travelFrom } = travelTimes;
    const parts: string[] = [];
    if (travelTo && travelTo > 0) {
      parts.push(`${travelTo} min ida`);
    }
    if (travelFrom && travelFrom > 0) {
      parts.push(`${travelFrom} min vuelta`);
    }
    if (parts.length === 0) return null;
    return parts.join(' / ');
  }, [travelTimes]);

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
          message.pendingActivity ? styles.bubbleWithPending : null,
        ]}
      >
        <Text style={[styles.text, isUser ? styles.textUser : styles.textAI]}>
          {message.content}
        </Text>

        {message.type !== 'chat' && message.pendingActivity && (
          <View style={styles.card}>
            {/* Header / Mode Indicator */}
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {message.pendingActivity.isModification ? 'Modificar Actividad' : 'Nueva Actividad'}
              </Text>
            </View>

            {/* Context / Modification Target */}
            {message.pendingActivity.isModification && (
              <View style={styles.modificationContext}>
                <Text style={styles.contextLabel}>Actividad a editar</Text>
                <Text style={styles.contextValue}>{message.pendingActivity.originalName}</Text>
              </View>
            )}

            {/* Activity Name */}
            <View style={styles.nameContainer}>
              <Text style={styles.infoLabel}>Nombre propuesto</Text>
              <Text style={styles.cardActivityName} numberOfLines={2}>
                {message.pendingActivity.parsedState.activityName}
              </Text>
            </View>

            {/* Chips Container */}
            <View style={styles.chipsContainer}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  {(() => {
                    const identity = message.pendingActivity.parsedState.identity;
                    if (identity === 'clase') return 'Clase';
                    if (identity === 'trabajo') return 'Trabajo';
                    return 'Tarea';
                  })()}
                </Text>
              </View>

              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  {message.pendingActivity.parsedState.isFixed ? 'Horario Fijo' : 'Horario Flexible'}
                </Text>
              </View>

              {!message.pendingActivity.parsedState.isFixed && (
                <View style={styles.chip}>
                  <Text style={styles.chipText}>
                    {(() => {
                      const p = message.pendingActivity.parsedState.priority;
                      if (p === 'alta') return 'Prioridad Alta';
                      if (p === 'baja') return 'Prioridad Baja';
                      return 'Prioridad Media';
                    })()}
                  </Text>
                </View>
              )}
            </View>

            {/* Days mini-blocks row */}
            <View style={styles.daysRowContainer}>
              <Text style={styles.daysRowTitle}>
                {(!message.pendingActivity.parsedState.isFixed && !message.pendingActivity.parsedState.isAnchor)
                  ? 'Días permitidos'
                  : 'Días asignados'}
              </Text>
              <View style={styles.daysRowGrid}>
                {WEEK_DAYS.map((wd) => {
                  const isSelected = message.pendingActivity.parsedState.selectedDays.some((sd: string) => 
                    normalizeStr(sd) === normalizeStr(wd.name)
                  );
                  return (
                    <View 
                      key={wd.name} 
                      style={[
                        styles.miniDayBox, 
                        isSelected ? styles.miniDayBoxSelected : styles.miniDayBoxUnselected
                      ]}
                    >
                      <Text style={[
                        styles.miniDayText, 
                        isSelected ? styles.miniDayTextSelected : styles.miniDayTextUnselected
                      ]}>
                        {wd.letter}
                      </Text>
                    </View>
                  );
                })}
              </View>
              {(!message.pendingActivity.parsedState.isFixed && !message.pendingActivity.parsedState.isAnchor) && (
                <Text style={styles.daysHelpText}>
                  * Se programará un solo día dentro del rango.
                </Text>
              )}
            </View>

            {/* Divider */}
            <View style={styles.cardDivider} />

            {/* Schedule Details Box */}
            <View style={styles.scheduleBox}>
              <Text style={styles.scheduleSectionTitle}>Planificación propuesta</Text>
              {message.pendingActivity.parsedState.isFixed ? (
                <View style={styles.scheduleCompactList}>
                  {message.pendingActivity.parsedState.selectedDays.map((day: string) => {
                    const config = message.pendingActivity.parsedState.daysDict[day];
                    if (!config || !config.partitions || config.partitions.length === 0) return null;
                    return (
                      <View key={day} style={styles.scheduleCompactRow}>
                        <Text style={styles.scheduleCompactDay}>{abbreviateDay(day)}</Text>
                        <Text style={styles.scheduleCompactTime}>
                          {config.partitions.map((p: any) => 
                            `${formatHour(p.startHour)} - ${formatHour(p.endHour)}`
                          ).join(', ')}
                        </Text>
                      </View>
                    );
                  })}
                  {travelText && (
                    <View style={styles.travelTimeRow}>
                      <Ionicons name="car-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.travelTimeText}>
                        Traslado: {travelTimes.travelTo ? `${travelTimes.travelTo} min ida` : ''}
                        {travelTimes.travelTo && travelTimes.travelFrom ? ' • ' : ''}
                        {travelTimes.travelFrom ? `${travelTimes.travelFrom} min vuelta` : ''}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.flexibleScheduleContainer}>
                  {(() => {
                    const start = message.pendingActivity.parsedState.horaPreferidaInicio;
                    const end = message.pendingActivity.parsedState.horaPreferidaFin;
                    const duration = message.pendingActivity.parsedState.duracionMinutos;
                    
                    return (
                      <>
                        {start !== null && end !== null && (
                          <View style={styles.scheduleCompactRow}>
                            <Text style={styles.scheduleCompactDayLabel}>Rango hor. pref.</Text>
                            <Text style={styles.scheduleCompactTime}>
                              {formatMins(start)} a {formatMins(end)}
                            </Text>
                          </View>
                        )}
                        {duration && (
                          <View style={styles.scheduleCompactRow}>
                            <Text style={styles.scheduleCompactDayLabel}>Duración estimada</Text>
                            <Text style={styles.scheduleCompactTime}>
                              {formatDuration(duration)}
                            </Text>
                          </View>
                        )}
                        {travelText && (
                          <View style={styles.travelTimeRow}>
                            <Ionicons name="car-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.travelTimeText}>
                              Traslado: {travelTimes.travelTo ? `${travelTimes.travelTo} min ida` : ''}
                              {travelTimes.travelTo && travelTimes.travelFrom ? ' • ' : ''}
                              {travelTimes.travelFrom ? `${travelTimes.travelFrom} min vuelta` : ''}
                            </Text>
                          </View>
                        )}
                      </>
                    );
                  })()}
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
                  {message.isConfirmed ? '✓ Confirmado' : '✗ Cancelado'}
                </Text>
              </View>
            )}
          </View>
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
  bubbleWithPending: {
    maxWidth: '85%',
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
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.screenBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    paddingBottom: 8,
    marginBottom: 12,
  },
  cardTitle: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modificationContext: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  contextLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  contextValue: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  nameContainer: {
    marginBottom: 10,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardActivityName: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  daysRowContainer: {
    marginBottom: 12,
  },
  daysRowTitle: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  daysRowGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  daysHelpText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  miniDayBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  miniDayBoxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  miniDayBoxUnselected: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.cardBorder,
  },
  miniDayText: {
    fontSize: 11,
    fontWeight: '800',
  },
  miniDayTextSelected: {
    color: colors.accentText,
  },
  miniDayTextUnselected: {
    color: colors.textTertiary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: 12,
  },
  scheduleBox: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 4,
  },
  scheduleSectionTitle: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  scheduleCompactList: {
    gap: 6,
  },
  flexibleScheduleContainer: {
    gap: 6,
  },
  scheduleCompactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleCompactDay: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    width: 40,
  },
  scheduleCompactDayLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
  },
  scheduleCompactTime: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  travelTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'flex-start',
  },
  travelTimeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleDetailText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  confirmButton: {
    backgroundColor: '#34C759',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 8,
  },
  confirmedText: {
    color: '#34C759',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelledText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 14,
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
    backgroundColor: '#34C759',
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

