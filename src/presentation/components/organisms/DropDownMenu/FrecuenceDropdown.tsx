import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { DropdownMenu } from '../../molecules/DropDownMenu/DropdownMenu';
import { MenuOptionCheck } from '../../atoms/DropDownMenu/MenuOptionCheck';
import { DayOfWeek } from '../../../../domain/entities/Activity';
import { Theme } from '../../theme/colors';

const DIAS_DE_LA_SEMANA: DayOfWeek[] = [
    'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'
];

interface Props {
    onSelectionChange: (dias: DayOfWeek[]) => void;
    seleccionados: DayOfWeek[];
}

export default function FrecuenceDropdown({ onSelectionChange, seleccionados }: Props) {
    const [visible, setVisible] = useState(false);

    const toggleSelect = (dia: DayOfWeek) => {
        let nuevosSeleccionados = [...seleccionados];

        if (nuevosSeleccionados.includes(dia)) {
            nuevosSeleccionados = nuevosSeleccionados.filter(item => item !== dia);
        } else {
            nuevosSeleccionados.push(dia);
        }

        onSelectionChange(nuevosSeleccionados);
    };

    const handleSelectAll = () => {
        if (seleccionados.length === DIAS_DE_LA_SEMANA.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange([...DIAS_DE_LA_SEMANA]);
        }
    };

    const renderTriggerText = () => {
        if (seleccionados.length === 0) return "Seleccionar días";
        if (seleccionados.length === DIAS_DE_LA_SEMANA.length) return "Todos los días";
            return DIAS_DE_LA_SEMANA
            .filter(d => seleccionados.includes(d))
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
                    isSelected={seleccionados.length === DIAS_DE_LA_SEMANA.length}
                    onSelect={handleSelectAll}
                >
                    <Text style={[styles.optionText, { fontWeight: 'bold' }]}>Todos los días</Text>
                </MenuOptionCheck>

                <View style={styles.separator} />

                {DIAS_DE_LA_SEMANA.map((dia) => (
                    <MenuOptionCheck
                        key={dia}
                        isSelected={seleccionados.includes(dia)}
                        onSelect={() => toggleSelect(dia)}
                    >
                        <Text style={styles.optionText}>{dia}</Text>
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
        backgroundColor: Theme.colors.primary, 
        elevation: 3,
    },
    triggerText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
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