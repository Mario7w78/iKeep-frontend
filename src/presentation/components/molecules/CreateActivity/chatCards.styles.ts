import { StyleSheet } from 'react-native';

import { ThemeColors } from '../../theme/colors';

/**
 * Los estilos de la burbuja del chat y de sus tarjetas.
 *
 * Viven aparte porque los comparten cuatro componentes: la burbuja, los
 * botones de propuesta, la tarjeta de accion simple y la de actividad.
 * Duplicarlos dejaria que la tarjeta de eliminar y la de crear se separaran
 * visualmente sin que nadie lo decidiera.
 */
export const createStyles = (colors: ThemeColors) => StyleSheet.create({
  adjustButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  adjustText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  simpleActionBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  simpleActionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.surface,
  },
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
  avatarSapo: {
    marginRight: 8,
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
    borderColor: colors.error,
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
    // Crece con el texto en vez de ser un cuadrado fijo: las etiquetas pasaron
    // de una letra a tres, y "L M M J V S D" obligaba a resolver cual de las
    // dos M era martes.
    flex: 1,
    minWidth: 34,
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
    fontSize: 10,
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
    backgroundColor: colors.error,
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
    color: colors.error,
    fontWeight: 'bold',
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: colors.error,
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

