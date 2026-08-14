import React, { useRef, useEffect, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable, PanResponder, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScheduledActivity } from '../../../../domain/entities/Schedule';
import { useTheme } from '../../theme/colors';
import type { ThemeColors } from '../../theme/colors';

interface ActivityDetailModalProps {
  visible: boolean;
  activityItem: ScheduledActivity | null;
  onClose: () => void;
  onEdit?: (activityId: string) => void;
  /**
   * Empezar una sesión enfocada. Opcional porque no toda pantalla que abre
   * este detalle está en condiciones de sostener una sesión.
   */
  onEnfocar?: (activityId: string, minutos: number) => void;
}

export function ActivityDetailModal({ visible, activityItem, onClose, onEdit, onEnfocar }: ActivityDetailModalProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors, comfyColors, comfyFontColors]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10 && Math.abs(gestureState.dx) < gestureState.dy;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: 600,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
            translateY.setValue(0);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible]);

  if (!activityItem) return null;

  const { activity, assignedStartTime, assignedEndTime, day } = activityItem;
  if (!activity) return null;

  const getIdentityIcon = (identity: string) => {
    switch (identity) {
      case 'clase': return 'school-outline';
      case 'trabajo': return 'briefcase-outline';
      default: return 'document-text-outline';
    }
  };

  const getIdentityColor = (identity: string) => {
    switch (identity) {
      case 'clase': return comfyColors.skyBlue;
      case 'trabajo': return comfyColors.orange;
      default: return comfyColors.green;
    }
  };

  const getIdentityLabel = (identity: string) => {
    switch (identity) {
      case 'clase': return 'Clase';
      case 'trabajo': return 'Trabajo';
      default: return 'Tarea';
    }
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 5) return 'Alta';
    if (priority >= 3) return 'Media';
    return 'Baja';
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'baja': return 'Baja';
      case 'media': return 'Normal';
      case 'alta': return 'Alta';
      default: return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'baja': return comfyColors.green;
      case 'media': return comfyColors.yellow;
      case 'alta': return '#FF6B6B';
      default: return colors.surface;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return '#FF6B6B';
    if (priority >= 3) return comfyColors.skyBlue;
    return comfyColors.green;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View 
          style={[styles.sheet, { transform: [{ translateY }] }]} 
          pointerEvents="auto"
          {...panResponder.panHandlers}
        >
          <View style={styles.indicator} />
          
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconContainer, { backgroundColor: getIdentityColor(activity.identity) + '20' }]}>
                <Ionicons name={getIdentityIcon(activity.identity)} size={24} color={getIdentityColor(activity.identity)} />
              </View>
              <View style={styles.titleWrapper}>
                <Text style={styles.title} numberOfLines={2}>{activity.title}</Text>
                <Text style={styles.subtitle}>{getIdentityLabel(activity.identity)}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.surface} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HORARIO ASIGNADO</Text>
            <View style={styles.timeCard}>
              <Ionicons name="time-outline" size={26} color={comfyColors.skyBlue} />
              <View>
                <Text style={styles.timeText}>{assignedStartTime} – {assignedEndTime}</Text>
                <Text style={styles.dayText}>{day}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DETALLES</Text>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Tipo</Text>
                <View style={styles.badge}>
                  <Ionicons 
                    name={activity.isFixed() ? 'lock-closed-outline' : 'flash-outline'} 
                    size={16} 
                    color={colors.surface} 
                  />
                  <Text style={styles.badgeText}>
                    {activity.isFixed() ? 'Fijo' : 'Flexible'}
                  </Text>
                </View>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Prioridad</Text>
                <View style={styles.badge}>
                  <Ionicons name="flag" size={16} color={getPriorityColor(activity.priority)} />
                  <Text style={styles.badgeText}>
                    {getPriorityLabel(activity.priority)}
                  </Text>
                </View>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Dificultad</Text>
                <View style={styles.badge}>
                  <Ionicons name="speedometer-outline" size={16} color={getDifficultyColor(activity.difficulty)} />
                  <Text style={styles.badgeText}>
                    {getDifficultyLabel(activity.difficulty)}
                  </Text>
                </View>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Fecha Límite</Text>
                <View style={styles.badge}>
                  <Ionicons name="calendar-outline" size={16} color={colors.iconPrimary} />
                  <Text style={styles.badgeText}>
                    {activity.deadline 
                      ? new Date(activity.deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                      : 'Sin límite'
                    }
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {onEnfocar && (
            <TouchableOpacity
              testID="empezar-sesion"
              style={styles.editButton}
              activeOpacity={0.8}
              onPress={() => {
                // La duración sale del bloque: la sesión acompaña lo que ya
                // estaba planeado en vez de pedirle al usuario que elija un
                // número más.
                onEnfocar(activity.id, duracionDelBloque(activityItem));
                onClose();
              }}
            >
              <Ionicons name="timer-outline" size={20} color={colors.surface} />
              <Text style={styles.editButtonText}>Empezar sesión</Text>
            </TouchableOpacity>
          )}
          {onEdit && (
            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.8}
              onPress={() => { onEdit(activity.id); onClose(); }}
            >
              <Ionicons name="create-outline" size={20} color={colors.surface} />
              <Text style={styles.editButtonText}>Editar actividad</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8} onPress={onClose}>
            <Text style={styles.actionButtonText}>Entendido</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors, comfyColors: Record<string, string>, comfyFontColors: Record<string, string>) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayBackground,
  },
  sheet: {
    backgroundColor: colors.screenBackground,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 20,
  },
  indicator: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.cardBorder,
    alignSelf: 'center',
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.surface,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.screenBackground,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.iconPrimary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.cardBackground,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  timeText: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  dayText: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 6,
  },
  gridLabel: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '800',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.screenBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  editButton: {
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '900',
  },
  actionButton: {
    backgroundColor: comfyColors.green,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  actionButtonText: {
    color: comfyFontColors.green,
    fontSize: 16,
    fontWeight: '900',
  },
});

/**
 * Cuánto dura el bloque, en minutos.
 *
 * Sale del horario y no de un selector: pedirle al usuario que elija una
 * duración cuando la app ya sabe cuánto planeó es una decisión de más.
 */
function duracionDelBloque(item: any): number {
  const aMinutos = (hhmm: string) => {
    const [h, m] = String(hhmm ?? '').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const minutos = aMinutos(item?.assignedEndTime) - aMinutos(item?.assignedStartTime);
  // Un bloque que cruza la medianoche da negativo; 25 minutos es un punto de
  // partida razonable y el usuario puede terminar antes cuando quiera.
  return minutos > 0 ? minutos : 25;
}
