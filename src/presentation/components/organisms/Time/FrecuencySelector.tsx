import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DayOfWeek } from '../../../../domain/entities/Activity';
import { Theme } from '../../theme/colors';
import { frecuencyProps } from '../../../hooks/props'
import AntDesign from '@expo/vector-icons/AntDesign';
interface props {
    onSelect: (val: DayOfWeek) => void;
    selectedValue: string[];
    days: DayOfWeek[];
    configuredDays: DayOfWeek[];
    dayColors: Partial<Record<DayOfWeek, string>>;
    selectedDays: DayOfWeek[],
    handleUpdateFrecuency: () => void,
    editingGroupId: number,
}

export const FrecuencySelector = ({ onSelect, selectedValue, days, configuredDays, dayColors, handleUpdateFrecuency, selectedDays, editingGroupId }: props) => {

    const DAY_LETTERS: Partial<Record<DayOfWeek, string>> = {
        'Lunes': 'L', 'Martes': 'M', 'Miercoles': 'X',
        'Jueves': 'J', 'Viernes': 'V', 'Sabado': 'S', 'Domingo': 'D'
    };

    return (
        <View style={styles.container}>
            <View style={styles.frecuencyHeader}>
                <Text style={styles.labelSmall}>Frecuencia</Text>
                <TouchableOpacity
                    style={[styles.saveButton, selectedDays.length === 0 && styles.saveButtonDisabled]}
                    onPress={handleUpdateFrecuency}
                    disabled={selectedDays.length === 0}
                >
                    <Text style={styles.saveButtonText}>
                        {editingGroupId !== null ? 'Actualizar' : 'Guardar'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={{
                flexDirection: 'row',
                gap: 10,
                alignItems: 'center',
                marginBottom: 10
            }}>
                <AntDesign name="info-circle" size={10} color='white' />
                <Text style={{
                    color: Theme.colors.textSecondary,
                    fontSize: 10,
                    fontWeight: 'bold'
                }}>
                    Establece la hora de inicio de tu actividad en estos dias:
                </Text>
            </View>

            <View style={styles.daysSelectorContainer}>
                {days.map((item, index) => {
                    const isSelected = selectedValue.includes(item);
                    const isConfigured = configuredDays.includes(item);
                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => onSelect(item)}
                            style={[
                                styles.dayButton,
                                isConfigured && !isSelected && styles.dayButtonConfigured,
                                isSelected && styles.dayButtonSelected,
                            ]}
                        >
                            <Text style={[
                                styles.dayLetter,
                                isConfigured && !isSelected && styles.dayLetterConfigured,
                                isSelected && styles.dayLetterSelected,
                            ]}>
                                {DAY_LETTERS[item]}
                            </Text>
                            <Text style={[
                                styles.dayAbbr,
                                isConfigured && !isSelected && styles.dayAbbrConfigured,
                                isSelected && styles.dayAbbrSelected,
                            ]}>
                                {item.substring(0, 3)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

export const styles = StyleSheet.create({
    container: { flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' },
    frecuencyHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginRight: 15, marginBottom: 5,
    },
    labelSmall: { fontSize: 20, color: Theme.colors.textSecondary, fontWeight: '700' },
    saveButton: {
        backgroundColor: Theme.colors.lightPrimary,
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    },
    saveButtonDisabled: { opacity: 0.35 },
    saveButtonText: { fontWeight: 'bold', color: Theme.colors.surface, fontSize: 13 },

    daysSelectorContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },

    dayButton: {
        width: 38, height: 48, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: Theme.colors.background,
        gap: 2,
    },
    dayButtonConfigured: {
        borderColor: '#AFA9EC',
        backgroundColor: '#EEEDFE',
    },
    dayButtonSelected: {
        backgroundColor: Theme.colors.primary,
    },

    dayLetter: { fontSize: 16, fontWeight: '500', color: Theme.colors.textSecondary, lineHeight: 18 },
    dayLetterConfigured: { color: '#3C3489' },
    dayLetterSelected: { color: '#fff' },

    dayAbbr: { fontSize: 11, fontWeight: '500', color: Theme.colors.textSecondary, lineHeight: 13 },
    dayAbbrConfigured: { color: '#7F77DD' },
    dayAbbrSelected: { color: 'rgba(255,255,255,0.6)' },
});