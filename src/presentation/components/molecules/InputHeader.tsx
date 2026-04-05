import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../theme/colors'; 
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text
}
  from 'react-native';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
}

export const InputHeader = ({ value, onChangeText, onClose }: Props) => (
  <SafeAreaView style={styles.header}>
    
    <View style={styles.headerTopRow}>
      <Text style={styles.headerText}>Nueva Actividad</Text>
      <TouchableOpacity onPress={onClose} style={styles.headerCloseButton}>
        <Ionicons name="close" size={32} color="#6200EE" />
      </TouchableOpacity>
    </View>

    <View style={styles.headerContent}>
      <TextInput
        style={styles.nameInput}
        value={value}
        onChangeText={onChangeText}
        placeholder="¿Comó se llama la actividad?"
        placeholderTextColor="#D1B3FF"
      />
    </View>

  </SafeAreaView>
);

export const styles = StyleSheet.create({
  header: { 
    backgroundColor: Theme.colors.primary, 
    paddingHorizontal: 20, 
    paddingBottom: 20 
  },
  headerTopRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 20
  },
  headerCloseButton: { 
    backgroundColor: '#FFF', 
    borderRadius: 15, 
    padding: 4, 
  },
  headerText: {
    color: Theme.colors.surface,
    fontWeight: 'bold',
    fontSize: 24,
  },
  headerContent: { 
    flexDirection: 'column', 
    backgroundColor: Theme.colors.background,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10, 
    marginTop: 10,
    
  },
  nameInput: { 
    fontSize: 16, 
    color: Theme.colors.text, 
    fontWeight: '600', 
    paddingVertical: 8 
  },
});