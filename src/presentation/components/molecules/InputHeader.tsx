import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
}

export const InputHeader = ({ value, onChangeText, onClose }: Props) => (
  <SafeAreaView style={styles.header}>
    <View style={styles.headerTopRow}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={24} color="#6200EE" />
      </TouchableOpacity>
    </View>

    <View style={styles.headerContent}>
      <View style={styles.iconCircle}>
        <Ionicons name="water" size={32} color="#FFF" />
      </View>
      <TextInput
        style={styles.nameInput}
        value={value}
        onChangeText={onChangeText}
        placeholder="Nombre de la actividad"
        placeholderTextColor="#D1B3FF"
      />
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  header: { backgroundColor: '#6200EE', paddingHorizontal: 20, paddingBottom: 40 },
  headerTopRow: { flexDirection: 'row', marginTop: 10 },
  closeButton: { backgroundColor: '#FFF', borderRadius: 20, padding: 4, alignSelf: 'flex-start' },
  headerContent: { flexDirection: 'row', alignItems: 'center', marginTop: 40 },
  iconCircle: { 
    width: 60, height: 60, borderRadius: 30, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', alignItems: 'center', marginRight: 16 
  },
  nameInput: { 
    flex: 1, fontSize: 24, color: '#FFF', fontWeight: 'bold', 
    borderBottomWidth: 1, borderBottomColor: '#FFF', paddingVertical: 8 
  },
});