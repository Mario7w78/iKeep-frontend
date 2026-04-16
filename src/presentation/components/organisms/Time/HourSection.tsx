import { View, Text, StyleSheet, GestureResponderEvent } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { SwitchRow } from '../../atoms/Common/SwitchRow';
import { Theme } from '../../theme/colors';
import { TimePickerSection } from '../../molecules/Time/TimePickerSection';
interface props {
    isFixed: boolean,
    setIsFixed: React.Dispatch<React.SetStateAction<boolean>>,
    updateTime: (hourString: string, minuteString: string, period: string) => void,
    onStartResponderCapture: ((event: GestureResponderEvent) => boolean) | undefined
    onResponderRelease: ((event: GestureResponderEvent) => void) | undefined
}
export const HourSection =
    ({
        isFixed,
        setIsFixed,
        updateTime,
        onStartResponderCapture,
        onResponderRelease
    }: props) => {
        return (
            <View style={styles.timeSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={styles.icon2Container}>
                            <AntDesign name="clock-circle" size={20} color='white' />
                        </View>
                        <View style={{ flexDirection: 'column' }}>
                            <Text style={styles.label} >Hora fija</Text>
                            <Text style={styles.descriptionLabel} >El algoritmo respetará esta hora</Text>
                        </View>
                    </View>
                    <SwitchRow
                        label="Hora fija"
                        value={isFixed}
                        onValueChange={setIsFixed}
                    />
                </View>

                {isFixed && (
                    <View
                        onStartShouldSetResponderCapture={onStartResponderCapture}
                        onResponderRelease={onResponderRelease}
                    >
                        <TimePickerSection
                            onTimeChange={updateTime}
                        />
                    </View>
                )}

                {!isFixed && (
                    <View>
                        <Text style={styles.messages}>
                            (El algoritmo le asignará un intervalo de tiempo óptimo)
                        </Text>
                    </View>
                )}
            </View>
        )
    }

export const styles = StyleSheet.create({
    section: {
        width: '50%',
    },
    timeSection: {
        flexDirection: 'column',
        backgroundColor: Theme.colors.lightBackground,
        borderRadius: Theme.generalBorder,
        padding: 20,
    },
    timeInnerSection: {
        flexDirection: 'row',
    },

    inputSection: {
        flexDirection: 'row',
        gap: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10
    },
    iconContainer: {
        backgroundColor: Theme.colors.border,
        borderRadius: 7,
        width: 25,
        height: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon2Container: {
        backgroundColor: Theme.colors.primary,
        borderRadius: 7,
        width: 35,
        height: 35,
        justifyContent: 'center',
        alignItems: 'center',
    },
    labelSmall: {
        fontSize: 20,
        color: Theme.colors.textSecondary,
        fontWeight: '700',
        marginBottom: 10
    },
    label: {
        fontSize: 20,
        color: Theme.colors.textSecondary,
        fontWeight: '700',
    },
    subLabelSmall: {
        fontSize: 16,
        color: Theme.colors.textSecondary,
        fontWeight: '700',
    },
    descriptionLabel: {
        fontSize: 12,
        color: Theme.colors.textSecondary,
        fontWeight: '700',
    },
    messages: {
        fontSize: 15,
        color: Theme.colors.textSecondary,
        fontWeight: '700',
        textAlign: 'center',
        marginVertical: 20
    },
});
