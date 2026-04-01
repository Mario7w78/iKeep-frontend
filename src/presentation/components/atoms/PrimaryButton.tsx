import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  title: string;
  onPress: () => void;
}

export const PrimaryButton = ({ title, onPress }: Props) => (
  <TouchableOpacity style={styles.primaryButton} onPress={onPress}>
    <Text style={styles.primaryButtonText}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  primaryButton: { backgroundColor: '#6200EE', paddingVertical: 16, borderRadius: 30, alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});