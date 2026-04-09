import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TimePicker from './TimePicker';
import { formatTime } from '../../../../domain/timeUtils';
import { Theme } from '../../theme/colors';

interface Props {
  startTime: Date;
  endTime: Date;
  onTimeChange: (hourString: string, minuteString: string, period: string) => void; 
}


export const TimePickerSection = ({ startTime, endTime, onTimeChange }: Props) => (
  <View style={styles.timePickerSection}>
    <View style={styles.centeredPicker}>
      <TimePicker onTimeChange={onTimeChange} />
      {/* <View style={styles.timeDisplayBox}>
        <Text style={styles.timeDisplayText}>
          {formatTime(startTime)}
        </Text>
        <Text style={styles.endTimeSubtext}>
          Finaliza aprox: {formatTime(endTime)}
        </Text>
      </View> */}
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
  // timeDisplayBox: {
  //   alignItems: 'center',
  // },
  // timeDisplayText: {
  //   fontSize: 28,
  //   fontWeight: 'bold',
  //   color: Theme.colors.veryLightPrimary,
  // },
  // endTimeSubtext: {
  //   fontSize: 12,
  //   fontWeight: 'bold',
  //   color: Theme.colors.surface,
  //   marginTop: 4,
  // },
});