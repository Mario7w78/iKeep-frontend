import React, { useRef, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable, PanResponder, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScheduledActivity } from '../../../../domain/entities/Schedule';
import { Theme } from '../../theme/colors';

interface ActivityDetailModalProps {
  visible: boolean;
  activityItem: ScheduledActivity | null;
  onClose: () => void;
}

export function ActivityDetailModal({ visible, activityItem, onClose }: ActivityDetailModalProps) {
  const translateY = useRef(new Animated.Value(0)).current;

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

  const getIdentityIcon = (identity: string) => {
    switch (identity) {
      case 'clase': return 'school-outline';
      case 'trabajo': return 'briefcase-outline';
      default: return 'document-text-outline';
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
      case 'baja': return Theme.comfyColors.green;
      case 'media': return Theme.comfyColors.yellow;
      case 'alta': return '#FF6B6B';
      default: return Theme.colors.surface;
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return '#FF6B6B';
    if (priority >= 3) return Theme.comfyColors.skyBlue;
    return Theme.comfyColors.green;
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
              <View style={styles.iconContainer}>
                <Ionicons name={getIdentityIcon(activity.identity)} size={24} color={Theme.comfyFontColors.green} />
              </View>
              <View style={styles.titleWrapper}>
                <Text style={styles.title} numberOfLines={2}>{activity.title}</Text>
                <Text style={styles.subtitle}>{getIdentityLabel(activity.identity)}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={Theme.colors.surface} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HORARIO ASIGNADO</Text>
            <View style={styles.timeCard}>
              <Ionicons name="time-outline" size={26} color={Theme.comfyColors.skyBlue} />
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
                    color={Theme.colors.surface} 
                  />
                  <Text style={styles.badgeText}>
                    {activity.isFixed() ? 'Fijo' : 'Optimizable'}
                  </Text>
                </View>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Prioridad</Text>
                <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                  <Ionicons name="flag" size={16} color={getPriorityColor(activity.priority)} />
                  <Text style={[styles.badgeText, { color: Theme.colors.surface }]}>
                    {getPriorityLabel(activity.priority)}
                  </Text>
                </View>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Dificultad</Text>
                <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                  <Ionicons name="speedometer-outline" size={16} color={getDifficultyColor(activity.difficulty)} />
                  <Text style={[styles.badgeText, { color: Theme.colors.surface }]}>
                    {getDifficultyLabel(activity.difficulty)}
                  </Text>
                </View>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>Fecha Límite</Text>
                <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                  <Ionicons name="calendar-outline" size={16} color={Theme.colors.iconPrimary} />
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

          <TouchableOpacity style={styles.actionButton} activeOpacity={0.8} onPress={onClose}>
            <Text style={styles.actionButtonText}>Entendido</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 11, 18, 0.75)',
  },
  sheet: {
    backgroundColor: Theme.colors.screenBackground,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderColor: Theme.colors.cardBorder,
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
    backgroundColor: Theme.colors.cardBorder,
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
    backgroundColor: 'rgba(141, 255, 104, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrapper: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: Theme.colors.surface,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.cardBorder,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: Theme.colors.iconPrimary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Theme.colors.cardBackground,
    borderColor: Theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  timeText: {
    color: Theme.colors.surface,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  dayText: {
    color: Theme.colors.textTertiary,
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
    color: Theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: '800',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: Theme.colors.surface,
    fontSize: 13,
    fontWeight: '800',
  },
  actionButton: {
    backgroundColor: Theme.comfyColors.green,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  actionButtonText: {
    color: Theme.comfyFontColors.green,
    fontSize: 16,
    fontWeight: '900',
  },
});
