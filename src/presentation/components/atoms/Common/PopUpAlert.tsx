import { Modal, View, Text, Button, StyleSheet } from 'react-native';
import { Theme } from '../../theme/colors';

interface props {
  text: string,
  isVisible: boolean
  onClose: () => void
}

export default function PopUpAlert({ text, isVisible, onClose }: props) {
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

const styles = StyleSheet.create({
  backgroundOpacity: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    color: Theme.colors.textSecondary,
    textAlign: 'center',
  }
})