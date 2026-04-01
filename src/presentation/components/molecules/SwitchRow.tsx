import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

interface Props {
  label: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
}

export const SwitchRow = ({ label, value, onValueChange }: Props) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#E0E0E0', true: '#6200EE' }}
      thumbColor={'#FFFFFF'}
    />
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  label: { fontSize: 18, fontWeight: 'bold', color: '#333' },
});