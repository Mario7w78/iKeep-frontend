// src/infrastructure/speech/ExpoSpeechRecognitionService.ts
//
// Non-React wrapper around expo-speech-recognition's imperative API.
// The hook (useVoiceCapture) owns event listeners via React hooks;
// this module provides only start/stop/permission primitives.
//
// ⚠️  The native module is loaded LAZILY (via require) so importing this
//     file does NOT trigger requireNativeModule at bundle time. This is
//     critical because Expo Router evaluates all modules at startup, and
//     'expo-speech-recognition' is NOT available in Expo Go or before
//     prebuild.

/**
 * Domain-specific vocabulary bias — helps the STT engine recognize
 * Spanish activity-related words with higher accuracy.
 */
const CONTEXTUAL_STRINGS = [
  'clase',
  'trabajo',
  'tarea',
  'lunes',
  'martes',
  'miercoles',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'sabado',
  'domingo',
  'prioridad',
  'dificultad',
  'alta',
  'media',
  'baja',
  'fijo',
  'fija',
  'flexible',
  'desde',
  'hasta',
  'a las',
  'de las',
];

/**
 * Lazy accessor for the native module.
 * Using require() instead of a top-level import prevents 'Cannot find native module'
 * errors at bundle evaluation time — the native module is only resolved when a
 * voice function is actually called.
 */
function getNativeModule(): any {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ExpoSpeechRecognitionModule } = require('expo-speech-recognition');
  return ExpoSpeechRecognitionModule;
}

/** Start speech recognition with Argentine Spanish defaults. */
export function startListening(): void {
  getNativeModule().start({
    lang: 'es-AR',
    interimResults: true,
    continuous: false,
    contextualStrings: CONTEXTUAL_STRINGS,
    maxAlternatives: 1,
    addsPunctuation: false,
    requiresOnDeviceRecognition: false,
  });
}

/** Gracefully stop an active recognition session. */
export function stopListening(): void {
  getNativeModule().stop();
}

/** Abort an active recognition session immediately. */
export function abortListening(): void {
  getNativeModule().abort();
}

/**
 * Request microphone + speech recognition permissions.
 * Returns `true` if both were granted.
 */
export async function requestPermission(): Promise<boolean> {
  const result = await getNativeModule().requestPermissionsAsync();
  return result.granted;
}
