import React, { useState } from 'react';
import { View, Text, ScrollView, FlatList } from 'react-native';
import { timeType } from '../../../../domain/entities/activity.types';
import { PrimaryButton } from '../../../components/atoms/Common/PrimaryButton';
import { InputHeader } from '../../../components/molecules/Header/InputHeader';
import { FrecuencySelector } from '../../../components/organisms/Time/FrecuencySelector';
import { HourSection } from '../../../components/organisms/Time/HourSection';
import { TimeSection } from '../../../components/organisms/Time/TimeSection';
import PopUpAlert from '../../../components/atoms/Common/PopUpAlert';
import { styles } from '../activityStyles'

import { DayOfWeek } from '../../../../domain/entities/Activity';
import { calculateEndTime } from '../../../utils/timeUtils';
import { useActivityStore } from '../../../../infrastructure/store/useActivityStore';

export default function CreateActivityView({ navigation }: any) {
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
  const [shouldPopUpAlert, setShouldPopUpAlert] = useState(false)

  const options: DayOfWeek[] = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
  const allOptions: DayOfWeek[] = ['Diario', ...options];

  const handleSelect = (val: DayOfWeek) => {
    if (val === 'Diario') {
      setSelectedDays(prev =>
        prev.length === options.length ? [] : options
      );
      return;
    }
    setSelectedDays(prev => {
      const withoutDiario = prev.filter(v => v !== 'Diario');
      return withoutDiario.includes(val)
        ? withoutDiario.filter(v => v !== val)
        : [...withoutDiario, val];
    });
  };

  const { handleCreateActivity } = useActivityStore();

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

  const updateTime = (hourString: string, minuteString: string, period: string) => {
    const newDate = new Date(startTime);
    let hours = parseInt(hourString, 10);

    if (period === 'AM') {
      if (hours === 12) hours = 0;
    } else {
      if (hours !== 12) hours += 12;
    }

    newDate.setHours(hours);
    newDate.setMinutes(parseInt(minuteString, 10));
    setStartTime(newDate);
  };

  const handleEmptyFields = (days: DayOfWeek[]) => {
    const missingName = !activityName.trim();
    const missingDays = days.length === 0;
    const invalidDuration = durationTimeValue <= 0;

    if (missingName || missingDays || invalidDuration) {
      setShouldPopUpAlert(true);
      return true;
    }
    return false;
  };

  const handleSaveActivity = async () => {

    const isEmpty = handleEmptyFields(selectedDays);

    if (isEmpty) {
      setShouldPopUpAlert(true)
    }
    else {
      await handleCreateActivity({
        activityName,
        isFixed,
        startTime,
        endTime,
        durationTime: durationTimeValue,
        travelTime: travelTimeValue,
        days: selectedDays,
      });
      navigation.goBack();
    }
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
          
          <View style={styles.frecuencySection}>
            <Text style={styles.labelSmall}>Frecuencia</Text>
            <FrecuencySelector
              days={allOptions}
              selectedValue={selectedDays.length === options.length
                ? [...selectedDays, 'Diario']
                : selectedDays}
              onSelect={handleSelect}
            />

            <View>
              <View>
                {selectedDays.map((item, index) => (
                  <View key={index}>
                    <Text>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

          </View>

          <HourSection
            isFixed={isFixed}
            onResponderRelease={() => {
              setScrollEnabled(true);
            }}
            onStartResponderCapture={() => {
              setScrollEnabled(false);
              return false;
            }}
            setIsFixed={setIsFixed}
            updateTime={updateTime}
          />

          <TimeSection
            durationTimeValue={durationTimeValue}
            travelTimeValue={travelTimeValue}
            selectedTimeTypeDuration={selectedTimeTypeDuration}
            selectedTimeTypeTravel={selectedTimeTypeTravel}
            setSelectedTypeDuration={setSelectedTypeDuration}
            setSelectedTimeTypeTravel={setSelectedTimeTypeTravel}
            onAddDuration={() => handleAddGeneric(setDurationTime, selectedTimeTypeDuration)}
            onAddTravel={() => handleAddGeneric(setTravelTime, selectedTimeTypeTravel)}
            onSubstractDuration={() => handleSubGeneric(setDurationTime, selectedTimeTypeDuration)}
            onSubstractTravel={() => handleSubGeneric(setTravelTime, selectedTimeTypeTravel)}
          />

        </ScrollView>
      </View>

      <View style={styles.footer}>
        <PrimaryButton title="Continuar" onPress={handleSaveActivity} />
      </View>

      <PopUpAlert text={'Complete los campos faltantes'}
        isVisible={shouldPopUpAlert}
        onClose={() => setShouldPopUpAlert(false)}
      />
    </View>
  );
}

