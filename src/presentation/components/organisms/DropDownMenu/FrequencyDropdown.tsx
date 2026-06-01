import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { DropdownMenu } from '../../molecules/DropDownMenu/DropdownMenu';
import { MenuOptionCheck } from '../../atoms/DropDownMenu/MenuOptionCheck';
import { DayOfWeek } from '../../../../domain/entities/Activity';
import { Theme } from '../../theme/colors';

const DAYS_OF_WEEK: DayOfWeek[] = [
    'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'
];

interface Props {
    onSelectionChange: (days: DayOfWeek[]) => void;
    selected: DayOfWeek[];
}

export default function FrequencyDropdown({ onSelectionChange, selected }: Props) {
    const [visible, setVisible] = useState(false);

    const toggleSelect = (day: DayOfWeek) => {
        const newSelected = selected.includes(day)
            ? selected.filter(item => item !== day)
            : [...selected, day];

        onSelectionChange(newSelected);
    };

    const handleSelectAll = () => {
        if (selected.length === DAYS_OF_WEEK.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange([...DAYS_OF_WEEK]);
        }
    };

    const renderTriggerText = () => {
        if (selected.length === 0) return "Seleccionar días";
        if (selected.length === DAYS_OF_WEEK.length) return "Todos los días";
            return DAYS_OF_WEEK
            .filter(d => selected.includes(d))
            .map(d => d.substring(0, 3)) 
            .join(', ');
    };

    return (
        <View style={styles.menuContainer}>
            <DropdownMenu
                visible={visible}
                handleOpen={() => setVisible(true)}
                handleClose={() => setVisible(false)}
                dropdownWidth={250}
                trigger={
                    <View style={styles.triggerStyle}>
                        <Text style={styles.triggerText} numberOfLines={1}>
                            {renderTriggerText()}
                        </Text>
                        <MaterialIcons name='keyboard-arrow-down' size={30} color='white' />
                    </View>
                }
            >
                <MenuOptionCheck
                    isSelected={selected.length === DAYS_OF_WEEK.length}
                    onSelect={handleSelectAll}
                >
                    <Text style={[styles.optionText, { fontWeight: 'bold' }]}>Todos los días</Text>
                </MenuOptionCheck>

                <View style={styles.separator} />

                {DAYS_OF_WEEK.map((day) => (
                    <MenuOptionCheck
                        key={day}
                        isSelected={selected.includes(day)}
                        onSelect={() => toggleSelect(day)}
                    >
                        <Text style={styles.optionText}>{day}</Text>
                    </MenuOptionCheck>
                ))}
            </DropdownMenu>
        </View>
    );
}

const styles = StyleSheet.create({
    menuContainer: {
        marginVertical: 10,
        alignItems: 'center',
        width: '100%',
    },
    triggerStyle: {
        height: 50,
        width: '100%',
        flexDirection: 'row',
        paddingHorizontal: 15,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: Theme.colors.cardBackground, 
        elevation: 3,
    },
    triggerText: {
        fontSize: 14,
        fontWeight: '600',
        color: Theme.colors.surface,
        flex: 1,
    },
    optionText: {
        paddingVertical: 10,
        paddingHorizontal: 5,
        fontSize: 16,
        color: '#333',
    },
    separator: {
        height: 1,
        backgroundColor: '#EEE',
        marginVertical: 5,
    }
});