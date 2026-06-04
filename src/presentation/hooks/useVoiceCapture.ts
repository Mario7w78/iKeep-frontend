// src/presentation/hooks/useVoiceCapture.ts
//
// Drives the speech recognition lifecycle from the UI layer.
// Uses useSpeechRecognitionEvent (React hook) for event binding
// and delegates imperative start/stop to ExpoSpeechRecognitionService.
//
// ⚠️  The native module is loaded lazily so importing this file does NOT
//     crash in Expo Go or environments where expo-speech-recognition hasn't
//     been prebuilt. The voice feature degrades gracefully when unavailable.

import { useState, useCallback } from 'react';
import {
  startListening,
  stopListening,
  requestPermission,
} from '../../infrastructure/speech/ExpoSpeechRecognitionService';

export interface UseVoiceCaptureReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  hasPermission: boolean | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  reset: () => void;
}

// ── Lazy load the speech-recognition hook ────────────────────────────────
//
// We try to load the module at module-evaluation time. If the native module
// isn't available (Expo Go, no prebuild), it throws — the catch assigns a
// noop fallback so the hook always has a valid function to call.
//
// Since QuickAddVoiceView is itself lazy-loaded via React.lazy(), this code
// only runs when the user opens the voice modal, not at app startup.

type SpeechRecognitionEventHandler = (event: any) => void;
let useSpeechRecognitionEvent: (
  event: string,
  handler: SpeechRecognitionEventHandler,
) => void = () => {
  /* noop — native module unavailable */
};

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('expo-speech-recognition');
  if (mod?.useSpeechRecognitionEvent) {
    useSpeechRecognitionEvent = mod.useSpeechRecognitionEvent;
  }
} catch {
  // Native module not available — keep noop fallback
}

// ── Hook ─────────────────────────────────────────────────────────────────

/**
 * Manages the full voice-capture lifecycle:
 *   1. Permission request (triggered on start)
 *   2. Live recording state (isListening)
 *   3. Accumulated final transcript + partial (interim) transcript
 *   4. Error handling
 *   5. Cleanup via reset
 *
 * When the native speech-recognition module is unavailable (Expo Go, missing
 * prebuild), all operations fail gracefully with an explanatory error.
 */
export function useVoiceCapture(): UseVoiceCaptureReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // ── Event listeners (bound once by the hook) ──────────────────────

  useSpeechRecognitionEvent('result', (event) => {
    const result = event.results?.[0];
    if (!result) return;

    if (event.isFinal) {
      setTranscript((prev) =>
        prev ? `${prev} ${result.transcript}` : result.transcript,
      );
      setInterimTranscript('');
    } else {
      setInterimTranscript(result.transcript);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setError(event.message || event.error || 'Error de reconocimiento de voz');
    setIsListening(false);
  });

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    setError(null);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
  });

  // ── Actions ───────────────────────────────────────────────────────

  const handleStartListening = useCallback(async () => {
    setError(null);

    try {
      const permitted = await requestPermission();
      setHasPermission(permitted);

      if (!permitted) {
        setError('Permiso de micrófono denegado');
        return;
      }

      startListening();
    } catch (e: any) {
      setHasPermission(false);
      setIsListening(false);
      setError(
        'Reconocimiento de voz no disponible en este entorno. ' +
          'Probá con un development build.',
      );
    }
  }, []);

  const handleStopListening = useCallback(() => {
    try {
      stopListening();
    } catch {
      // Module not available — nothing to stop
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  // ── Return ────────────────────────────────────────────────────────

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    hasPermission,
    startListening: handleStartListening,
    stopListening: handleStopListening,
    reset,
  };
}
