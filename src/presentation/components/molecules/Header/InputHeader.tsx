import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, ThemeColors } from '../../theme/colors'; 
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text
}
  from 'react-native';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
}

export const InputHeader = ({ value, onChangeText, onClose }: Props) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
  <SafeAreaView style={styles.header}>
    
    <View style={styles.headerTopRow}>
      <Text style={styles.headerText}>Nueva Actividad</Text>
      <TouchableOpacity onPress={onClose} style={styles.headerCloseButton}>
        <Ionicons name="close" size={32} color={colors.surface}/>
      </TouchableOpacity>
    </View>

    <View style={styles.headerContent}>
      <TextInput
        style={styles.nameInput}
        value={value}
        onChangeText={onChangeText}
        placeholder="¿Comó se llama la actividad?"
        placeholderTextColor={colors.placeholder}
        autoCorrect={false}
      />
    </View>

  </SafeAreaView>
);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  header: { 
    backgroundColor: colors.cardBackground, 
    paddingHorizontal: 20, 
  },
  headerTopRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 20
  },
  headerCloseButton: { 
    backgroundColor: colors.cardBackground, 
    borderRadius: 15, 
    padding: 4, 
  },
  headerText: {
    color: colors.surface,
    fontWeight: 'bold',
    fontSize: 24,
  },
  headerContent: { 
    flexDirection: 'column', 
    backgroundColor: colors.cardBackground,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 15, 
    borderColor: colors.cardBorder,
    marginTop: 10,
    
  },
  nameInput: { 
    fontSize: 16, 
    color: colors.surface, 
    fontWeight: '600', 
    paddingVertical: 8 
  },
});