// src/presentation/screens/Activity/voiceCreation/VoiceConfirmationSheet.tsx
//
// Editable confirmation sheet for parsed voice activity data.
// Receives ParsedVoiceActivity, renders editable fields,
// emits confirm with edits or cancel/back.

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ParsedVoiceActivity } from "../../../../domain/services/VoiceActivityParser";
import { DayOfWeek, ActivityType } from "../../../../domain/entities/Activity";
import { Theme } from "../../../components/theme/colors";

// ── Validation helpers ──────────────────────────────────────────────────────

interface ValidationErrors {
  title?: string;
  days?: string;
}

function getValidationErrors(
  title: string,
  selectedDays: DayOfWeek[],
): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!title.trim()) {
    errors.title = "El nombre de la actividad es obligatorio.";
  }
  if (selectedDays.length === 0) {
    errors.days = "Seleccioná al menos un día.";
  }
  return errors;
}

// ── Props ──────────────────────────────────────────────────────────────────

interface VoiceConfirmationSheetProps {
  parsed: ParsedVoiceActivity;
  onConfirm: (edits: Partial<ParsedVoiceActivity>) => void;
  onCancel: () => void;
  onBack: () => void;
}

// ── Constants ──────────────────────────────────────────────────────────────

const IDENTITY_OPTIONS = [
  { key: "clase", label: "Clase" },
  { key: "trabajo", label: "Trabajo" },
  { key: "tarea", label: "Tarea" },
] as const;

const PRIORITY_OPTIONS = [
  { key: "baja", label: "Baja" },
  { key: "media", label: "Media" },
  { key: "alta", label: "Alta" },
] as const;

const DIFFICULTY_OPTIONS = [
  { key: "baja", label: "Baja" },
  { key: "media", label: "Media" },
  { key: "alta", label: "Alta" },
] as const;

const DAY_ORDER: DayOfWeek[] = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  Lunes: "Lun",
  Martes: "Mar",
  Miercoles: "Mié",
  Jueves: "Jue",
  Viernes: "Vie",
  Sabado: "Sáb",
  Domingo: "Dom",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(
  startHour?: number,
  startMinute?: number,
  endHour?: number,
  endMinute?: number,
): string {
  const start =
    startHour !== undefined
      ? `${String(startHour).padStart(2, "0")}:${String(startMinute ?? 0).padStart(2, "0")}`
      : null;
  const end =
    endHour !== undefined
      ? `${String(endHour).padStart(2, "0")}:${String(endMinute ?? 0).padStart(2, "0")}`
      : null;

  if (start && end) return `${start} - ${end}`;
  if (start) return `Desde ${start}`;
  return "Automático";
}

const PRIORITY_VALUE_LABELS: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
};

// ── Component ──────────────────────────────────────────────────────────────

export default function VoiceConfirmationSheet({
  parsed,
  onConfirm,
  onCancel,
  onBack,
}: VoiceConfirmationSheetProps) {
  // ── Editable state ─────────────────────────────────────────────────────
  const [title, setTitle] = useState(parsed.title ?? "");
  const [identity, setIdentity] = useState<string | undefined>(parsed.identity);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(
    parsed.days ?? [],
  );
  const [priority, setPriority] = useState<string | undefined>(parsed.priority);
  const [difficulty, setDifficulty] = useState<string | undefined>(
    parsed.difficulty,
  );
  const [isFixed, setIsFixed] = useState<boolean | null>(
    parsed.type === ActivityType.FIXED
      ? true
      : parsed.type === ActivityType.FLEXIBLE
        ? false
        : null,
  );
  const [errors, setErrors] = useState<ValidationErrors>({});

  // ── Toggle day ─────────────────────────────────────────────────────────
  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  // ── Build edits ────────────────────────────────────────────────────────
  const buildEdits = (): Partial<ParsedVoiceActivity> => {
    const edits: Partial<ParsedVoiceActivity> = {};

    if (title !== (parsed.title ?? "")) edits.title = title;
    if (identity !== parsed.identity) edits.identity = identity as any;
    if (selectedDays !== parsed.days) edits.days = selectedDays;
    if (priority !== parsed.priority) edits.priority = priority as any;
    if (difficulty !== parsed.difficulty) edits.difficulty = difficulty as any;

    const fixedType =
      isFixed === true
        ? ActivityType.FIXED
        : isFixed === false
          ? ActivityType.FLEXIBLE
          : undefined;
    if (fixedType !== parsed.type) edits.type = fixedType;

    return edits;
  };

  // ── Priority active style (computed, not in StyleSheet) ────────────
  const getPriorityActiveStyle = (val: string) => {
    const bgColor =
      val === "alta"
        ? Theme.comfyColors.orange
        : val === "baja"
          ? Theme.comfyColors.yellow
          : Theme.comfyColors.green;
    return { backgroundColor: bgColor, borderColor: bgColor };
  };

  // ── Render helpers ─────────────────────────────────────────────────────
  const renderAutoLabel = (parsedValue: boolean) =>
    !parsedValue && (
      <Text style={styles.autoLabel}>Automático</Text>
    );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sheetTitle}>Confirmar actividad</Text>

      {/* ── Title ─────────────────────────────────────────────────────── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Nombre</Text>
        <TextInput
          style={[
            styles.textInput,
            !title && styles.textInputPlaceholder,
            errors.title && styles.textInputError,
          ]}
          value={title}
          onChangeText={(val) => {
            setTitle(val);
            if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          placeholder="¿Cómo se llama la actividad?"
          placeholderTextColor={Theme.colors.placeholder}
        />
        {errors.title && (
          <Text style={styles.errorText}>{errors.title}</Text>
        )}
      </View>

      {/* ── Identity ──────────────────────────────────────────────────── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Tipo</Text>
        <View style={styles.chipRow}>
          {IDENTITY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.chip,
                identity === opt.key && styles.chipActive,
              ]}
              activeOpacity={0.7}
              onPress={() => setIdentity(opt.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  identity === opt.key && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {renderAutoLabel(!!parsed.identity)}
      </View>

      {/* ── Days ──────────────────────────────────────────────────────── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Días</Text>
        <View style={styles.chipRow}>
          {DAY_ORDER.map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayChip,
                selectedDays.includes(day) && styles.dayChipActive,
                errors.days && styles.dayChipError,
              ]}
              activeOpacity={0.7}
              onPress={() => {
                toggleDay(day);
                if (errors.days) setErrors((prev) => ({ ...prev, days: undefined }));
              }}
            >
              <Text
                style={[
                  styles.dayChipText,
                  selectedDays.includes(day) && styles.dayChipTextActive,
                ]}
              >
                {DAY_LABELS[day]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.days && (
          <Text style={styles.errorText}>{errors.days}</Text>
        )}
        {!errors.days && renderAutoLabel(!!parsed.days && parsed.days.length > 0)}
      </View>

      {/* ── Time ──────────────────────────────────────────────────────── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Horario</Text>
        <View style={styles.timeDisplay}>
          <Ionicons
            name="time-outline"
            size={18}
            color={Theme.colors.iconSecondary}
          />
          <Text
            style={[
              styles.timeText,
              parsed.startHour === undefined && styles.timeAuto,
            ]}
          >
            {formatTime(
              parsed.startHour,
              parsed.startMinute,
              parsed.endHour,
              parsed.endMinute,
            )}
          </Text>
        </View>
        {renderAutoLabel(parsed.startHour !== undefined)}
      </View>

      {/* ── Priority ──────────────────────────────────────────────────── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Prioridad</Text>
        <View style={styles.chipRow}>
          {PRIORITY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.chip,
                priority === opt.key && getPriorityActiveStyle(opt.key),
              ]}
              activeOpacity={0.7}
              onPress={() => setPriority(opt.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  priority === opt.key && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {renderAutoLabel(!!parsed.priority)}
      </View>

      {/* ── Difficulty ────────────────────────────────────────────────── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Dificultad</Text>
        <View style={styles.chipRow}>
          {DIFFICULTY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.chip,
                difficulty === opt.key && styles.chipActive,
              ]}
              activeOpacity={0.7}
              onPress={() => setDifficulty(opt.key)}
            >
              <Text
                style={[
                  styles.chipText,
                  difficulty === opt.key && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {renderAutoLabel(!!parsed.difficulty)}
      </View>

      {/* ── Type ──────────────────────────────────────────────────────── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Tipo</Text>
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, isFixed === true && styles.chipActive]}
            activeOpacity={0.7}
            onPress={() => setIsFixed(true)}
          >
            <Text
              style={[
                styles.chipText,
                isFixed === true && styles.chipTextActive,
              ]}
            >
              Fijo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, isFixed === false && styles.chipActive]}
            activeOpacity={0.7}
            onPress={() => setIsFixed(false)}
          >
            <Text
              style={[
                styles.chipText,
                isFixed === false && styles.chipTextActive,
              ]}
            >
              Flexible
            </Text>
          </TouchableOpacity>
        </View>
        {renderAutoLabel(parsed.type !== undefined)}
      </View>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={Theme.colors.surface}
          />
          <Text style={styles.backButtonText}>Atrás</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmButton}
          activeOpacity={0.8}
          onPress={() => {
            const validationErrors = getValidationErrors(title, selectedDays);
            setErrors(validationErrors);
            if (Object.keys(validationErrors).length > 0) return;
            onConfirm(buildEdits());
          }}
        >
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={Theme.comfyFontColors.green}
          />
          <Text style={styles.confirmButtonText}>Crear actividad</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sheetTitle: {
    color: Theme.colors.surface,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 20,
  },

  // ── Field group ─────────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },

  // ── Text input ──────────────────────────────────────────────────────
  textInput: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  textInputPlaceholder: {
    color: Theme.colors.placeholder,
    fontStyle: "italic",
  },

  // ── Chips (identity, priority, difficulty, type) ────────────────────
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  chipActive: {
    backgroundColor: Theme.comfyColors.green,
    borderColor: Theme.comfyColors.green,
  },
  chipText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  chipTextActive: {
    color: Theme.comfyFontColors.green,
  },

  // ── Day chips ───────────────────────────────────────────────────────
  dayChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  dayChipActive: {
    backgroundColor: Theme.comfyColors.green,
    borderColor: Theme.comfyColors.green,
  },
  dayChipText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  dayChipTextActive: {
    color: Theme.comfyFontColors.green,
  },

  // ── Time display ────────────────────────────────────────────────────
  timeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  timeText: {
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  timeAuto: {
    color: Theme.colors.placeholder,
    fontStyle: "italic",
  },

  // ── Auto label ──────────────────────────────────────────────────────
  autoLabel: {
    color: Theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: "600",
    fontStyle: "italic",
    marginTop: 6,
    marginLeft: 4,
  },

  // ── Error text ─────────────────────────────────────────────────────
  errorText: {
    color: Theme.colors.error,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
    marginLeft: 4,
  },

  // ── Error states ────────────────────────────────────────────────────
  textInputError: {
    borderColor: Theme.colors.error,
  },
  dayChipError: {
    borderColor: Theme.colors.error,
  },

  // ── Footer ──────────────────────────────────────────────────────────
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.cardBorder,
  },
  backButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 24,
    minHeight: 56,
  },
  backButtonText: {
    color: Theme.colors.surface,
    fontSize: 16,
    fontWeight: "900",
  },
  confirmButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Theme.comfyColors.green,
    borderRadius: 24,
    minHeight: 56,
  },
  confirmButtonText: {
    color: Theme.comfyFontColors.green,
    fontSize: 16,
    fontWeight: "900",
  },
});
