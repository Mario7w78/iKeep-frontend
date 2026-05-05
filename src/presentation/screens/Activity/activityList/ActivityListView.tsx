import React, { useRef, useCallback, useMemo } from 'react';
import { SectionList, ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityDetailSheet, BottomSheetModal } from '../../../components/organisms/Activity/ActivityDetailSheet';

import { HeaderTitle } from '../../../components/molecules/Header/HeaderTitle';
import ActivityCard from '../../../components/organisms/Activity/ActivityCard';

import { Theme } from '../../../components/theme/colors';
import { useActivityStore } from '../../../../infrastructure/store/useActivityStore';
import { ActivityType } from '../../../../domain/entities/Activity';

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

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const sections = useMemo(() => {
    const fixed = activities.filter(a => a.type === ActivityType.FIXED);
    const flexible = activities.filter(a => a.type === ActivityType.FLEXIBLE);

    return [
      { title: 'FIJAS', data: fixed },
      { title: 'FLEXIBLES', data: flexible },
    ];
  }, [activities]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <HeaderTitle title="Actividades" appName="iKeep" />
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.actType, title === 'FIJAS' ? styles.fixedTitle : styles.flexibleTitle]}>
              {title}
            </Text>
          )}
          renderItem={({ item }) => (
            <ActivityCard
              activity={item}
              isFixed={item.type === ActivityType.FIXED}
              onPress={handlePresentModalPress}
              onEdit={() => handleEditActivity(item.id, item.title)}
              onDelete={() => handleDeleteActivity(item.id)}
            />
          )}
        />
      )}
      <ActivityDetailSheet ref={bottomSheetModalRef} />
    </SafeAreaView>
  );
}

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  actType: {
    fontWeight: 'bold',
    fontSize: 24,
    marginLeft: 20,
    marginVertical: 20,
  },
  fixedTitle: {
    color: Theme.activity.fixed.titleColor,
  },
  flexibleTitle: {
    color: Theme.activity.flexible.titleColor,
  },
})