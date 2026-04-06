import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Theme } from '../theme/colors';

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
  primaryButton: { backgroundColor: Theme.colors.primary, paddingVertical: 16, borderRadius: 30, alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});