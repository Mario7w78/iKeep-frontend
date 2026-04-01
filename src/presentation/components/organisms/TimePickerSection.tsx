import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TimePicker from './TimePicker';
import { formatTime } from '../../../domain/timeUtils';

interface Props {
  startTime: Date;
  endTime: Date;
  onTimeChange: (hourString: string, minuteString: string) => void;
}

export const TimePickerSection = ({ startTime, endTime, onTimeChange }: Props) => (
  <View style={styles.timePickerSection}>
    <View style={styles.centeredPicker}>

      <TimePicker onTimeChange={onTimeChange} />

      <View style={styles.timeDisplayBox}>
        <Text style={styles.timeDisplayText}>
          {formatTime(startTime)}
        </Text>
        <Text style={styles.endTimeSubtext}>
          Finaliza aprox: {formatTime(endTime)}
        </Text>
      </View>

    </View>
  </View>
);

const styles = StyleSheet.create({
  timePickerSection: {
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 20,
    zIndex: 10, 
    elevation: 5,
  },
  centeredPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  timeDisplayBox: {
    alignItems: 'center',
  },
  timeDisplayText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6200EE',
  },
  endTimeSubtext: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7e7e7e',
    marginTop: 4,
  },
});