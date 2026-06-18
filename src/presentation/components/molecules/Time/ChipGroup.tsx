import React, { useMemo } from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/colors';

interface Props {
  options: string[];
  selectedValue: string[];
  uniqueValue: string,
  onSelect: (val: any) => void;
}

export const ChipGroup = ({ options, selectedValue, onSelect, uniqueValue }: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
    {options.map((option) => (
      <TouchableOpacity
        key={option}
        disabled={selectedValue.includes(uniqueValue) && option !== uniqueValue}
        style=
        {[
          styles.chip,
          selectedValue.includes(option) && styles.chipSelected,
          selectedValue.includes(uniqueValue) && option !== uniqueValue && styles.chipDisabled
        ]}
        onPress={() => onSelect(option)}
      >
        <Text style={[styles.chipText, selectedValue.includes(option) && styles.chipTextSelected]}>
          {option}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);
};

const createStyles = (colors) => StyleSheet.create({
  chipContainer: { flexDirection: 'row' },
  chip: {
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 20,
    marginRight: 10,
    borderColor: colors.surface
  },
  chipSelected: { backgroundColor: colors.cardBackground },
  chipText: {
    color: colors.surface,
    fontWeight: 'bold'
  },
  chipDisabled: { opacity: 0.4 },
  chipTextSelected: { color: colors.surface },
});