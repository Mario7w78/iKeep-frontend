import React, { useRef, useCallback } from 'react';
import { FlatList, ActivityIndicator, View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityDetailSheet, BottomSheetModal } from '../../../components/organisms/Activity/ActivityDetailSheet';

import { HeaderTitle } from '../../../components/molecules/Header/HeaderTitle';
import ActivityCard from '../../../components/organisms/Activity/ActivityCard';

import { Theme } from '../../../components/theme/colors';
import { useActivityStore } from '../../../../infrastructure/store/useActivityStore';

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

  return (
    <SafeAreaView style={styles.container}>
      <HeaderTitle title="Actividades" appName="IKEEP" />

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <ActivityCard
              title={item.title}
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
  container: { flex: 1, backgroundColor: Theme.colors.background }
})