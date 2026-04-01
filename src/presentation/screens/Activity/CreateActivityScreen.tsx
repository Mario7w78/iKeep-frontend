import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Importamos nuestros componentes atómicos
import { PrimaryButton } from '../../components/atoms/PrimaryButton';
import { ChipGroup } from '../../components/molecules/ChipGroup';
import { SwitchRow } from '../../components/molecules/SwitchRow';
import { InputHeader } from '../../components/molecules/InputHeader';
import { TimePickerSection } from '../../components/organisms/TimePickerSection';
import FrecuenceDropdown, { Frecuencia } from '../../components/organisms/FrecuenceDropdown';
// Dominio y Casos de uso
import { calculateEndTime } from '../../../domain/timeUtils';
import { executeCreateActivity } from '../../../application/createActivityUseCase';

const TIME_OPTIONS = ['5m', '10m', '15m', '30m', '1hr', '2hr'];

export default function CreateActivityScreen({ navigation }: any) {
  const [activityName, setActivityName] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('30m');
  const [isFixed, setIsFixed] = useState(true);
  const [startTime, setStartTime] = useState(new Date());
  const [selectedCommute, setSelectedCommute] = useState('0m');
  const [selectedDays, setSelectedDays] = useState<Frecuencia[]>([]);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const endTime = calculateEndTime(startTime, selectedDuration);

  const updateTime = (hourString: string, minuteString: string) => {
    const newDate = new Date(startTime);
    newDate.setHours(parseInt(hourString, 10));
    newDate.setMinutes(parseInt(minuteString, 10));
    setStartTime(newDate);
  };

  const handleSaveActivity = async () => {
    await executeCreateActivity({
      activityName,
      selectedDuration,
      isFixed,
      startTime,
      selectedCommute,
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

          <View style={styles.section}>
            <Text style={styles.labelSmall}>Duración de la actividad</Text>
            <ChipGroup
              options={TIME_OPTIONS}
              selectedValue={selectedDuration}
              onSelect={setSelectedDuration}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.labelSmall}>Tiempo de traslado</Text>
            <ChipGroup
              options={TIME_OPTIONS}
              selectedValue={selectedCommute}
              onSelect={setSelectedCommute}
            />
          </View>

          <View>
            <Text>Frecuencia de la actividad</Text>
            <FrecuenceDropdown
              seleccionados={selectedDays}
              onSelectionChange={setSelectedDays} />
          </View>

          <SwitchRow
            label="Intervalo fijo: "
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

        </ScrollView>
      </View>

      <View style={styles.footer}>
        <PrimaryButton title="Continuar" onPress={handleSaveActivity} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#6200EE' },
  formContainerBackground: { flex: 1, backgroundColor: '#FFF' },
  scrollForm: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 20 },
  section: { marginBottom: 24 },
  labelSmall: { fontSize: 14, color: '#666', marginBottom: 12, fontWeight: '500' },
  footer: { paddingHorizontal: 24, paddingBottom: 30, paddingTop: 10, backgroundColor: '#F8F9FA' },
});