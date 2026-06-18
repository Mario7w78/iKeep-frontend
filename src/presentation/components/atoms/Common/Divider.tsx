import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/colors';

interface Props {
  style?: StyleProp<ViewStyle>;
  color?: string;
  thickness?: number;
  orientation?: 'horizontal' | 'vertical';
}

export const Divider = ({ 
  style, 
  color: colorProp,
  thickness = 1, 
  orientation = 'horizontal' 
}: Props) => {
  const { colors } = useTheme();
  const color = colorProp ?? colors.cardBorder ?? '#E0E0E0';

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