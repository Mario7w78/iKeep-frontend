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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { DayOfWeek } from "../../../../domain/entities/Activity";
import { Theme } from "../../../components/theme/colors";
import PopUpAlert from "../../../components/atoms/Common/PopUpAlert";

import useFrequency from "../../../hooks/useFrequency";
import useTimeForm from "../../../hooks/useTimeForm";

import ProgressIndicator from "../../../components/atoms/CreateActivity/ProgressIndicator";
import NameIdentityStep from "../../../components/organisms/CreateActivity/NameIdentityStep";
import PriorityDeadlineStep from "../../../components/organisms/CreateActivity/PriorityDeadlineStep";
import DaySelectionStep from "../../../components/organisms/CreateActivity/DaySelectionStep";
import TimeConfigStep from "../../../components/organisms/CreateActivity/TimeConfigStep";
import SummaryStep from "../../../components/organisms/CreateActivity/SummaryStep";

const TOTAL_STEPS = 5;
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
  const [shouldPopUpAlert, setShouldPopUpAlert] = useState(false);
  const [alertText, setAlertText] = useState("");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
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
    setAlertText(text);
    setShouldPopUpAlert(true);
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
  } = useTimeForm();

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
      setDaysDict(act.daysConfig || {});
      
      const maxGroupId = Math.max(...Object.values(act.daysConfig || {}).map((cfg: any) => cfg?.groupId ?? 0), 0);
      setNextGroupId(maxGroupId + 1);
    }
  }, [route.params?.activity]);

  const displayTotal = isFixed ? 4 : 5;
  const displayStep = useMemo(() => {
    if (!isFixed) return step;
    if (step === 1) return 1;
    return step - 1; // skips step 2 (Priority & Deadline) when fixed
  }, [step, isFixed]);

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

  const handlePrimaryPress = () => {
    if (step === 1) {
      if (!activityName.trim()) {
        showAlert("Ingresa un nombre para la actividad");
        return;
      }
      setStep(isFixed ? 3 : 2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    if (step === 3) {
      if (selectedDays.length > 0) {
        setStep(4);
      } else if (configuredDays.length > 0) {
        setStep(5);
      } else {
        showAlert("Selecciona al menos un día para la actividad");
      }
      return;
    }

    if (step === 4) {
      if (
        !validatePartitions(
          partitions,
          selectedDays,
          setAlertText,
          setShouldPopUpAlert,
        )
      ) {
        return;
      }
      if (
        !validateOverlapWithSchedule(
          activityId,
          isFixed,
          selectedDays,
          partitions,
          preferredStartTime,
          preferredEndTime,
          durationTimeValue,
          setAlertText,
          setShouldPopUpAlert,
        )
      ) {
        return;
      }
      const wasEditing = editingGroupId !== null;
      const hadConfiguredDays = configuredDays.length > 0;
      handleUpdateFrequency({ partitions });
      resetPartitions();
      setSelectedDays([]);
      setEditingGroupId(null);
      
      if (wasEditing) {
        setStep(5);
      } else if (hadConfiguredDays) {
        setStep(3);
      } else {
        setStep(5);
      }
      return;
    }

    if (step === 5) {
      handleCreate();
      return;
    }
  };

  const handleBackPress = () => {
    if (step === 5) {
      setStep(3);
    } else if (step === 4) {
      setEditingGroupId(null);
      setSelectedDays([]);
      resetPartitions();
      setStep(3);
    } else if (step === 3 && isFixed) {
      setStep(1);
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
      setStep(3);
      return;
    }

    if (selectedDays.length > 0) {
      showAlert(`Guarda la configuración de: ${selectedDays.join(", ")}`);
      setStep(4);
      return;
    }

    // Validate partitions and overlaps
    for (const day of configuredDays) {
      const config = daysDict[day]!;
      if (
        !validatePartitions(
          config.partitions,
          [day],
          setAlertText,
          setShouldPopUpAlert,
        )
      ) {
        setStep(4);
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
          setAlertText,
          setShouldPopUpAlert,
        )
      ) {
        setStep(4);
        return;
      }
    }

    // Validate preferred window
    if (preferredStartTime !== null && preferredEndTime !== null) {
      if (preferredEndTime - preferredStartTime < durationTimeValue) {
        showAlert(
          "La ventana seleccionada es más corta que la duración estimada de la actividad."
        );
        setStep(4);
        return;
      }
    }

    setIsLoading(true);
    try {
      await handleSaveActivity({
        daysDict,
        selectedDays,
        setAlertText,
        setShouldPopUpAlert,
      });
      navigation.navigate("MainTabs", { screen: "Schedule" });
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
    setStep(4);
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
            onSetActivityName={setActivityName}
            onSetIdentity={setIdentity}
            onSetIsFixed={setIsFixed}
            onSetDifficulty={setDifficulty}
          />
        );
      case 2:
        return (
          <PriorityDeadlineStep
            priority={priority}
            deadline={deadline}
            isFixed={isFixed}
            onSetPriority={setPriority}
            onSetDeadline={setDeadline}
          />
        );
      case 3:
        return (
          <DaySelectionStep
            selectedDays={selectedDays}
            daysDict={daysDict}
            groups={groups}
            editingGroupId={editingGroupId}
            configuredDaysCount={configuredDays.length}
            isFixed={isFixed}
            onSelectDay={handleSelect}
            isDayConfigured={isDayConfigured}
            onEditGroup={handleEditGroupWrapper}
            onDiscardGroup={(gid) => {
              handleDiscardGroup(gid);
              if (editingGroupId === gid) resetPartitions();
            }}
          />
        );
      case 4:
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
              handleDiscardGroup(gid);
              if (editingGroupId === gid) resetPartitions();
            }}
          />
        );
    }
  };

  const primaryTitle = useMemo(() => {
    switch (step) {
      case 1:
      case 2:
        return "Continuar";
      case 3:
        return selectedDays.length > 0 ? "Configurar horario para estos días" : "Ver resumen";
      case 4:
        if (editingGroupId !== null) {
          return "Guardar cambios";
        }
        return configuredDays.length > 0 ? "Guardar y configurar otro día" : "Guardar y ver resumen";
      case 5:
        return activityId ? "Guardar cambios" : "Crear actividad";
      default:
        return "Continuar";
    }
  }, [step, selectedDays, configuredDays, editingGroupId, activityId]);

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
              Paso {displayStep} de {displayTotal}
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

        <ProgressIndicator totalSteps={displayTotal} currentStep={displayStep} />

        {renderStep()}

        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.secondaryButton}
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
              {primaryTitle === "Guardar y configurar otro día" && (
                <Ionicons name="refresh-outline" size={20} color={Theme.colors.surface} />
              )}
              <Text style={styles.primaryButtonText}>{primaryTitle}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <PopUpAlert
        text={alertText}
        isVisible={shouldPopUpAlert}
        onClose={() => setShouldPopUpAlert(false)}
      />

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
