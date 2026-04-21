// screens/Onboarding/OnBoardingView.tsx
import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    ViewToken,
    Alert,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../../../infrastructure/store/useAppStore';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { Theme } from '../../theme/colors';
import { TimePickerSection } from '../../molecules/Time/TimePickerSection';
import { useScheduleStore } from '../../../../infrastructure/store/useScheduleStore';
import { dateToMinutes, formatTime } from '../../../utils/timeUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Organiza tus actividades',
        description: 'Crea y gestiona todas tus actividades en un solo lugar.',
        showTimePicker: false,
    },
    {
        id: '2',
        title: 'Planifica tu horario',
        description: 'Visualiza tu semana de un vistazo y nunca pierdas una cita.',
        showTimePicker: false,
    },
    {
        id: '3',
        title: '¡Listo para empezar!',
        description: 'Crea tu primera actividad y empieza a organizarte.',
        showTimePicker: false,
    },
    {
        id: '4',
        title: '¿Cuando inicias tu día?',
        description: 'Selecciona una hora',
        showTimePicker: true,
    },
    {
        id: '5',
        title: '¿Cuando terminas tu día?',
        description: 'Selecciona una hora',
        showTimePicker: true
    },
];

export default function OnBoardingView() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const setHasSeenOnboarding = useAppStore((s) => s.setHasSeenOnboarding);
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const { setStartHour, setEndHour } = useScheduleStore();
    const [startTime, setStartTime] = useState(new Date(new Date().setHours(4, 0, 0, 0)))
    const [endTime, setEndTime] = useState(new Date(new Date().setHours(22, 0, 0, 0)))

    const updateTime = (hourString: string, minuteString: string, period: string, id?: string) => {
        const baseTime = id === '4' ? startTime : endTime;
        const newDate = new Date(baseTime);

        let hours = parseInt(hourString, 10);
        if (period === 'AM') {
            if (hours === 12) hours = 0;
        } else {
            if (hours !== 12) hours += 12;
        }

        newDate.setHours(hours);
        newDate.setMinutes(parseInt(minuteString, 10));

        if (id === '4') {
            setStartTime(newDate);
        } else {
            setEndTime(newDate);
        }
    };

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0) {
                setActiveIndex(viewableItems[0].index ?? 0);
            }
        }
    ).current;

    const handleNext = (skip: boolean) => {
        if (activeIndex < SLIDES.length - 1) {
            if (skip) {
                flatListRef.current?.scrollToIndex({ index: SLIDES.length - 2 });
            }
            else {
                flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
            }
        } else {
            handleFinish();
        }
    };

    const handleFinish = async () => {
        const startMin = dateToMinutes(startTime);
        const endMin = dateToMinutes(endTime);

        if (startMin >= endMin) {
            Alert.alert(
                "Horario inválido",
                "La hora de inicio debe ser anterior a la hora de fin. ¡Por favor, revisa tus selecciones!"
            );
            return;
        }
        
        try {
            await AsyncStorage.setItem('@day_start_hour', startMin.toString());
            await AsyncStorage.setItem('@day_end_hour', endMin.toString());
        } catch (e) {
            console.error('Error guardando límites del día:', e);
        }

        setStartHour(startMin);
        setEndHour(endMin);
        setHasSeenOnboarding(true);
        navigation.navigate('MainTabs');
    };

    const isLast = activeIndex === SLIDES.length - 1;

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                renderItem={({ item }) => (
                    <View style={styles.slide}>
                        <View style={styles.illustration} />
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.description}>{item.description}</Text>

                        {(item.showTimePicker) && (
                            <View>
                                <Text style={styles.hourText}>
                                    {item.id === '4' ? formatTime(startTime) : formatTime(endTime)}
                                </Text>
                                <TimePickerSection
                                    onTimeChange={(h, m, p) => updateTime(h, m, p, item.id)}
                                />
                            </View>

                        )}

                    </View>
                )}
            />

            <View style={styles.dotsContainer}>
                {SLIDES.map((_, i) => (
                    <View
                        key={i}
                        style={[styles.dot, i === activeIndex && styles.dotActive]}
                    />
                ))}
            </View>

            <View style={styles.footer}>
                {!isLast && (
                    <TouchableOpacity onPress={() => handleNext(true)} style={styles.skipButton}>
                        <Text style={styles.skipText}>Omitir</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={() => handleNext(false)}
                    style={[styles.nextButton, isLast && styles.nextButtonFull]}
                >
                    <Text style={styles.nextText}>
                        {isLast ? 'Empezar' : 'Siguiente'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.lightBackground },
    slide: {
        width,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    hourText: {
        textAlign: 'center',
        marginVertical: 20,
        fontSize: 32,
        fontWeight: 'bold',
        color: Theme.colors.surface
    },
    illustration: {
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: Theme.colors.surface,
        marginBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: Theme.colors.primary,
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: Theme.colors.surface,
        textAlign: 'center',
        lineHeight: 24,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        paddingBottom: 24,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Theme.colors.surface,
    },
    dotActive: {
        width: 20,
        backgroundColor: Theme.colors.primary,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
        gap: 12,
    },
    skipButton: { paddingVertical: 14, paddingHorizontal: 8 },
    skipText: { fontSize: 16, color: Theme.colors.surface },
    nextButton: {
        flex: 1,
        backgroundColor: Theme.colors.primary,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    nextButtonFull: { flex: 1 },
    nextText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});