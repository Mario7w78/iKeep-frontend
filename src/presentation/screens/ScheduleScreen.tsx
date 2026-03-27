import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Tipamos las rutas para TypeScript
type RootTabParamList = {
  ActivityList: undefined;
  CreateActivity: undefined;
  Schedule: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootTabParamList, 'ActivityList'>;
};

export default function ScheduleView({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendario</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#6200EE' }, // El morado de tus mockups
});