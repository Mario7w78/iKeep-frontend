import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { DayOfWeek } from "../../../../domain/entities/Activity";
import { calculateEndTime, calculateDurationAcrossMidnight } from "../../../utils/timeUtils";
import { Theme } from "../../../components/theme/colors";

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
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
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
    travelTimeValue,
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
    setTravelTime,
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
    if (route.params?.activity) {
      const act = route.params.activity;
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
  }, [route.params?.activity]);

  // Mutual exclusion: anchor (día fijo), optionalDay (scheduler), y dayRange no pueden coexistir
  useEffect(() => {
    if (isAnchor) {
      setOptionalDay(false);
      setDayFrom(null);
      setDayTo(null);
    }
  }, [isAnchor]);

  useEffect(() => {
    if (optionalDay) {
      setIsAnchor(false);
      setDayFrom(null);
      setDayTo(null);
    }
  }, [optionalDay]);

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
              sum + partition.durationTime + partition.travelTime,
            0,
          )
        );
      }, 0),
    [configuredDays, daysDict],
  );

  // Sync active group's partitions in daysDict with useTimeForm's partitions state
  useEffect(() => {
    if (step === 3 && activeGroupId !== null) {
      setDaysDict(prev => {
        const next = { ...prev };
        const daysInActiveGroup = Object.keys(next).filter(
          (d) => next[d as DayOfWeek]?.groupId === activeGroupId
        ) as DayOfWeek[];

        if (daysInActiveGroup.length === 0) return prev;

        const firstDay = daysInActiveGroup[0];
        const currentPartitions = next[firstDay]?.partitions;
        if (JSON.stringify(currentPartitions) === JSON.stringify(partitions)) {
          return prev;
        }

        daysInActiveGroup.forEach((day) => {
          if (next[day]) {
            next[day] = {
              ...next[day]!,
              partitions: partitions,
            };
          }
        });
        return next;
      });
    }
  }, [partitions, activeGroupId, step]);

  const handleContinueFromDays = () => {
    if (selectedDays.length === 0) {
      showAlert("Selecciona al menos un día para la actividad");
      return;
    }

    const next = { ...daysDict };
    
    // 1. Remove days not in selectedDays
    (Object.keys(next) as DayOfWeek[]).forEach((day) => {
      if (!selectedDays.includes(day)) {
        delete next[day];
      }
    });

    // 2. Add newly selected days
    const newDays = selectedDays.filter((day) => !next[day]);
    let updatedNextGroupId = nextGroupId;
    if (newDays.length > 0) {
      const defaultPartitions = [
        {
          startHour: new Date(),
          endHour: calculateEndTime(new Date(), 60),
          durationTime: 60,
          travelTime: 0,
        },
      ];
      newDays.forEach((day) => {
        next[day] = {
          partitions: defaultPartitions,
          groupId: updatedNextGroupId,
        };
        updatedNextGroupId++;
      });
      setNextGroupId(updatedNextGroupId);
    }

    setDaysDict(next);

    // 3. Select the first group ID
    const firstConfig = Object.values(next)[0];
    if (firstConfig) {
      setActiveGroupId(firstConfig.groupId);
      setPartitions(firstConfig.partitions);
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
      setActivePartitionIndex(0);
    }
  };

  const handleSwitchGroup = (groupId: number) => {
    setActiveGroupId(groupId);
    const groupConfig = Object.values(daysDict).find((cfg) => cfg?.groupId === groupId);
    if (groupConfig) {
      setPartitions(groupConfig.partitions);
      setActivePartitionIndex(0);
    }
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
      for (const day of configuredDays) {
        const config = daysDict[day]!;
        if (!validatePartitions(config.partitions, [day])) {
          setActiveGroupId(config.groupId);
          setPartitions(config.partitions);
          return;
        }
        if (
          !validateOverlapWithSchedule(
            activityId,
            isFixed,
            [day],
            config.partitions,
            preferredStartTime,
            preferredEndTime,
            durationTimeValue,
          )
        ) {
          setActiveGroupId(config.groupId);
          setPartitions(config.partitions);
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
    for (const day of configuredDays) {
      const config = daysDict[day]!;
      if (!validatePartitions(config.partitions, [day])) {
        setStep(3);
        setActiveGroupId(config.groupId);
        setPartitions(config.partitions);
        return;
      }
      if (
        !validateOverlapWithSchedule(
          activityId,
          isFixed,
          [day],
          config.partitions,
          preferredStartTime,
          preferredEndTime,
          durationTimeValue,
        )
      ) {
        setStep(3);
        setActiveGroupId(config.groupId);
        setPartitions(config.partitions);
        return;
      }
    }

    // Validate preferred window
    if (preferredStartTime !== null && preferredEndTime !== null) {
      if (calculateDurationAcrossMidnight(preferredStartTime, preferredEndTime) < durationTimeValue) {
        showAlert(
          "La ventana seleccionada es más corta que la duración estimada de la actividad."
        );
        setStep(3);
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
    setActiveGroupId(group.groupId);
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
            optionalDay={optionalDay}
            onSelectDay={handleSelect}
            isDayConfigured={isDayConfigured}
            onToggleOptionalDay={setOptionalDay}
            dayFrom={dayFrom}
            dayTo={dayTo}
            onSetDayFrom={setDayFrom}
            onSetDayTo={setDayTo}
          />
        );
      case 3:
        return (
          <TimeConfigStep
            selectedDays={selectedDays}
            configuredDays={configuredDays}
            partitions={partitions}
            activePartitionIndex={activePartitionIndex}
            startTime={startTime}
            endTime={endTime}
            durationTimeValue={durationTimeValue}
            travelTimeValue={travelTimeValue}
            isFixed={isFixed}
            preferredStartTime={preferredStartTime}
            preferredEndTime={preferredEndTime}
            onSetActivePartition={setActivePartitionIndex}
            onAddPartition={handleAddPartition}
            onDiscardPartition={handleDiscardPartition}
            onSetStartTime={setStartTime}
            onSetEndTime={setEndTime}
            onSetDurationTime={setDurationTime}
            onSetTravelTime={setTravelTime}
            onSetPreferredStartTime={setPreferredStartTime}
            onSetPreferredEndTime={setPreferredEndTime}
            groups={groups}
            activeGroupId={activeGroupId}
            onSwitchGroup={handleSwitchGroup}
            onCopyConfig={handleCopyConfig}
          />
        );
      default:
        return (
          <SummaryStep
            activityName={activityName}
            isFixed={isFixed}
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
              if (activeGroupId === gid) {
                setActiveGroupId(null);
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
            <Text style={styles.title}>{activityId ? "Editar Actividad" : "Nueva Actividad"}</Text>
            <Text style={styles.stepText}>
              Paso {step} de {TOTAL_STEPS}
            </Text>
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

        <View style={styles.footer}>
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
});
