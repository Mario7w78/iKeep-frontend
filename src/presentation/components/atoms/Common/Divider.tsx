import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { Theme } from '../../theme/colors';

interface Props {
  style?: StyleProp<ViewStyle>;
  color?: string;
  thickness?: number;
  orientation?: 'horizontal' | 'vertical';
}

export const Divider = ({ 
  style, 
  color = Theme.colors.primary || '#E0E0E0',
  thickness = 1, 
  orientation = 'horizontal' 
}: Props) => {
  return (
    <View
      style={[
        orientation === 'horizontal' 
          ? { height: thickness, width: '100%' } 
          : { width: thickness, height: '100%' },
        { backgroundColor: color },
        style
      ]}
    />
  );
};