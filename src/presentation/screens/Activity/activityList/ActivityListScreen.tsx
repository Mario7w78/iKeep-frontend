import React, { useRef, useCallback } from 'react';
import { FlatList, ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityDetailSheet, BottomSheetModal } from '../../../components/organisms/ActivityDetailSheet';

import { HeaderTitle } from '../../../components/molecules/HeaderTitle';
import ActivityCard from '../../../components/organisms/ActivityCard';

import useActivityList from '../../../hooks/useActivityList';
import { styles } from '../activityStyles';
import { Theme } from '../../../components/theme/colors';

export default function ActivityListScreen() {
  const {
    activities,
    isLoading,
    handleEditActivity,
    handleDeleteActivity
  } = useActivityList();

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
              // Si es fija mostramos el rango, si es flexible la duración en min
              time={item.type === 'FIXED'
                ? `${item.startTime} - ${item.endTime}`
                : `${item.durationMinutes} min`}
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