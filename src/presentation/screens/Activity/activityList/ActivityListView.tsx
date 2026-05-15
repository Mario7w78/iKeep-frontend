import React, { useRef, useCallback, useMemo } from 'react';
import { SectionList, ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MainHeader } from '../../../components/atoms/Home/MainHeader';
import { TimeLine } from '../../../components/molecules/Time/TimeLine';

import { Theme } from '../../../components/theme/colors';
import { useActivityStore } from '../../../../di/Dependencies';


export default function ActivityListView() {

  const {
    activities,
    isLoading,
    handleEditActivity,
    handleDeleteActivity,
    loadActivities
  } = useActivityStore();

  useFocusEffect(useCallback(() => {
    loadActivities();
  }, []));

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <View style={{ flex: 1 }}>
        <MainHeader title="Bienvenido, Mario" />
        <Text style={styles.subtitle}>Tu horario hoy: </Text>
        <TimeLine/>
      </View>
    </SafeAreaView>
  );
}

export const styles = ({
  container: { flex: 1, backgroundColor: Theme.componentColors.background },
  actType: {
    fontWeight: 'bold',
    fontSize: 24,
    marginLeft: 20,
    marginVertical: 20,
  },
  subtitle: {
    fontSize: 20,
    color: Theme.colors.textSecondary,
    marginLeft: 20,
    marginBottom: 10,
    fontWeight: '600',
  },
  fixedTitle: {
    color: Theme.activity.fixed.titleColor,
  },
  flexibleTitle: {
    color: Theme.activity.flexible.titleColor,
  },
})