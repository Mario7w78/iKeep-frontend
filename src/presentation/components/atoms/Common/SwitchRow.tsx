import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/colors';

interface Props {
  label: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
}

export const SwitchRow = ({ label, value, onValueChange }: Props) => {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E0E0E0', true: colors.cardBackground }}
        thumbColor={colors.surface}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
  },
});