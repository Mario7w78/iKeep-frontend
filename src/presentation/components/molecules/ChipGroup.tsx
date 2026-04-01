import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  options: string[];
  selectedValue: string;
  onSelect: (val: string) => void;
}

export const ChipGroup = ({ options, selectedValue, onSelect }: Props) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
    {options.map((option) => (
      <TouchableOpacity
        key={option}
        style={[styles.chip, selectedValue === option && styles.chipSelected]}
        onPress={() => onSelect(option)}
      >
        <Text style={[styles.chipText, selectedValue === option && styles.chipTextSelected]}>
          {option}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  chipContainer: { flexDirection: 'row' },
  chip: { backgroundColor: '#EAEAEA', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
  chipSelected: { backgroundColor: '#6200EE' },
  chipText: { color: '#666', fontWeight: 'bold' },
  chipTextSelected: { color: '#FFF' },
});