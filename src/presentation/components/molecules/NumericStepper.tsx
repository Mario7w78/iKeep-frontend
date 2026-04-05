import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Text
}
    from 'react-native';
import { Theme } from '../theme/colors';
import AntDesign from '@expo/vector-icons/AntDesign';
import { getHours, getMinutes } from '../../../domain/timeUtils';
import { timeType } from '../../../domain/entities/activity.types';

interface Props {
    value: number;
    selectedTimeType: timeType;
    onSelectType: (type: timeType) => void;
    onAdd: () => void;
    onSubstract: () => void;
}

export const NumericStepper = ({ value, selectedTimeType, onSelectType, onAdd, onSubstract }: Props) => (
    <View style={styles.container} >
        <TouchableOpacity style={styles.iconButton} onPress={onSubstract}>
            <AntDesign  name="minus" size={24} color={Theme.colors.surface}/>
        </TouchableOpacity>

        <View style={styles.timeContainer}>
            <TouchableOpacity 
                style={[
                    styles.timeButton,
                    (selectedTimeType === timeType.hour || selectedTimeType === timeType.both) && styles.activeTimeButton
                ]}
                onPress={() => onSelectType(timeType.hour)
                }>
                <Text 
                    style={[
                        styles.timeText,
                        (selectedTimeType === timeType.hour || selectedTimeType === timeType.both) && styles.activeTimeText]}>
                    {getHours(value)}
                </Text>
            </TouchableOpacity>

            <Text style={styles.timeText} >
                :
            </Text>

            <TouchableOpacity
                style={[
                    styles.timeButton,
                    (selectedTimeType === timeType.minute || selectedTimeType === timeType.both) && styles.activeTimeButton ]}
                onPress={() => onSelectType(timeType.minute)
                }>
                <Text 
                    style={[
                        styles.timeText,
                        (selectedTimeType === timeType.minute || selectedTimeType === timeType.both) && styles.activeTimeText]}>
                    {getMinutes(value)}
                </Text>
            </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={onAdd}>
            <AntDesign name="plus" size={24} color={Theme.colors.surface} />
        </TouchableOpacity>
    </View>
)


export const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: Theme.colors.lowOpacityPrimary,
        borderRadius: 20,
        gap: 15
    },
    mainText: {
        fontWeight: 'bold',
        fontSize: 32,
        color: Theme.colors.primary,
        textAlign: 'center'
    },
    iconButton: {
        backgroundColor: Theme.colors.primary,
        padding: 20,
        borderRadius: 25,
    },
    timeContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    timeButton: {
        backgroundColor: 'transparent', 
        padding: 5,
        borderRadius: 10,
        width: 60,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Theme.colors.primary,
        alignSelf:'center'
    },
    activeTimeButton: {
        backgroundColor: Theme.colors.primary, 
    },
    activeTimeText: {
        color: Theme.colors.surface, 
    },
})