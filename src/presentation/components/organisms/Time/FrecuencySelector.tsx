import { View, Text, StyleSheet } from 'react-native';
import { ChipGroup } from '../../molecules/Time/ChipGroup';
import { DayOfWeek } from '../../../../domain/entities/Activity';

interface props {
    onSelect: (val:DayOfWeek)=>void,
    selectedValue: string[],
    days: string[]
}

export const FrecuencySelector = ({onSelect, selectedValue, days }: props) => {
    return (
        <View>
            <ChipGroup onSelect={onSelect} options={days} selectedValue={selectedValue} uniqueValue='Diario'/>
        </View>
    )
}