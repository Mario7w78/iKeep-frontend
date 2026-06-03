import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Theme } from "../../theme/colors";

type PriorityDeadlineStepProps = {
  priority: "baja" | "media" | "alta";
  deadline: Date | null;
  onSetPriority: (priority: "baja" | "media" | "alta") => void;
  onSetDeadline: (deadline: Date | null) => void;
};

export default function PriorityDeadlineStep({
  priority,
  deadline,
  onSetPriority,
  onSetDeadline,
}: PriorityDeadlineStepProps) {
  const [hasDeadline, setHasDeadline] = useState(deadline !== null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const toggleHasDeadline = (value: boolean) => {
    setHasDeadline(value);
    if (value) {
      onSetDeadline(new Date());
      setShowDatePicker(true);
    } else {
      onSetDeadline(null);
      setShowDatePicker(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionTitle}>Prioridad de la actividad</Text>
      <Text style={styles.subtitle}>Indica la importancia para priorizar en el calendario</Text>
      <View style={styles.threeColumnGrid}>
        <TouchableOpacity
          style={[styles.card, priority === "baja" && styles.cardSelected]}
          onPress={() => onSetPriority("baja")}
        >
          <Ionicons
            name="arrow-down-circle-outline"
            size={24}
            color={priority === "baja" ? Theme.colors.surface : Theme.colors.iconPrimary}
          />
          <Text style={[styles.cardTitle, priority === "baja" && styles.cardTitleSelected]}>Baja</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, priority === "media" && styles.cardSelected]}
          onPress={() => onSetPriority("media")}
        >
          <Ionicons
            name="play-circle-outline"
            size={24}
            color={priority === "media" ? Theme.colors.surface : Theme.colors.iconPrimary}
          />
          <Text style={[styles.cardTitle, priority === "media" && styles.cardTitleSelected]}>Media</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, priority === "alta" && styles.cardSelected]}
          onPress={() => onSetPriority("alta")}
        >
          <Ionicons
            name="arrow-up-circle-outline"
            size={24}
            color={priority === "alta" ? Theme.colors.surface : Theme.colors.iconPrimary}
          />
          <Text style={[styles.cardTitle, priority === "alta" && styles.cardTitleSelected]}>Alta</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.deadlineToggleRow}>
        <View style={styles.deadlineTextCol}>
          <Text style={styles.sectionTitleNoMargin}>¿Tiene fecha límite?</Text>
          <Text style={styles.subtitle}>Ideal para tareas con fecha de entrega estricta</Text>
        </View>
        <Switch
          value={hasDeadline}
          onValueChange={toggleHasDeadline}
          trackColor={{ false: Theme.colors.cardBorder, true: "#5665dc" }}
          thumbColor={hasDeadline ? Theme.colors.surface : Theme.colors.iconPrimary}
        />
      </View>

      {hasDeadline && deadline && (
        <View style={styles.datePickerContainer}>
          <TouchableOpacity
            style={styles.dateDisplayButton}
            onPress={() => setShowDatePicker((prev) => !prev)}
          >
            <Ionicons name="calendar-outline" size={24} color="#8dccff" />
            <Text style={styles.dateDisplayText}>{formatDate(deadline)}</Text>
          </TouchableOpacity>

          {(showDatePicker || Platform.OS === "ios") && (
            <View style={styles.iosDatePickerWrapper}>
              <DateTimePicker
                value={deadline}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                themeVariant="dark"
                minimumDate={new Date()}
                onChange={(_, selectedDate) => {
                  if (Platform.OS !== "ios") {
                    setShowDatePicker(false);
                  }
                  if (selectedDate) {
                    onSetDeadline(selectedDate);
                  }
                }}
                textColor={Theme.colors.surface}
                style={Platform.OS === "ios" ? styles.iosDatePicker : undefined}
              />
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  sectionTitle: {
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 8,
    marginBottom: 2,
  },
  sectionTitleNoMargin: {
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "900",
  },
  subtitle: {
    color: Theme.colors.iconPrimary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  threeColumnGrid: {
    flexDirection: "row",
    gap: 10,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.cardBackground,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 8,
  },
  cardSelected: {
    backgroundColor: "#5665dc",
    borderColor: "#8dccff",
  },
  cardTitle: {
    color: Theme.colors.iconPrimary,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },
  cardTitleSelected: {
    color: Theme.colors.surface,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.cardBorder,
    marginVertical: 12,
  },
  deadlineToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deadlineTextCol: {
    flex: 1,
    paddingRight: 16,
  },
  datePickerContainer: {
    marginTop: 10,
  },
  dateDisplayButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 2,
    borderColor: Theme.colors.cardBorder,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  dateDisplayText: {
    color: Theme.colors.surface,
    fontSize: 15,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  iosDatePickerWrapper: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 24,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  iosDatePicker: {
    height: 320,
  },
});
