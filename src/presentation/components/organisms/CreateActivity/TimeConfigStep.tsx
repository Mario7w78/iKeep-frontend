import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DayOfWeek } from "../../../../domain/entities/Activity";
import { PartitionConfig, DayConfig } from "../../../../domain/entities/activity.types";
import { useTheme, ThemeColors } from "../../theme/colors";
import TimePartitionForm from "../../molecules/CreateActivity/TimePartitionForm";

const getDayAbbreviation = (day: string) => {
  switch (day) {
    case "Lunes": return "Lun";
    case "Martes": return "Mar";
    case "Miercoles": return "Mié";
    case "Jueves": return "Jue";
    case "Viernes": return "Vie";
    case "Sabado": return "Sáb";
    case "Domingo": return "Dom";
    default: return day;
  }
};

const getTotalMinutes = (config: DayConfig | undefined): number => {
  if (!config) return 0;
  return config.partitions.reduce(
    (sum, p) => sum + p.durationTime + (p.travelTo ?? 0) + (p.travelFrom ?? 0),
    0
  );
};

type TimeConfigStepProps = {
  configuredDays: DayOfWeek[];
  partitions: PartitionConfig[];
  activePartitionIndex: number;
  startTime: Date;
  endTime: Date;
  durationTimeValue: number;
  travelToValue: number | null;
  travelFromValue: number | null;
  isFixed: boolean;
  isAnchor: boolean;
  preferredStartTime: number | null;
  preferredEndTime: number | null;
  onSetActivePartition: (index: number) => void;
  onAddPartition: () => void;
  onDiscardPartition: () => void;
  onSetStartTime: (date: Date) => void;
  onSetEndTime: (date: Date) => void;
  onSetDurationTime: (value: number) => void;
  onSetTravelToValue: (value: number) => void;
  onSetTravelFromValue: (value: number) => void;
  onSetPreferredStartTime: (val: number | null) => void;
  onSetPreferredEndTime: (val: number | null) => void;

  activeDay: DayOfWeek | null;
  onSwitchDay: (day: DayOfWeek) => void;
  onCopyConfig: (fromDay: DayOfWeek) => void;
  onCopyToAll: () => void;
  daysDict: Partial<Record<DayOfWeek, DayConfig>>;
};

export default function TimeConfigStep({
  configuredDays,
  partitions,
  activePartitionIndex,
  startTime,
  endTime,
  durationTimeValue,
  travelToValue,
  travelFromValue,
  isFixed,
  isAnchor,
  preferredStartTime,
  preferredEndTime,
  onSetActivePartition,
  onAddPartition,
  onDiscardPartition,
  onSetStartTime,
  onSetEndTime,
  onSetDurationTime,
  onSetTravelToValue,
  onSetTravelFromValue,
  onSetPreferredStartTime,
  onSetPreferredEndTime,
  
  activeDay,
  onSwitchDay,
  onCopyConfig,
  onCopyToAll,
  daysDict,
}: TimeConfigStepProps) {
  const { colors, comfyColors, comfyFontColors } = useTheme();
  const styles = useMemo(() => createStyles(colors, comfyColors, comfyFontColors), [colors]);
  const totalActiveMinutes = partitions.reduce(
    (sum, p) => sum + p.durationTime + (p.travelTo ?? 0) + (p.travelFrom ?? 0),
    0
  );

  const otherConfiguredDays = configuredDays.filter(
    (day) => day !== activeDay
  );

  const visitedTabs = useRef<Set<DayOfWeek>>(new Set(activeDay ? [activeDay] : [])).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (activeDay) visitedTabs.add(activeDay);
  }, [activeDay, visitedTabs]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.stepTitle}>Configuración detallada</Text>
      <Text style={styles.stepSubtitle}>Ajusta los parámetros de horario para cada día</Text>

      {/* Day tabs */}
      {configuredDays.length > 1 && (
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsContainer}
            contentContainerStyle={styles.tabsContent}
          >
            {configuredDays.map((day) => {
              const isActive = day === activeDay;
              const isVisited = visitedTabs.has(day);
              const totalMin = getTotalMinutes(daysDict[day]);

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.tabButton,
                    isActive ? styles.tabButtonActive : styles.tabButtonInactive,
                  ]}
                  onPress={() => onSwitchDay(day)}
                >
                  {!isVisited && !isActive ? (
                    <Animated.View style={{ opacity: pulseAnim }}>
                      <Text style={styles.tabButtonText}>
                        {getDayAbbreviation(day)}
                      </Text>
                      <Text style={styles.tabButtonMinutes}>
                        {totalMin} min
                      </Text>
                    </Animated.View>
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.tabButtonText,
                          isActive && styles.tabButtonTextActive,
                        ]}
                      >
                        {getDayAbbreviation(day)}
                      </Text>
                      <Text
                        style={[
                          styles.tabButtonMinutes,
                          isActive && styles.tabButtonMinutesActive,
                        ]}
                      >
                        {totalMin} min
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={styles.dayConfigHeader}>
        <View style={styles.dayConfigTextBlock}>
          {(isFixed || isAnchor) && (
            <Text style={styles.dayConfigTitle}>
              {activeDay ? getDayAbbreviation(activeDay) : '—'}
            </Text>
          )}
          <Text style={styles.dayConfigSubtitle}>
            Duración total: {totalActiveMinutes} min
          </Text>
        </View>
      </View>

      {/* Copy tools */}
      {otherConfiguredDays.length > 0 && (
        <View style={styles.copyConfigSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.copyConfigRow}
          >
            <TouchableOpacity
              style={styles.copyAllButton}
              onPress={() =>
                Alert.alert(
                  "Aplicar a todos",
                  `¿Quieres aplicar la configuración de ${activeDay ?? 'este día'} a TODOS los demás días?`,
                  [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Aplicar", onPress: onCopyToAll },
                  ]
                )
              }
            >
              <Ionicons name="arrow-forward-circle-outline" size={14} color={comfyColors.green} style={{ marginRight: 4 }} />
              <Text style={styles.copyAllButtonText}>Aplicar a todos</Text>
            </TouchableOpacity>

            {otherConfiguredDays.map((day) => (
              <TouchableOpacity
                key={day}
                style={styles.copyDayButton}
                onPress={() =>
                  Alert.alert(
                    "Copiar horario",
                    `¿Quieres copiar la configuración de ${day} a ${activeDay ?? 'este día'}?`,
                    [
                      { text: "Cancelar", style: "cancel" },
                      { text: "Copiar", onPress: () => onCopyConfig(day) },
                    ]
                  )
                }
              >
                <Ionicons name="download-outline" size={14} color={colors.secondaryAccent} style={{ marginRight: 4 }} />
                <Text style={styles.copyDayButtonText}>{getDayAbbreviation(day)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <TimePartitionForm
        key={activeDay ?? 'default'}
        partitions={partitions}
        activePartitionIndex={activePartitionIndex}
        startTime={startTime}
        endTime={endTime}
        durationTimeValue={durationTimeValue}
        travelToValue={travelToValue}
        travelFromValue={travelFromValue}
        isFixed={isFixed}
        preferredStartTime={preferredStartTime}
        preferredEndTime={preferredEndTime}
        onSetActivePartition={onSetActivePartition}
        onAddPartition={onAddPartition}
        onDiscardPartition={onDiscardPartition}
        onSetStartTime={onSetStartTime}
        onSetEndTime={onSetEndTime}
        onSetDurationTime={onSetDurationTime}
        onSetTravelToValue={onSetTravelToValue}
        onSetTravelFromValue={onSetTravelFromValue}
        onSetPreferredStartTime={onSetPreferredStartTime}
        onSetPreferredEndTime={onSetPreferredEndTime}
      />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors, comfyColors: Record<string, string>, _comfyFontColors: Record<string, string>) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 16,
      gap: 16,
    },
    stepTitle: {
      color: colors.surface,
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    stepSubtitle: {
      color: colors.textTertiary,
      fontSize: 15,
      fontWeight: "600",
      marginTop: -10,
    },
    tabsWrapper: {
      marginVertical: 4,
    },
    tabsContainer: {
      flexDirection: "row",
    },
    tabsContent: {
      gap: 8,
      paddingBottom: 4,
    },
    tabButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 2,
      alignItems: "center",
      minWidth: 64,
    },
    tabButtonActive: {
      backgroundColor: colors.secondaryAccent,
      borderColor: colors.secondaryAccent,
    },
    tabButtonInactive: {
      backgroundColor: colors.cardBackground,
      borderColor: colors.cardBorder,
    },
    tabButtonText: {
      color: colors.iconPrimary,
      fontSize: 14,
      fontWeight: "800",
    },
    tabButtonTextActive: {
      color: colors.secondaryAccentText,
      fontWeight: "900",
    },
    tabButtonMinutes: {
      color: colors.textTertiary,
      fontSize: 11,
      fontWeight: "600",
      marginTop: 2,
    },
    tabButtonMinutesActive: {
      color: colors.secondaryAccentText,
    },
    dayConfigHeader: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.cardBackground,
      borderRadius: 24,
      padding: 16,
      gap: 16,
    },
    dayConfigTitle: {
      color: colors.surface,
      fontSize: 18,
      fontWeight: "900",
    },
    dayConfigTextBlock: {
      flex: 1,
    },
    dayConfigSubtitle: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: "800",
      marginTop: 2,
    },
    copyConfigSection: {
      marginBottom: 4,
    },
    copyConfigRow: {
      flexDirection: "row",
      gap: 8,
      paddingBottom: 4,
    },
    copyAllButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: `${comfyColors.green}20`,
      borderWidth: 2,
      borderColor: comfyColors.green,
    },
    copyAllButtonText: {
      color: comfyColors.green,
      fontSize: 13,
      fontWeight: "800",
    },
    copyDayButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: colors.cardBackground,
      borderWidth: 2,
      borderColor: colors.cardBorder,
    },
    copyDayButtonText: {
      color: colors.surface,
      fontSize: 13,
      fontWeight: "800",
    },
  });
}
