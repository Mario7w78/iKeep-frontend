import React, { ReactNode } from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface Props {
    onSelect: () => void;
    children: ReactNode;
    isSelected: boolean; 
}

export const MenuOptionCheck = ({ onSelect, children, isSelected }: Props) => {
    return (
        <TouchableOpacity onPress={onSelect} style={styles.menuOption}>
            <View style={styles.container}>
                <MaterialIcons 
                    name={isSelected ? 'check-box' : 'check-box-outline-blank'} 
                    size={24} 
                    color={isSelected ? '#6200EE' : '#666'} 
                />
                <View style={styles.textContainer}>
                    {children}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    menuOption: {
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#EEE',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textContainer: {
        marginLeft: 10,
    }
});