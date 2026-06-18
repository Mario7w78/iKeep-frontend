import React, { forwardRef, useImperativeHandle, useState, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useTheme } from '../../theme/colors';

export interface BottomSheetModal {
  present: () => void;
  dismiss: () => void;
}

export const ActivityDetailSheet = forwardRef<BottomSheetModal>((_, ref) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [visible, setVisible] = useState(false);

  useImperativeHandle(ref, () => ({
    present: () => setVisible(true),
    dismiss: () => setVisible(false),
  }));

  return (
    <Modal transparent visible={visible} animationType="slide">
      <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
      <View style={styles.sheet}>
        <Text style={styles.title}>Detalles de la Actividad</Text>
        <Text style={styles.text}>Aquí puedes poner los controles de edición.</Text>
      </View>
    </Modal>
  );
});

const createStyles = (colors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlayBackground },
  sheet: { backgroundColor: colors.surface, padding: 24, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  text: { fontSize: 16, color: colors.textSecondary },
});