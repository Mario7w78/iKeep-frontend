import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TimePicker from './TimePicker';
import { formatTime } from '../../../../presentation/utils/timeUtils';
import { Theme } from '../../theme/colors';

interface Props {
  onTimeChange: (hourString: string, minuteString: string, period: string, id?: string) => void; 
}

export const TimePickerSection = ({ onTimeChange }: Props) => (
  <View style={styles.timePickerSection}>
    <View style={styles.centeredPicker}>
      <TimePicker onTimeChange={onTimeChange} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  timePickerSection: {
    alignItems: 'center',
    borderRadius: Theme.generalBorder,
    zIndex: 10, 
    elevation: 5,
  },
  centeredPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
});