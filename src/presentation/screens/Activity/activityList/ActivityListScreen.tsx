import React, { useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityDetailSheet, BottomSheetModal } from '../../../components/organisms/ActivityDetailSheet';

// Importamos componentes atomizados
import { HeaderTitle } from '../../../components/molecules/HeaderTitle';
import ActivityCard from '../../../components/organisms/ActivityCard';

import useActivityListViewModel from '../../../hooks/useActivityListViewModel';
import { styles } from '../activityStyles';

export default function ActivityListScreen() {
  const viewModel = useActivityListViewModel();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  return (
    <SafeAreaView style={styles.container}>

      <HeaderTitle title="Actividades" appName="IKEEP" />

      <FlatList
        data={viewModel.activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityCard
            title={item.title}
            time={item.time}
            onPress={handlePresentModalPress}
            onEdit={() => viewModel.handleEditActivity(item.id, item.title)}
            onDelete={() => viewModel.handleDeleteActivity(item.id, item.title)}
          />
        )}
      />

      <ActivityDetailSheet ref={bottomSheetModalRef} />
    </SafeAreaView>
  );
}