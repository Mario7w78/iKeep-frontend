// src/presentation/screens/Activity/voiceCreation/QuickAddVoiceView.tsx
//
// Main modal for voice-based activity creation.
// States: permission → listening → processing → confirmation → error
// Follows the same sheet pattern as CreateActivityView.

import React, { useEffect, useRef, useState, useCallback } from "react";
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

import { ParsedVoiceActivity } from "../../../../domain/services/VoiceActivityParser";
import { Theme } from "../../../components/theme/colors";
import { useVoiceCapture } from "../../../hooks/useVoiceCapture";
import { parseVoiceActivityUseCase } from "../../../../di/Dependencies";

import VoiceConfirmationSheet from "./VoiceConfirmationSheet";

// ── Constants ──────────────────────────────────────────────────────────────

const SHEET_HEIGHT = Dimensions.get("window").height * 0.88;
const DISMISS_DISTANCE = 130;

type VoiceState =
  | "idle"          // initial — show "Presioná para hablar"
  | "listening"     // recording
  | "processing"    // parsing transcript
  | "confirmation"  // show editable confirmation sheet
  | "saving"        // saving to store
  | "error";        // error state

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns true when the parser couldn't extract ANY meaningful data.
 * An empty result means the transcript had no recognizable structure.
 */
function isParseResultEmpty(r: ParsedVoiceActivity): boolean {
  return (
    !r.title &&
    !r.identity &&
    (!r.days || r.days.length === 0) &&
    r.startHour === undefined &&
    r.endHour === undefined &&
    !r.priority &&
    !r.difficulty
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function QuickAddVoiceView({ navigation }: any) {
  // ── Sheet animation (same pattern as CreateActivityView) ────────────
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

  const closeSheet = useCallback(() => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => navigation.goBack());
  }, [translateY, navigation]);

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

  // ── Voice capture hook ──────────────────────────────────────────────
  const {
    isListening,
    transcript,
    interimTranscript,
    error: captureError,
    hasPermission,
    startListening,
    stopListening,
    reset: resetCapture,
  } = useVoiceCapture();

  // ── UI state ────────────────────────────────────────────────────────
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [parsedResult, setParsedResult] = useState<ParsedVoiceActivity | null>(null);
  const [displayError, setDisplayError] = useState<string | null>(null);

  // ── Derive state from hook ──────────────────────────────────────────
  useEffect(() => {
    if (voiceState === "idle" && hasPermission === true) {
      // Auto-start listening when modal opens with permission
      startListening();
    }
  }, [hasPermission, voiceState, startListening]);

  useEffect(() => {
    if (isListening) setVoiceState("listening");
  }, [isListening]);

  // ── Cleanup on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  useEffect(() => {
    if (captureError) {
      setDisplayError(captureError);
      setVoiceState("error");
    }
  }, [captureError]);

  // ── Handle stop & parse ─────────────────────────────────────────────
  const handleStop = useCallback(() => {
    stopListening();
    // Derive the full transcript from accumulated final + interim
    const fullTranscript = (transcript + " " + interimTranscript).trim();

    if (!fullTranscript) {
      setDisplayError("No se detectó ningún texto. Intentá de nuevo.");
      setVoiceState("error");
      return;
    }

    setVoiceState("processing");

    // Small delay to show processing state before synchronous parse
    setTimeout(() => {
      try {
        const parsed = parseVoiceActivityUseCase.parse(fullTranscript);

        // Check if parser extracted any meaningful data
        if (isParseResultEmpty(parsed)) {
          setDisplayError(
            "No se pudo identificar ninguna actividad en lo que dijiste. " +
              "Intentá de nuevo siendo más específico (ej: \"clase de matemática los lunes de 14 a 16\").",
          );
          setVoiceState("error");
          return;
        }

        setParsedResult(parsed);
        setVoiceState("confirmation");
      } catch (e) {
        setDisplayError("No se pudo procesar el audio. Intentá de nuevo.");
        setVoiceState("error");
      }
    }, 400);
  }, [stopListening, transcript, interimTranscript]);

  // ── Handle confirmation ─────────────────────────────────────────────
  const handleConfirm = useCallback(
    async (edits: Partial<ParsedVoiceActivity>) => {
      if (!parsedResult) return;

      setVoiceState("saving");
      try {
        await parseVoiceActivityUseCase.confirmAndSave(parsedResult, edits);
        // Success → navigate back to Schedule tab
        navigation.navigate("MainTabs", { screen: "Schedule" });
      } catch (e) {
        console.error("Error saving voice activity:", e);
        setDisplayError("Hubo un error al guardar la actividad. Intentá de nuevo.");
        setVoiceState("error");
      }
    },
    [parsedResult, navigation],
  );

  // ── Handle back to recording ────────────────────────────────────────
  const handleBackToRecording = useCallback(() => {
    resetCapture();
    setParsedResult(null);
    setDisplayError(null);
    setVoiceState("idle");
    // Auto-start after a brief moment
    setTimeout(() => startListening(), 300);
  }, [resetCapture, startListening]);

  // ── Handle retry from error ─────────────────────────────────────────
  const handleRetry = useCallback(() => {
    resetCapture();
    setParsedResult(null);
    setDisplayError(null);
    setVoiceState("idle");
    setTimeout(() => startListening(), 300);
  }, [resetCapture, startListening]);

  // ── Render: Idle / Permission ───────────────────────────────────────
  const renderIdle = () => (
    <View style={styles.stateContainer}>
      <View style={styles.micOrb}>
        <Ionicons name="mic" size={48} color={Theme.comfyColors.green} />
      </View>
      <Text style={styles.stateTitle}>Presioná para hablar</Text>
      <Text style={styles.stateSubtitle}>
        Describí tu actividad como si hablaras con alguien
      </Text>
      <TouchableOpacity
        style={styles.startButton}
        activeOpacity={0.8}
        onPress={startListening}
      >
        <Ionicons
          name="mic-outline"
          size={22}
          color={Theme.comfyFontColors.green}
        />
        <Text style={styles.startButtonText}>Comenzar</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Render: Listening ───────────────────────────────────────────────
  const renderListening = () => (
    <View style={styles.stateContainer}>
      <View style={[styles.micOrb, styles.micOrbListening]}>
        <Ionicons name="mic" size={48} color={Theme.colors.surface} />
      </View>
      <Text style={styles.stateTitle}>Escuchando...</Text>

      {(interimTranscript || transcript) && (
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptText}>
            {transcript}
            {interimTranscript ? (
              <Text style={styles.interimText}> {interimTranscript}</Text>
            ) : null}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.stopButton}
        activeOpacity={0.8}
        onPress={handleStop}
      >
        <Ionicons
          name="stop-circle"
          size={28}
          color={Theme.comfyFontColors.green}
        />
        <Text style={styles.stopButtonText}>Listo</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Render: Processing ──────────────────────────────────────────────
  const renderProcessing = () => (
    <View style={styles.stateContainer}>
      <ActivityIndicator size="large" color={Theme.comfyColors.green} />
      <Text style={styles.stateTitle}>Procesando...</Text>
      <Text style={styles.stateSubtitle}>Analizando lo que dijiste</Text>
    </View>
  );

  // ── Render: Confirmation ────────────────────────────────────────────
  const renderConfirmation = () => {
    if (!parsedResult) return null;
    return (
      <VoiceConfirmationSheet
        parsed={parsedResult}
        onConfirm={handleConfirm}
        onCancel={closeSheet}
        onBack={handleBackToRecording}
      />
    );
  };

  // ── Render: Saving ──────────────────────────────────────────────────
  const renderSaving = () => (
    <View style={styles.stateContainer}>
      <ActivityIndicator size="large" color={Theme.comfyColors.green} />
      <Text style={styles.stateTitle}>Guardando actividad...</Text>
    </View>
  );

  // ── Render: Error ───────────────────────────────────────────────────
  const renderError = () => (
    <View style={styles.stateContainer}>
      <View style={[styles.micOrb, { borderColor: Theme.colors.error }]}>
        <Ionicons name="alert-circle" size={48} color={Theme.colors.error} />
      </View>
      <Text style={[styles.stateTitle, { color: Theme.colors.error }]}>
        Algo salió mal
      </Text>
      <Text style={styles.stateSubtitle}>{displayError}</Text>

      <View style={styles.errorActions}>
        <TouchableOpacity
          style={styles.retryButton}
          activeOpacity={0.8}
          onPress={handleRetry}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={Theme.comfyFontColors.green}
          />
          <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.errorCloseButton}
          activeOpacity={0.8}
          onPress={closeSheet}
        >
          <Text style={styles.errorCloseText}>Cerrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Render body based on state ──────────────────────────────────────
  const renderBody = () => {
    switch (voiceState) {
      case "idle":
        return renderIdle();
      case "listening":
        return renderListening();
      case "processing":
        return renderProcessing();
      case "confirmation":
        return renderConfirmation();
      case "saving":
        return renderSaving();
      case "error":
        return renderError();
      default:
        return renderIdle();
    }
  };

  // ── Header title ────────────────────────────────────────────────────
  const headerTitle = voiceState === "confirmation" ? "" : "Agregar por voz";

  return (
    <View style={styles.container}>
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents="auto"
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.dragArea} {...panResponder.panHandlers}>
          <View style={styles.dragHandle} />
        </View>

        {/* Header — hidden during confirmation (sheet has its own title) */}
        {voiceState !== "confirmation" && (
          <View style={styles.header}>
            <Text style={styles.title}>{headerTitle}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={closeSheet}>
              <Ionicons
                name="close"
                size={32}
                color={Theme.comfyFontColors.green}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Body */}
        <View style={styles.body}>{renderBody()}</View>
      </Animated.View>

      {/* Loading overlay for saving */}
      {voiceState === "saving" && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Theme.comfyColors.green} />
          <Text style={styles.loadingText}>Guardando actividad...</Text>
        </View>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

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
    marginBottom: 8,
  },
  title: {
    color: Theme.colors.surface,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -1,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Theme.comfyColors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },

  // ── State containers ────────────────────────────────────────────────
  stateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 40,
  },

  // ── Mic orb ─────────────────────────────────────────────────────────
  micOrb: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(141, 255, 104, 0.12)",
    borderWidth: 2,
    borderColor: Theme.comfyColors.green,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  micOrbListening: {
    backgroundColor: "rgba(141, 255, 104, 0.25)",
    borderColor: Theme.colors.surface,
  },

  // ── State text ──────────────────────────────────────────────────────
  stateTitle: {
    color: Theme.colors.surface,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  stateSubtitle: {
    color: Theme.colors.textTertiary,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 20,
  },

  // ── Transcript ──────────────────────────────────────────────────────
  transcriptBox: {
    backgroundColor: Theme.colors.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.comfyColors.green,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    width: "100%",
    minHeight: 60,
  },
  transcriptText: {
    color: Theme.colors.surface,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  interimText: {
    color: Theme.colors.textTertiary,
    fontStyle: "italic",
  },

  // ── Start button ────────────────────────────────────────────────────
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Theme.comfyColors.green,
    borderRadius: 24,
    minHeight: 56,
    paddingHorizontal: 32,
  },
  startButtonText: {
    color: Theme.comfyFontColors.green,
    fontSize: 18,
    fontWeight: "900",
  },

  // ── Stop button ─────────────────────────────────────────────────────
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Theme.comfyColors.green,
    borderRadius: 24,
    minHeight: 56,
    paddingHorizontal: 28,
  },
  stopButtonText: {
    color: Theme.comfyFontColors.green,
    fontSize: 18,
    fontWeight: "900",
  },

  // ── Error ───────────────────────────────────────────────────────────
  errorActions: {
    gap: 12,
    width: "100%",
    alignItems: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Theme.comfyColors.green,
    borderRadius: 24,
    minHeight: 56,
    paddingHorizontal: 32,
    width: "100%",
  },
  retryButtonText: {
    color: Theme.comfyFontColors.green,
    fontSize: 16,
    fontWeight: "900",
  },
  errorCloseButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  errorCloseText: {
    color: Theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: "700",
  },

  // ── Loading overlay ─────────────────────────────────────────────────
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
