import React, { useMemo } from 'react';
import { Modal, View, Text, Button, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/colors';

interface props {
  text: string,
  isVisible: boolean
  onClose: () => void
}

export default function PopUpAlert({ text, isVisible, onClose }: props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View>
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => onClose()}
      >
        <View style={styles.backgroundOpacity}>
          <View style={styles.container}>
            <Text style={styles.alertText}>{text}</Text>
            <Button title="Cerrar" onPress={() => onClose()} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  backgroundOpacity: {
    flex: 1,
    backgroundColor: colors.overlayBackground,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    width: '70%'
  },
  alertText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textSecondary,
    textAlign: 'center',
  }
})