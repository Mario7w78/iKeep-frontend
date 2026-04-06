import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';

import { timeType } from '../../../../domain/entities/activity.types';

import { PrimaryButton } from '../../../components/atoms/PrimaryButton';
import { SwitchRow } from '../../../components/molecules/SwitchRow';
import { InputHeader } from '../../../components/molecules/InputHeader';
import { TimePickerSection } from '../../../components/organisms/TimePickerSection';
import FrecuenceDropdown from '../../../components/organisms/FrecuenceDropdown';
import { NumericStepper } from '../../../components/molecules/NumericStepper';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  calculateEndTime,
  formatString
}
  from '../../../../domain/timeUtils';

import { CreateActivityUseCase } from '../../../../application/useCase/CreateActivityUseCase';
import { styles } from '../../Activity/activityStyles'
import { DayOfWeek } from '../../../../domain/entities/Activity';

export default function CreateActivityScreen({ navigation }: any) {
  const [activityName, setActivityName] = useState('');
  const [isFixed, setIsFixed] = useState(true);

  const [selectedTimeTypeDuration, setSelectedTypeDuration] = useState<timeType>(timeType.both);
  const [selectedTimeTypeTravel, setSelectedTimeTypeTravel] = useState<timeType>(timeType.both)

  const [durationTimeValue, setDurationTime] = useState(10)
  const [travelTimeValue, setTravelTime] = useState(0);
  const [startTime, setStartTime] = useState(new Date());
  const endTime = calculateEndTime(startTime, durationTimeValue);


  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);

  const [scrollEnabled, setScrollEnabled] = useState(true);

  const handleAddGeneric = (
    setFn: React.Dispatch<React.SetStateAction<number>>,
    type: timeType
  ) => {
    const amount = type === timeType.hour ? 60 : 10;
    setFn(prev => prev + amount);
  };

  const handleSubGeneric = (
    setFn: React.Dispatch<React.SetStateAction<number>>,
    type: timeType
  ) => {
    const amount = type === timeType.hour ? 60 : 10;
    setFn(prev => (prev >= amount ? prev - amount : 0));
  };

  const updateTime = (hourString: string, minuteString: string) => {
    const newDate = new Date(startTime);
    newDate.setHours(parseInt(hourString, 10));
    newDate.setMinutes(parseInt(minuteString, 10));
    setStartTime(newDate);
  };

  const handleSaveActivity = async () => {

    await CreateActivityUseCase({
      activityName,
      isFixed,
      startTime,
      endTime,
      durationTime: durationTimeValue,
      travelTime: travelTimeValue,
      days: selectedDays,
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>

      <InputHeader
        value={activityName}
        onChangeText={setActivityName}
        onClose={() => navigation.goBack()}
      />

      <View style={styles.formContainerBackground}>
        <ScrollView
          style={styles.scrollForm}
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled={true}
        >

          <SwitchRow
            label="Actividad con hora fija"
            value={isFixed}
            onValueChange={setIsFixed}
          />

          {isFixed && (
            <View
              onStartShouldSetResponderCapture={() => {
                setScrollEnabled(false);
                return false;
              }}
              onResponderRelease={() => {
                setScrollEnabled(true);
              }}
            >
              <TimePickerSection
                startTime={startTime}
                endTime={endTime}
                onTimeChange={updateTime}
              />
            </View>
          )}

          {!isFixed && (
            <View>
              <Text style={styles.messages}>
                (El algoritmo le asignará un intervalo de tiempo óptimo)
              </Text>
            </View>
          )}

          <View style={styles.section}>

            <View style={styles.inputSection}>
              <View style={styles.iconContainer}>
                <AntDesign name="clock-circle" size={16} color='white' />
              </View>
              <Text style={styles.labelSmall}>Duración</Text>
            </View>

            <NumericStepper
              value={durationTimeValue}
              selectedTimeType={selectedTimeTypeDuration}
              onSelectType={setSelectedTypeDuration}
              onAdd={() => handleAddGeneric(setDurationTime, selectedTimeTypeDuration)}
              onSubstract={() => handleSubGeneric(setDurationTime, selectedTimeTypeDuration)}
            />

          </View>

          <View style={styles.section}>

            <View style={styles.inputSection}>
              <View style={styles.iconContainer}>
                <Ionicons name="location-outline" size={20} color='white' />
              </View>
              <Text style={styles.labelSmall}>Tiempo de traslado</Text>
            </View>

            <NumericStepper
              value={travelTimeValue}
              selectedTimeType={selectedTimeTypeTravel}
              onSelectType={setSelectedTimeTypeTravel}
              onAdd={() => handleAddGeneric(setTravelTime, selectedTimeTypeTravel)}
              onSubstract={() => handleSubGeneric(setTravelTime, selectedTimeTypeTravel)}
            />

          </View>

          <View>
            <Text>Frecuencia de la actividad</Text>
            <FrecuenceDropdown
              seleccionados={selectedDays}
              onSelectionChange={setSelectedDays} />
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <PrimaryButton title="Continuar" onPress={handleSaveActivity} />
      </View>
    </View>
  );
}

