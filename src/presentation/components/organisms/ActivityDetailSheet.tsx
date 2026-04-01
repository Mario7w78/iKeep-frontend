import React, { forwardRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import { 
  BottomSheetModal, 
  BottomSheetView, 
  BottomSheetBackdrop 
} from '@gorhom/bottom-sheet';

interface Props {
  snapPoints: string[];
}

// Usamos forwardRef para recibir el bottomSheetModalRef desde ActivityListScreen
export const ActivityDetailSheet = forwardRef<BottomSheetModal, Props>(
  ({ snapPoints }, ref) => {
    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        enableDynamicSizing={false}
        backdropComponent={(props) => (
          <BottomSheetBackdrop 
            {...props} 
            disappearsOnIndex={-1} 
            appearsOnIndex={0} 
            pressBehavior="close"
          />
        )}
      >
        <BottomSheetView style={styles.sheetContainer}>
          <Text style={styles.sheetTitle}>Detalles de la Actividad</Text>
          <Text style={styles.sheetText}>Aquí puedes poner los controles de edición.</Text>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
  sheetTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 12,
    color: '#333'
  },
  sheetText: {
    fontSize: 16,
    color: '#666'
  }
});