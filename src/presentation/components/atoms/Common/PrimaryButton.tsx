import React from 'react';
import { TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../theme/colors';

interface Props {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const PrimaryButton = ({ title, onPress, style, textStyle }: Props) => (
  <TouchableOpacity 
    style={[styles.primaryButton, style]} 
    onPress={onPress}
  >
    <Text style={[styles.primaryButtonText, textStyle]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  primaryButton: { 
    backgroundColor: Theme.colors.primary, 
    paddingVertical: 16, 
    borderRadius: 30, 
    alignItems: 'center' 
  },
  primaryButtonText: { 
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
});