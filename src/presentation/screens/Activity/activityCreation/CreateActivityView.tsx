import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { PrimaryButton } from "../../../components/atoms/Common/PrimaryButton";
import { InputHeader } from "../../../components/molecules/Header/InputHeader";
import { FrecuencySelector } from "../../../components/organisms/Time/FrecuencySelector";
import { HourSection } from "../../../components/organisms/Time/HourSection";
import { TimeSection } from "../../../components/organisms/Time/TimeSection";
import { DayOfWeek } from "../../../../domain/entities/Activity";
import { Theme, GROUP_COLORS } from "../../../components/theme/colors";
import PopUpAlert from "../../../components/atoms/Common/PopUpAlert";
import SplitActivityButton from "../../../components/molecules/Time/SplitActivityButton";

import useFrecuency from "../../../hooks/useFrecuency";
import useTimeForm from "../../../hooks/useTimeForm";
import { DayConfig } from "../../../hooks/props";

export default function CreateActivityView({ navigation }: any) {
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [shouldPopUpAlert, setShouldPopUpAlert] = useState(false);
  const [alertText, setAlertText] = useState("");
  const [flashTrigger, setFlashTrigger] = useState(0);

  const triggerFlash = () => setFlashTrigger((prev) => prev + 1);

  const options: DayOfWeek[] = [
    "Lunes",
    "Martes",
    "Miercoles",
    "Jueves",
    "Viernes",
    "Sabado",
    "Domingo",
  ];
  const {
    selectedDays,
    editingGroupId,
    daysDict,
    groups,
    handleSelect,
    isDayConfigured,
    handleUpdateFrecuency,
    handleEditGroup,
  } = useFrecuency();
  const {
    activityName,
    isFixed,
    selectedTimeTypeDuration,
    selectedTimeTypeTravel,
    durationTimeValue,
    travelTimeValue,
    startTime,
    endTime,
    partitions,
    activePartitionIndex,
    setActivityName,
    setIsFixed,
    setSelectedTypeDuration,
    setSelectedTimeTypeTravel,
    setDurationTime,
    setTravelTime,
    setStartTime,
    handleAddGeneric,
    handleSubGeneric,
    updateTime,
    handleSaveActivity,
    setPartitions,
    setActivePartitionIndex,
    handleAddPartition,
    resetPartitions,
  } = useTimeForm();

  return (
    <View style={styles.container}>
      <InputHeader
        value={activityName}
        onChangeText={setActivityName}
        onClose={() => navigation.goBack()}
      />
      <View style={styles.formContainerBackground}>
        <ScrollView
          style={styles.scrollForm}
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled
        >
          <View style={styles.frecuencySection}>
            <FrecuencySelector
              days={options}
              selectedValue={
                selectedDays.length === options.length
                  ? [...selectedDays, "Diario"]
                  : selectedDays
              }
              onSelect={handleSelect}
              configuredDays={options.filter(isDayConfigured)}
              dayColors={Object.fromEntries(
                (Object.entries(daysDict) as [DayOfWeek, DayConfig][]).map(
                  ([day, cfg]) => [
                    day,
                    GROUP_COLORS[cfg.groupId % GROUP_COLORS.length].bg,
                  ],
                ),
              )}
              editingGroupId={editingGroupId!}
              handleUpdateFrecuency={() => {
                handleUpdateFrecuency({
                  partitions: partitions,
                });
                resetPartitions();
              }}
              selectedDays={selectedDays}
            />
            {Object.keys(groups).length > 0 && (
              <View style={styles.groupsContainer}>
                {Object.entries(groups).map(([gidStr, { days, config }]) => {
                  const gid = Number(gidStr);
                  const color = GROUP_COLORS[gid % GROUP_COLORS.length];
                  const isEditing = editingGroupId === gid;
                  return (
                    <TouchableOpacity
                      key={gid}
                      onPress={() => {
                        handleEditGroup({
                          groupId: gid,
                          days: days,
                          config: config,
                          setPartitions: setPartitions,
                          setActivePartitionIndex: setActivePartitionIndex,
                        });
                        triggerFlash();
                      }}
                      style={[
                        styles.groupTag,
                        { backgroundColor: color.bg, borderColor: color.text },
                        isEditing && styles.groupTagEditing,
                      ]}
                    >
                      <Text
                        style={[styles.groupTagDays, { color: color.text }]}
                      >
                        {days.map((d) => d.substring(0, 3)).join(" · ")}
                      </Text>
                      {config.partitions.map((p, idx) => (
                        <Text
                          key={idx}
                          style={[styles.groupTagInfo, { color: color.text }]}
                        >
                          {p.startHour.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {"  ·  "}
                          {p.durationTime} min
                          {p.travelTime > 0
                            ? `  ·  +${p.travelTime} traslado`
                            : ""}
                        </Text>
                      ))}
                      {isEditing && (
                        <Text
                          style={[
                            styles.groupTagEditing2,
                            { color: color.text },
                          ]}
                        >
                          editando...
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
          <SplitActivityButton
            partitions={partitions}
            activeIndex={activePartitionIndex}
            onSelect={(idx) => {
              setActivePartitionIndex(idx);
              triggerFlash();
            }}
            onAdd={handleAddPartition}
          />
          <HourSection
            isFixed={isFixed}
            onResponderRelease={() => setScrollEnabled(true)}
            onStartResponderCapture={() => {
              setScrollEnabled(false);
              return false;
            }}
            setIsFixed={setIsFixed}
            updateTime={updateTime}
            time={startTime}
            flashTrigger={flashTrigger}
          />
          <TimeSection
            durationTimeValue={durationTimeValue}
            travelTimeValue={travelTimeValue}
            selectedTimeTypeDuration={selectedTimeTypeDuration}
            selectedTimeTypeTravel={selectedTimeTypeTravel}
            setSelectedTypeDuration={setSelectedTypeDuration}
            setSelectedTimeTypeTravel={setSelectedTimeTypeTravel}
            onAddDuration={() =>
              handleAddGeneric(setDurationTime, selectedTimeTypeDuration)
            }
            onAddTravel={() =>
              handleAddGeneric(setTravelTime, selectedTimeTypeTravel)
            }
            onSubstractDuration={() =>
              handleSubGeneric(setDurationTime, selectedTimeTypeDuration)
            }
            onSubstractTravel={() =>
              handleSubGeneric(setTravelTime, selectedTimeTypeTravel)
            }
          />
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            selectedDays.length === 0 && styles.saveButtonDisabled,
          ]}
          onPress={() => {
            handleUpdateFrecuency({
              partitions: partitions,
            });
            resetPartitions();
          }}
          disabled={selectedDays.length === 0}
        >
          <Text style={styles.saveButtonText}>
            {editingGroupId !== null ? "Actualizar hora" : "Guardar hora"}
          </Text>
        </TouchableOpacity>

        <PrimaryButton
          title="Listo"
          onPress={() => {
            handleSaveActivity({
              daysDict,
              selectedDays,
              setAlertText,
              setShouldPopUpAlert,
            });
            navigation.goBack();
          }}
          
        />
      </View>

      <PopUpAlert
        text={alertText}
        isVisible={shouldPopUpAlert}
        onClose={() => setShouldPopUpAlert(false)}
      />
    </View>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  formContainerBackground: {
    flex: 1,
  },
  scrollForm: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 20,
    gap: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 30,
    paddingTop: 10,
  },
  labelSmall: {
    fontSize: 20,
    color: Theme.colors.textSecondary,
    fontWeight: "700",
  },
  frecuencySection: {
    flexDirection: "column",
    backgroundColor: Theme.colors.lightBackground,
    borderRadius: Theme.generalBorder,
    padding: 20,
  },
  frecuencyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 15,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: Theme.colors.lightPrimary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: '45%',
    marginRight: 5
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: {
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  groupsContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    gap: 8,
  },
  groupTag: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 2,
  },
  groupTagEditing: { borderWidth: 2 },
  groupTagDays: {
    fontSize: 14,
    fontWeight: "700",
  },
  groupTagInfo: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.85,
  },
  groupTagEditing2: {
    fontSize: 11,
    fontWeight: "600",
    opacity: 0.7,
    marginTop: 2,
  },
  section: { width: "50%" },
  timeSection: {
    flexDirection: "column",
    backgroundColor: Theme.colors.lightBackground,
    borderRadius: Theme.generalBorder,
    padding: 20,
  },
  timeInnerSection: { flexDirection: "row" },
  inputSection: {
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  iconContainer: {
    backgroundColor: Theme.colors.border,
    borderRadius: 7,
    width: 25,
    height: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  icon2Container: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 7,
    width: 35,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 20,
    color: Theme.colors.textSecondary,
    fontWeight: "700",
  },
  subLabelSmall: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    fontWeight: "700",
  },
  descriptionLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: "700",
  },
  messages: {
    fontSize: 15,
    color: Theme.colors.textSecondary,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 20,
  },
});
