import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Theme } from '../../theme/colors';

export interface EnergyOption {
  value: number;
  label: string;
  emoji: string;
  description: string;
}

const ENERGY_OPTIONS: EnergyOption[] = [
  { value: 1, label: 'Baja', emoji: '😴', description: 'Evitar tareas difíciles' },
  { value: 2, label: 'Normal', emoji: '🙂', description: 'Rendimiento habitual' },
  { value: 3, label: 'Alta', emoji: '⚡', description: 'Puedo con todo' },
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
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
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
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <Text style={styles.optionLabel}>{opt.label}</Text>
                <Text style={styles.optionDesc}>{opt.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Theme.colors.overlayBackground,
  },
  sheet: {
    backgroundColor: Theme.colors.screenBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    backgroundColor: Theme.colors.screenBackground,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: Theme.colors.surface,
    flex: 1,
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
