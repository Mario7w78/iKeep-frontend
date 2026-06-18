import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme/colors';

interface Props {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const PrimaryButton = ({ title, onPress, style, textStyle }: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity 
      style={[styles.primaryButton, style]} 
      onPress={onPress}
    >
      <Text style={[styles.primaryButtonText, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const createStyles = (colors) => StyleSheet.create({
  primaryButton: { 
    backgroundColor: colors.cardBackground, 
    paddingVertical: 16, 
    borderRadius: 15, 
    width: '55%',
    alignItems: 'center' 
  },
  primaryButtonText: { 
    color: colors.surface, 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
});