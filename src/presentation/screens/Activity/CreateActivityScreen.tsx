import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Switch,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Importamos de las capas internas
import TimePicker from '../../components/TimePicker';
import { calculateEndTime, formatTime } from '../../../domain/timeUtils';
import { executeCreateActivity } from '../../../application/createActivityUseCase';

const TIME_OPTIONS = ['5m', '10m', '15m', '30m', '1hr', '2hr'];

export default function CreateActivityScreen({ navigation }: any) {
  // 1. Estados UI puramente locales
  const [activityName, setActivityName] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('30m');
  const [isFixed, setIsFixed] = useState(true);
  const [startTime, setStartTime] = useState(new Date());
  const [selectedCommute, setSelectedCommute] = useState('0m');
  const [isParentScrollEnabled, setIsParentScrollEnabled] = useState(true);

  // 2. Lógica visual reactiva (Usando el dominio)
  const endTime = calculateEndTime(startTime, selectedDuration);

  const updateTime = (hourString: string, minuteString: string) => {
    const newDate = new Date(startTime);
    newDate.setHours(parseInt(hourString, 10));
    newDate.setMinutes(parseInt(minuteString, 10));
    setStartTime(newDate);
  };

  // 3. Orquestación del botón Guardar
  const handleSaveActivity = async () => {
    await executeCreateActivity({
      activityName,
      selectedDuration,
      isFixed,
      startTime,
      selectedCommute,
    });
    navigation.goBack();
  };

  // Render helpers
  const renderChips = (options: string[], selected: string, onSelect: (val: string) => void) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[styles.chip, selected === option && styles.chipSelected]}
          onPress={() => onSelect(option)}
        >
          <Text style={[styles.chipText, selected === option && styles.chipTextSelected]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6200EE" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <View style={styles.iconCircle}>
            <Ionicons name="water" size={32} color="#FFF" />
          </View>
          <TextInput
            style={styles.nameInput}
            value={activityName}
            onChangeText={setActivityName}
            placeholder="Nombre de la actividad"
            placeholderTextColor="#D1B3FF"
          />
        </View>
      </SafeAreaView>

      <View style={styles.formContainerBackground}>
        <ScrollView
          style={styles.scrollForm}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={isParentScrollEnabled}
        >
          <View style={styles.formContainer}>

            <View style={styles.section}>
              <Text style={styles.labelSmall}>Duración de la actividad</Text>
              {renderChips(TIME_OPTIONS, selectedDuration, setSelectedDuration)}
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Intervalo fijo: </Text>
              <Switch
                value={isFixed}
                onValueChange={setIsFixed}
                trackColor={{ false: '#E0E0E0', true: '#6200EE' }}
                thumbColor={'#FFFFFF'}
              />
            </View>

            {isFixed && (
              <View style={styles.timePickerSection}>
                <View style={styles.centeredPicker}>
                  <TimePicker
                    onTimeChange={updateTime}
                  />
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
            )}

            <View style={styles.section}>
              <Text style={styles.labelSmall}>Tiempo de traslado</Text>
              {renderChips(TIME_OPTIONS, selectedCommute, setSelectedCommute)}
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleSaveActivity}>
          <Text style={styles.primaryButtonText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ... tus estilos exactos sin modificar (styles.create({...}))

const styles = StyleSheet.create({
  timePickerSection: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: '#F9F9F9',
    padding: 20,
    borderRadius: 20,
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
  container: { flex: 1, backgroundColor: '#6200EE' },
  header: { backgroundColor: '#6200EE', paddingHorizontal: 20, paddingBottom: 40 },
  headerTopRow: { flexDirection: 'row', marginTop: 10 },
  closeButton: { backgroundColor: '#FFF', borderRadius: 20, padding: 4, alignSelf: 'flex-start' },
  headerContent: { flexDirection: 'row', alignItems: 'center', marginTop: 40 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  nameInput: { flex: 1, fontSize: 24, color: '#FFF', fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#FFF', paddingVertical: 8 },

  formContainer: { flex: 1, overflow: 'hidden' },
  formContainerBackground: { flex: 1, backgroundColor: '#FFF' },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  label: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  labelSmall: { fontSize: 14, color: '#666', marginBottom: 12, fontWeight: '500' },
  section: { marginBottom: 24 },

  scrollForm: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 20 },

  timePickerContainer: { alignItems: 'center', marginBottom: 24 },
  timeTextActiveContainer: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginBottom: 8 },
  timeTextActive: { fontSize: 18, color: '#6200EE', fontWeight: 'bold' },

  chipContainer: { flexDirection: 'row' },
  chip: { backgroundColor: '#EAEAEA', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
  chipSelected: { backgroundColor: '#6200EE' },
  chipText: { color: '#666', fontWeight: 'bold' },
  chipTextSelected: { color: '#FFF' },

  footer: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    paddingTop: 10,
    backgroundColor: '#F8F9FA'
  },
  primaryButton: { backgroundColor: '#6200EE', paddingVertical: 16, borderRadius: 30, alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },

});