import React, { useState } from 'react';
import { DropdownMenu } from '../molecules/DropdownMenu';
import { MenuOptionCheck } from '../atoms/MenuOptionCheck'
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export enum Frecuencia {
    Diario = 'Todos los días',
    Lunes = 'Lunes',
    Martes = 'Martes',
    Miercoles = 'Miércoles',
    Jueves = 'Jueves',
    Viernes = 'Viernes',
    Sábado = 'Sábado',
    Domingo = 'Domingo',
}

interface Props {
    onSelectionChange: (dias: Frecuencia[]) => void;
    seleccionados: Frecuencia[];
}

export default function FrecuenceDropdown({ onSelectionChange, seleccionados }: Props) {
    const [visible, setVisible] = useState(false);

    const toggleSelect = (opcion: Frecuencia) => {
        let nuevosSeleccionados = [...seleccionados];

        if (opcion === Frecuencia.Diario) {
            onSelectionChange([Frecuencia.Diario]);
            return;
        }

        if (nuevosSeleccionados.includes(opcion)) {
            nuevosSeleccionados = nuevosSeleccionados.filter(item => item !== opcion);
        } else {
            nuevosSeleccionados = nuevosSeleccionados.filter(item => item !== Frecuencia.Diario);
            nuevosSeleccionados.push(opcion);
        }

        const diasSemana = Object.values(Frecuencia).filter(f => f !== Frecuencia.Diario);
        if (nuevosSeleccionados.length === diasSemana.length) {
            onSelectionChange([Frecuencia.Diario]);
        } else {
            onSelectionChange(nuevosSeleccionados);
        }
    };

    const renderTriggerText = () => {
        if (seleccionados.length === 0) return "Seleccionar días";
        if (seleccionados.length === Object.keys(Frecuencia).length) return "Todos los días";
        return seleccionados.join(', ');
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
                {Object.values(Frecuencia).map((dia) => (
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
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: '#6200EE',
        elevation: 3,
    },
    triggerText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    optionText: {
        padding: 10,
        fontSize: 16,
        color: '#333',
    },
    menu: {
        position: 'absolute',
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    }

});