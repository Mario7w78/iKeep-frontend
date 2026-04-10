import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { timeType } from '../../../../domain/entities/activity.types';
import { PrimaryButton } from '../../../components/atoms/Common/PrimaryButton';
import { SwitchRow } from '../../../components/atoms/Common/SwitchRow';
import { InputHeader } from '../../../components/molecules/Header/InputHeader';
import { TimePickerSection } from '../../../components/organisms/Time/TimePickerSection';
import { FrecuencySelector } from '../../../components/organisms/Time/FrecuencySelector';
import { NumericStepper } from '../../../components/molecules/Time/NumericStepper';
import PopUpAlert from '../../../components/atoms/Common/PopUpAlert';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { styles } from '../activityStyles'
import { Divider } from '../../../components/atoms/Common/Divider';

import { DayOfWeek } from '../../../../domain/entities/Activity';
import useActivity from '../../../hooks/useActivity';
import { calculateEndTime } from '../../../../domain/timeUtils';
import { Theme } from '../../../components/theme/colors';


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

  const {
    handleCreateActivity
  } = useActivity();

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

    // Convertir 12h → 24h
    if (period === 'AM') {
      if (hours === 12) hours = 0;       // 12 AM → 0
    } else {
      if (hours !== 12) hours += 12;     // 1–11 PM → 13–23, 12 PM → 12
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
          <View style={styles.timeSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.icon2Container}>
                  <AntDesign name="clock-circle" size={20} color='white' />
                </View>
                <View style={{ flexDirection: 'column' }}>
                  <Text style={styles.label} >Hora fija</Text>
                  <Text style={styles.descriptionLabel} >El algoritmo respetará esta hora</Text>
                </View>
              </View>
              <SwitchRow
                label="Hora fija"
                value={isFixed}
                onValueChange={setIsFixed}
              />
            </View>

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
          </View>

          <View style={styles.timeSection}>
            <Text style={styles.labelSmall}>Tiempo</Text>
            <View style={styles.timeInnerSection}>
              <View style={styles.section}>
                <View style={styles.inputSection}>
                  <View style={styles.iconContainer}>
                    <AntDesign name="clock-circle" size={12} color='white' />
                  </View>
                  <Text style={styles.subLabelSmall}>Duración</Text>
                </View>

                <NumericStepper
                  value={durationTimeValue}
                  selectedTimeType={selectedTimeTypeDuration}
                  onSelectType={setSelectedTypeDuration}
                  onAdd={() => handleAddGeneric(setDurationTime, selectedTimeTypeDuration)}
                  onSubstract={() => handleSubGeneric(setDurationTime, selectedTimeTypeDuration)}
                />

              </View>
              <Divider orientation='vertical' color={Theme.colors.surface} />
              <View style={styles.section}>
                <View style={styles.inputSection}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="location-outline" size={16} color='white' />
                  </View>
                  <Text style={styles.subLabelSmall}>Traslado</Text>
                </View>

                <NumericStepper
                  value={travelTimeValue}
                  selectedTimeType={selectedTimeTypeTravel}
                  onSelectType={setSelectedTimeTypeTravel}
                  onAdd={() => handleAddGeneric(setTravelTime, selectedTimeTypeTravel)}
                  onSubstract={() => handleSubGeneric(setTravelTime, selectedTimeTypeTravel)}
                />
              </View>
            </View>
          </View>

          <View style={styles.frecuencySection}>
            <Text style={styles.labelSmall}>Frecuencia</Text>
            <FrecuencySelector
              days={allOptions}
              selectedValue={selectedDays.length === options.length
                ? [...selectedDays, 'Diario']
                : selectedDays}
              onSelect={handleSelect}
            />
          </View>

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

