import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme/colors';

export interface EnergyOption {
  value: number;
  label: string;
  description: string;
  icon: string;
  iconColor: string;
}

const ENERGY_OPTIONS: EnergyOption[] = [
  { value: 1, label: 'Baja', description: 'Evitar tareas difíciles', icon: 'battery-dead', iconColor: Theme.comfyColors.yellow },
  { value: 2, label: 'Normal', description: 'Rendimiento habitual', icon: 'battery-half', iconColor: Theme.comfyColors.green },
  { value: 3, label: 'Alta', description: 'Puedo con todo', icon: 'flash', iconColor: Theme.comfyColors.skyBlue },
];

interface EnergyPickerProps {
  visible: boolean;
  onSelect: (nivel: number) => void;
  onCancel: () => void;
}

export const EnergyPicker: React.FC<EnergyPickerProps> = ({
  visible,
  onSelect,
  onCancel,
}) => {
  const [shouldRender, setShouldRender] = useState(visible);
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible]);

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const sheetTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [420, 0],
  });

  if (!shouldRender) return null;

  return (
    <Modal
      visible={shouldRender}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
          pointerEvents="auto"
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        </Animated.View>

        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}
        >
          <View style={styles.handle} />

          <Text style={styles.title}>¿Cómo está tu energía hoy?</Text>
          <Text style={styles.subtitle}>
            Esto ayuda a planificar tareas según tu nivel
          </Text>

          <View style={styles.optionsContainer}>
            {ENERGY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.optionCard}
                activeOpacity={0.7}
                onPress={() => onSelect(opt.value)}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons name={opt.icon as any} size={24} color={opt.iconColor} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                  <Text style={styles.optionDesc}>{opt.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 11, 18, 0.62)',
  },
  sheet: {
    backgroundColor: Theme.colors.screenBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: Theme.colors.surface,
    opacity: 0.2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.surface,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: Theme.colors.surface,
  },
  optionDesc: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  cancelBtn: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Theme.colors.cardBackground,
  },
  cancelText: {
    fontSize: 16,
    color: Theme.colors.surface,
    fontWeight: '500',
  },
});
