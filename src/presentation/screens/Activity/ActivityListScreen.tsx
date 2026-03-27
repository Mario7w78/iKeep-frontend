import React, { useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import ActivityCard from '../../components/ActivityCard';

// Importamos el ViewModel
import useActivityListViewModel from '../../hooks/useActivityListViewModel';

export default function ActivityListScreen() {
  
  const viewModel = useActivityListViewModel();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['90%'], []);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Actividades</Text>
        <Text style={styles.headerApp}>IKEEP</Text>
      </View>

      <FlatList
        data={viewModel.activities} // Consumimos los datos del ViewModel
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityCard
            title={item.title}
            time={item.time}
            onPress={handlePresentModalPress} 
            // Conectamos los botones de la tarjeta a las acciones del ViewModel
            onEdit={() => viewModel.handleEditActivity(item.id, item.title)}
            onDelete={() => viewModel.handleDeleteActivity(item.id, item.title)}
          />
        )}
      />
      
      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        enableDynamicSizing={false}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close"/>
        )}
      >
        <BottomSheetView style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>Detalles de la Actividad</Text>
          <Text>Aquí puedes poner los controles de edición.</Text>
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' }, 
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  headerApp: { fontSize: 24, fontWeight: 'bold', color: '#6200EE' },
  sheetContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
  sheetTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
});