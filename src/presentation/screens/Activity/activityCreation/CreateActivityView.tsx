import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { DayOfWeek } from "../../../../domain/entities/Activity";
import { calculateEndTime } from "../../../utils/timeUtils";
import { Theme } from "../../../components/theme/colors";
import { useActivityStore } from "../../../../di/Dependencies";

import useFrequency from "../../../hooks/useFrequency";
import useTimeForm from "../../../hooks/useTimeForm";

import ProgressIndicator from "../../../components/atoms/CreateActivity/ProgressIndicator";
import NameIdentityStep from "../../../components/organisms/CreateActivity/NameIdentityStep";
import DaySelectionStep from "../../../components/organisms/CreateActivity/DaySelectionStep";
import TimeConfigStep from "../../../components/organisms/CreateActivity/TimeConfigStep";
import SummaryStep from "../../../components/organisms/CreateActivity/SummaryStep";

const TOTAL_STEPS = 4;
const SHEET_HEIGHT = Dimensions.get("window").height * 0.88;
const DISMISS_DISTANCE = 130;

const WEEKDAY_ORDER: DayOfWeek[] = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

export default function CreateActivityView({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { activities } = useActivityStore();
  const activityIdParam = route.params?.activityId;

  const existingActivity = useMemo(() => {
    if (!activityIdParam) return null;
    return activities.find(a => a.id === activityIdParam) || null;
  }, [activityIdParam, activities]);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDay, setActiveDay] = useState<DayOfWeek | null>(null);
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, SHEET_HEIGHT],
    outputRange: [1, 0],
  });

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 22,
      stiffness: 180,
      mass: 0.9,
    }).start();
  }, [translateY]);

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => navigation.goBack());
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > DISMISS_DISTANCE || gesture.vy > 0.8) {
          closeSheet();
          return;
        }
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 180,
        }).start();
      },
    }),
  ).current;

  const showAlert = (text: string) => {
    Alert.alert("Atención", text);
  };

  const {
    selectedDays,
    editingGroupId,
    daysDict,
    groups,
    handleSelect,
    isDayConfigured,
    handleUpdateFrequency,
    handleEditGroup,
    handleDiscardGroup,
    setEditingGroupId,
    setSelectedDays,
    setDaysDict,
    setNextGroupId,
    nextGroupId,
  } = useFrequency();

  const {
    activityId,
    setActivityId,
    activityName,
    isFixed,
    identity,
    priority,
    difficulty,
    deadline,
    durationTimeValue,
    travelToValue,
    travelFromValue,
    startTime,
    endTime,
    partitions,
    activePartitionIndex,
    preferredStartTime,
    preferredEndTime,
    optionalDay,
    dayFrom,
    dayTo,
    isAnchor,
    setActivityName,
    setIsFixed,
    setIdentity,
    setPriority,
    setDifficulty,
    setDeadline,
    setDurationTime,
    setTravelToValue,
    setTravelFromValue,
    validatePartitions,
    validateOverlapWithSchedule,
    handleSaveActivity,
    setPartitions,
    setActivePartitionIndex,
    setStartTime,
    setEndTime,
    handleAddPartition,
    handleDiscardPartition,
    resetPartitions,
    setPreferredStartTime,
    setPreferredEndTime,
    setOptionalDay,
    setDayFrom,
    setDayTo,
    setIsAnchor,
  } = useTimeForm();

  // Load existing activity for editing
  useEffect(() => {
    if (existingActivity) {
      const act = existingActivity;
      setActivityId(act.id);
      setActivityName(act.title);
      setIsFixed(act.isFixed());
      setIdentity(act.identity);
      setPriority(act.priority === 5 ? "alta" : act.priority === 3 ? "media" : "baja");
      setDifficulty(act.difficulty);
      setDeadline(act.deadline ? new Date(act.deadline) : null);
      setPreferredStartTime(act.preferredStartTime ?? null);
      setPreferredEndTime(act.preferredEndTime ?? null);
      setOptionalDay(act.optionalDay ?? false);
      setDayFrom(act.dayFrom ?? null);
      setDayTo(act.dayTo ?? null);
      setIsAnchor(act.isAnchor ?? false);
      setDaysDict(act.daysConfig || {});
      
      const configured = Object.keys(act.daysConfig || {}) as DayOfWeek[];
      setSelectedDays(configured);

      const maxGroupId = Math.max(...Object.values(act.daysConfig || {}).map((cfg: any) => cfg?.groupId ?? 0), 0);
      setNextGroupId(maxGroupId + 1);
    }
  }, [existingActivity]);

  // Synchronize optionalDay, isAnchor, and dayRange variables based on activity type and anchor choice
  useEffect(() => {
    setDayFrom(null);
    setDayTo(null);
    if (!isFixed) {
      setOptionalDay(!isAnchor);
    } else {
      setOptionalDay(false);
    }
  }, [isAnchor, isFixed]);

  const configuredDays = useMemo(
    () => (Object.keys(daysDict) as DayOfWeek[]).sort(
      (a, b) => WEEKDAY_ORDER.indexOf(a) - WEEKDAY_ORDER.indexOf(b)
    ),
    [daysDict],
  );

  const totalMinutes = useMemo(
    () =>
      configuredDays.reduce((total, day) => {
        const config = daysDict[day];
        if (!config) return total;
        return (
          total +
          config.partitions.reduce(
            (sum, partition) =>
              sum + partition.durationTime + (partition.travelTo ?? 0) + (partition.travelFrom ?? 0),
            0,
          )
        );
      }, 0),
    [configuredDays, daysDict],
  );

  // Sync partitions AND preferred times for the ACTIVE DAY only
  useEffect(() => {
    if (step === 3 && activeDay !== null) {
      setDaysDict(prev => {
        const next = { ...prev };
        if (!isFixed && !isAnchor) {
          // Sync to all days for pure flexible activities
          (Object.keys(next) as DayOfWeek[]).forEach(day => {
            next[day] = {
              ...next[day]!,
              partitions: [...partitions],
              preferredStartTime: preferredStartTime,
              preferredEndTime: preferredEndTime,
            };
          });
        } else {
          // Sync only to active day for fixed AND anchor activities
          const current = next[activeDay];
          if (current) {
            next[activeDay] = {
              ...current,
              partitions: [...partitions],
              preferredStartTime: preferredStartTime,
              preferredEndTime: preferredEndTime,
            };
          }
        }
        return next;
      });
    }
  }, [partitions, preferredStartTime, preferredEndTime, activeDay, step, isFixed, isAnchor]);

  const handleContinueFromDays = () => {
    let currentSelected = [...selectedDays];
    if (!isFixed && !isAnchor && currentSelected.length === 0) {
      currentSelected = [...WEEKDAY_ORDER];
    }

    if (currentSelected.length === 0) {
      showAlert("Selecciona al menos un día para la actividad");
      return;
    }

    setSelectedDays(currentSelected);

    const next = { ...daysDict };
    
    // 1. Remove days not in currentSelected
    (Object.keys(next) as DayOfWeek[]).forEach((day) => {
      if (!currentSelected.includes(day)) {
        delete next[day];
      }
    });

    // 2. Add newly selected days
    const newDays = currentSelected.filter((day) => !next[day]);
    let updatedNextGroupId = nextGroupId;
    if (newDays.length > 0) {
      const existingDay = (Object.keys(next) as DayOfWeek[])[0];
      const existingConfig = existingDay ? next[existingDay] : null;

      const defaultPartitions = existingConfig && !isFixed
        ? existingConfig.partitions.map(p => ({ ...p, startHour: new Date(p.startHour), endHour: new Date(p.endHour) }))
        : [
            {
              startHour: new Date(),
              endHour: calculateEndTime(new Date(), 60),
              durationTime: 60,
              travelTo: null,
              travelFrom: null,
            },
          ];

      const prefStart = existingConfig && !isFixed ? existingConfig.preferredStartTime : undefined;
      const prefEnd = existingConfig && !isFixed ? existingConfig.preferredEndTime : undefined;

      newDays.forEach((day) => {
        next[day] = {
          partitions: defaultPartitions,
          groupId: (isFixed || isAnchor) ? updatedNextGroupId : (existingConfig?.groupId ?? updatedNextGroupId),
          preferredStartTime: prefStart,
          preferredEndTime: prefEnd,
        };
        if (isFixed || isAnchor) {
          updatedNextGroupId++;
        }
      });
      if (!isFixed && !isAnchor && newDays.length > 0 && !existingConfig) {
        updatedNextGroupId++;
      }
      setNextGroupId(updatedNextGroupId);
    }

    setDaysDict(next);

    // 3. Select the first day as active
    const firstDay = (Object.keys(next) as DayOfWeek[])[0];
    const firstConfig = firstDay ? next[firstDay] : undefined;
    if (firstDay && firstConfig) {
      setActiveDay(firstDay);
      setPartitions(firstConfig.partitions);
      setPreferredStartTime(firstConfig.preferredStartTime ?? null);
      setPreferredEndTime(firstConfig.preferredEndTime ?? null);
      setActivePartitionIndex(0);
    }

    setStep(3);
  };

  const handleCopyConfig = (fromDay: DayOfWeek) => {
    const sourceConfig = daysDict[fromDay];
    if (sourceConfig) {
      const clonedPartitions = sourceConfig.partitions.map((p) => ({
        ...p,
        startHour: new Date(p.startHour),
        endHour: new Date(p.endHour),
      }));
      setPartitions(clonedPartitions);
      setPreferredStartTime(sourceConfig.preferredStartTime ?? null);
      setPreferredEndTime(sourceConfig.preferredEndTime ?? null);
      setActivePartitionIndex(0);
    }
  };

  const handleSwitchDay = (day: DayOfWeek) => {
    setActiveDay(day);
    const config = daysDict[day];
    if (config) {
      setPartitions(config.partitions);
      setPreferredStartTime(config.preferredStartTime ?? null);
      setPreferredEndTime(config.preferredEndTime ?? null);
      setActivePartitionIndex(0);
    }
  };

  const handleCopyToAll = () => {
    if (!activeDay) return;
    const sourceConfig = daysDict[activeDay];
    if (!sourceConfig) return;

    const clonedPartitions = sourceConfig.partitions.map((p) => ({
      ...p,
      startHour: new Date(p.startHour),
      endHour: new Date(p.endHour),
    }));

    setDaysDict(prev => {
      const next = { ...prev };
      (Object.keys(next) as DayOfWeek[]).forEach(day => {
        if (day !== activeDay) {
          next[day] = {
            ...next[day]!,
            partitions: [...clonedPartitions],
            preferredStartTime: sourceConfig.preferredStartTime ?? null,
            preferredEndTime: sourceConfig.preferredEndTime ?? null,
          };
        }
      });
      return next;
    });
  };

  const handlePrimaryPress = () => {
    if (step === 1) {
      if (!activityName.trim()) {
        showAlert("Ingresa un nombre para la actividad");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      handleContinueFromDays();
      return;
    }

    if (step === 3) {
      // Validate all partitions and overlaps before leaving Step 3
      const daysToValidate = (isFixed || isAnchor) ? configuredDays : [configuredDays[0] || 'Lunes'];
      for (const day of daysToValidate) {
        const config = daysDict[day]!;
        if (!validatePartitions(config.partitions, [day])) {
          setActiveDay(day);
          setPartitions(config.partitions);
          setPreferredStartTime(config.preferredStartTime ?? null);
          setPreferredEndTime(config.preferredEndTime ?? null);
          return;
        }
        if (
          !validateOverlapWithSchedule(
            activityId,
            isFixed,
            [day],
            config.partitions,
            config.preferredStartTime ?? preferredStartTime,
            config.preferredEndTime ?? preferredEndTime,
            durationTimeValue,
          )
        ) {
          setActiveDay(day);
          setPartitions(config.partitions);
          setPreferredStartTime(config.preferredStartTime ?? null);
          setPreferredEndTime(config.preferredEndTime ?? null);
          return;
        }
      }
      setStep(4);
      return;
    }

    if (step === 4) {
      handleCreate();
      return;
    }
  };

  const handleBackPress = () => {
    if (step === 4) {
      setStep(3);
    } else if (step === 3) {
      setStep(2);
    } else {
      setStep((s) => Math.max(s - 1, 1));
    }
  };

  const handleCreate = async () => {
    if (!activityName.trim()) {
      showAlert("Ingresa un nombre para la actividad");
      setStep(1);
      return;
    }

    if (configuredDays.length === 0) {
      showAlert("Configura al menos un día antes de crear la actividad");
      setStep(2);
      return;
    }

    // Validate partitions and overlaps
    const daysToValidate = (isFixed || isAnchor) ? configuredDays : [configuredDays[0] || 'Lunes'];
    for (const day of daysToValidate) {
      const config = daysDict[day]!;
      if (!validatePartitions(config.partitions, [day])) {
        setStep(3);
        setActiveDay(day);
        setPartitions(config.partitions);
        setPreferredStartTime(config.preferredStartTime ?? null);
        setPreferredEndTime(config.preferredEndTime ?? null);
        return;
      }
      if (
        !validateOverlapWithSchedule(
          activityId,
          isFixed,
          [day],
          config.partitions,
          config.preferredStartTime ?? preferredStartTime,
          config.preferredEndTime ?? preferredEndTime,
          durationTimeValue,
        )
      ) {
        setStep(3);
        setActiveDay(day);
        setPartitions(config.partitions);
        setPreferredStartTime(config.preferredStartTime ?? null);
        setPreferredEndTime(config.preferredEndTime ?? null);
        return;
      }
    }

    setIsLoading(true);
    try {
      await handleSaveActivity({
        daysDict,
        selectedDays,
      });
      closeSheet();
    } catch (e) {
      console.error("Error saving activity:", e);
      showAlert("Hubo un error al guardar la actividad. Por favor intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };





  const handleEditGroupWrapper = (group: {
    groupId: number;
    days: DayOfWeek[];
    config: any;
  }) => {
    handleEditGroup({
      ...group,
      setPartitions,
      setActivePartitionIndex,
    });
    if (group.days.length > 0) {
      const firstConfig = daysDict[group.days[0]];
      if (firstConfig) {
        setPreferredStartTime(firstConfig.preferredStartTime ?? null);
        setPreferredEndTime(firstConfig.preferredEndTime ?? null);
      }
      setActiveDay(group.days[0]);
    }
    setStep(3);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <NameIdentityStep
            activityName={activityName}
            identity={identity}
            isFixed={isFixed}
            difficulty={difficulty}
            priority={priority}
            deadline={deadline}
            onSetActivityName={setActivityName}
            onSetIdentity={setIdentity}
            onSetIsFixed={setIsFixed}
            onSetDifficulty={setDifficulty}
            onSetPriority={setPriority}
            onSetDeadline={setDeadline}
            isAnchor={isAnchor}
            onToggleAnchor={setIsAnchor}
          />
        );
      case 2:
        return (
          <DaySelectionStep
            selectedDays={selectedDays}
            daysDict={daysDict}
            configuredDaysCount={configuredDays.length}
            isFixed={isFixed}
            isAnchor={isAnchor}
            onSelectDay={handleSelect}
            isDayConfigured={isDayConfigured}
          />
        );
      case 3:
        return (
          <TimeConfigStep
            configuredDays={(isFixed || isAnchor) ? configuredDays : [configuredDays[0] || 'Lunes']}
            partitions={partitions}
            activePartitionIndex={activePartitionIndex}
            startTime={startTime}
            endTime={endTime}
            durationTimeValue={durationTimeValue}
            travelToValue={travelToValue}
            travelFromValue={travelFromValue}
            isFixed={isFixed}
            isAnchor={isAnchor}
            preferredStartTime={preferredStartTime}
            preferredEndTime={preferredEndTime}
            onSetActivePartition={setActivePartitionIndex}
            onAddPartition={handleAddPartition}
            onDiscardPartition={handleDiscardPartition}
            onSetStartTime={setStartTime}
            onSetEndTime={setEndTime}
            onSetDurationTime={setDurationTime}
            onSetTravelToValue={setTravelToValue}
            onSetTravelFromValue={setTravelFromValue}
            onSetPreferredStartTime={setPreferredStartTime}
            onSetPreferredEndTime={setPreferredEndTime}
            activeDay={(isFixed || isAnchor) ? activeDay : (configuredDays[0] || 'Lunes')}
            onSwitchDay={handleSwitchDay}
            onCopyConfig={handleCopyConfig}
            onCopyToAll={handleCopyToAll}
            daysDict={daysDict}
          />
        );
      default:
        return (
          <SummaryStep
            activityName={activityName}
            isFixed={isFixed}
            isAnchor={isAnchor}
            identity={identity}
            priority={priority}
            difficulty={difficulty}
            deadline={deadline}
            configuredDays={configuredDays}
            totalMinutes={totalMinutes}
            groups={groups}
            editingGroupId={editingGroupId}
            onEditGroup={handleEditGroupWrapper}
            onDiscardGroup={(gid) => {
              const groupDays = groups[gid]?.days || [];
              handleDiscardGroup(gid);
              setSelectedDays(prev => prev.filter(d => !groupDays.includes(d)));
              if (activeDay && groupDays.includes(activeDay)) {
                setActiveDay(null);
              }
            }}
          />
        );
    }
  };

  const primaryTitle = useMemo(() => {
    switch (step) {
      case 1:
        return "Continuar";
      case 2:
        return "Continuar a Horarios";
      case 3:
        return "Ver resumen";
      case 4:
        return activityId ? "Guardar cambios" : "Crear actividad";
      default:
        return "Continuar";
    }
  }, [step, activityId]);

  const headerTitle = useMemo(() => {
    if (activityId) return "Editar Actividad";
    return "Nueva Actividad";
  }, [activityId]);

  const headerSubtitle = useMemo(() => {
    return `Paso ${step} de ${TOTAL_STEPS}`;
  }, [step]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} pointerEvents="auto">
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      </Animated.View>
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.dragArea} {...panResponder.panHandlers}>
          <View style={styles.dragHandle} />
        </View>

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{headerTitle}</Text>
            {headerSubtitle && <Text style={styles.stepText}>{headerSubtitle}</Text>}
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={closeSheet}>
            <Ionicons
              name="close"
              size={32}
              color={Theme.comfyFontColors.green}
            />
          </TouchableOpacity>
        </View>

        <ProgressIndicator totalSteps={TOTAL_STEPS} currentStep={step} />

        {renderStep()}

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          {step > 1 && (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                step === 2 && { flex: 1 }
              ]}
              onPress={handleBackPress}
            >
              <Text style={styles.secondaryButtonText}>Atrás</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              step > 1 && styles.primaryButtonWithBack,
            ]}
            onPress={handlePrimaryPress}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.primaryButtonText}>{primaryTitle}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#5665dc" />
          <Text style={styles.loadingText}>Guardando actividad...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 11, 18, 0.62)",
  },
  sheet: {
    height: SHEET_HEIGHT,
    backgroundColor: Theme.colors.screenBackground,
    borderTopLeftRadius: 54,
    borderTopRightRadius: 54,
    paddingTop: 10,
    overflow: "hidden",
  },
  dragArea: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 16,
  },
  dragHandle: {
    width: 64,
    height: 6,
    borderRadius: 999,
    backgroundColor: Theme.colors.cardBorder,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  title: {
    color: Theme.colors.surface,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -1,
  },
  stepText: {
    color: "#8dccff",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Theme.comfyColors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Theme.comfyColors.green,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  primaryButtonWithBack: {
    flex: 2,
  },
  primaryButtonText: {
    color: Theme.comfyFontColors.green,
    fontSize: 18,
    fontWeight: "900",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  secondaryButtonText: {
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "900",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 11, 18, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  loadingText: {
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 12,
  },

  // NL Parse Section
  nlContainer: {
    marginBottom: 8,
  },
  nlInputRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
  },
  nlTextInputWrapper: {
    flex: 1,
  },
  nlTextInput: {
    borderWidth: 2,
    borderColor: Theme.colors.cardBorder,
    borderRadius: 20,
    backgroundColor: Theme.colors.cardBackground,
    color: Theme.colors.surface,
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 16,
    minHeight: 200,
    textAlignVertical: "center",
  },
  nlParseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#5665dc",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 56,
  },
  nlParseButtonDisabled: {
    opacity: 0.5,
  },
  nlParseButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
  nlErrorBanner: {
    backgroundColor: "rgba(255, 107, 107, 0.12)",
    borderWidth: 1,
    borderColor: "#ff6b6b",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  nlErrorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nlErrorText: {
    flex: 1,
    color: Theme.colors.surface,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  nlErrorActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  nlRetryButton: {
    backgroundColor: "#5665dc",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  nlRetryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
  nlDismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

});
