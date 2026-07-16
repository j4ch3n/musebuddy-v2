import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  addDetectionFinishListener,
  BasicPitchError,
  cancelRecognition,
  initialize,
  shareRecording,
  startRecognition,
  stopRecognition,
  type DetectionNote,
  type DetectionResult,
} from '@modules/basic-pitch';
import { createLogger } from '@/utils/logger';

import { formatDetectionNote } from './event-log';

export type TranscriptionPhase =
  | 'loadingModel'
  | 'modelError'
  | 'ready'
  | 'starting'
  | 'permissionDenied'
  | 'recording'
  | 'predicting'
  | 'failure';

const minimumRecordingDurationMs = 2_000;
const logger = createLogger('BasicPitchExample');

function messageFor(error: unknown, fallback: string): string {
  return error instanceof BasicPitchError ? error.message : fallback;
}

function logError(context: string, error: unknown): void {
  if (error instanceof BasicPitchError) {
    logger.error(context, {
      code: error.code,
      error,
      message: error.message,
      nativeMessage: error.nativeMessage,
    });
    return;
  }
  logger.error(context, error);
}

export function useTranscription() {
  const [phase, setPhase] = useState<TranscriptionPhase>('loadingModel');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [notes, setNotes] = useState<DetectionNote[]>([]);
  const [hasRecording, setHasRecording] = useState(false);
  const isMountedRef = useRef(true);
  const recordingStartedAtRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionIdRef = useRef<number | null>(null);

  const stopElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current !== null) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const startElapsedTimer = useCallback(() => {
    stopElapsedTimer();
    recordingStartedAtRef.current = Date.now();
    setElapsedMs(0);
    elapsedTimerRef.current = setInterval(() => {
      if (recordingStartedAtRef.current !== null) {
        setElapsedMs(Date.now() - recordingStartedAtRef.current);
      }
    }, 100);
  }, [stopElapsedTimer]);

  const handleDetection = useCallback((detection: DetectionResult) => {
    setResult(detection);
    setNotes(detection.notes);

    for (const note of detection.notes) {
      logger.info(formatDetectionNote(note));
    }
  }, []);

  const loadModel = useCallback(async () => {
    setPhase('loadingModel');
    setStatusMessage('');
    try {
      await initialize();
      if (isMountedRef.current) {
        setPhase('ready');
      }
    } catch (error) {
      logError('Basic Pitch model initialization failed.', error);
      if (isMountedRef.current) {
        setStatusMessage(messageFor(error, 'The transcription model could not be initialized.'));
        setPhase('modelError');
      }
    } finally {
      await SplashScreen.hideAsync();
    }
  }, []);

  useEffect(() => {
    void initialize()
      .then(() => {
        if (isMountedRef.current) {
          setPhase('ready');
        }
      })
      .catch((error: unknown) => {
        logError('Basic Pitch model initialization failed.', error);
        if (isMountedRef.current) {
          setStatusMessage(messageFor(error, 'The transcription model could not be initialized.'));
          setPhase('modelError');
        }
      })
      .finally(() => SplashScreen.hideAsync());
  }, []);

  useEffect(() => {
    const subscription = addDetectionFinishListener((detection) => {
      if (
        isMountedRef.current &&
        recognitionIdRef.current !== null &&
        detection.recognitionId === recognitionIdRef.current
      ) {
        handleDetection(detection);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [handleDetection]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopElapsedTimer();
      const recognitionId = recognitionIdRef.current;
      recognitionIdRef.current = null;
      if (recognitionId !== null) {
        void cancelRecognition(recognitionId).catch(() => {});
      }
    };
  }, [stopElapsedTimer]);

  const start = useCallback(async () => {
    setNotes([]);
    setResult(null);
    setHasRecording(false);
    setStatusMessage('');
    setPhase('starting');

    try {
      const { recognitionId } = await startRecognition();
      if (!isMountedRef.current) {
        await cancelRecognition(recognitionId);
        return;
      }
      recognitionIdRef.current = recognitionId;
      startElapsedTimer();
      setPhase('recording');
    } catch (error) {
      logError('Basic Pitch recognition failed to start.', error);
      if (!isMountedRef.current) {
        return;
      }
      stopElapsedTimer();
      recordingStartedAtRef.current = null;
      setElapsedMs(0);
      setStatusMessage(messageFor(error, 'Recording could not start.'));
      setPhase(
        error instanceof BasicPitchError && error.code === 'ERR_MICROPHONE_PERMISSION_DENIED'
          ? 'permissionDenied'
          : 'failure',
      );
    }
  }, [startElapsedTimer, stopElapsedTimer]);

  const end = useCallback(async () => {
    if (elapsedMs < minimumRecordingDurationMs) {
      return;
    }

    setStatusMessage('');
    setPhase('predicting');
    try {
      const recognitionId = recognitionIdRef.current;
      if (recognitionId === null) {
        return;
      }
      const finalDetection = await stopRecognition(recognitionId);
      recognitionIdRef.current = null;
      if (!isMountedRef.current) {
        return;
      }
      stopElapsedTimer();
      recordingStartedAtRef.current = null;
      setElapsedMs(finalDetection.recordedDurationMs);
      handleDetection(finalDetection);
      setHasRecording(true);
      setPhase('ready');
    } catch (error) {
      logError('Basic Pitch final detection failed.', error);
      if (isMountedRef.current) {
        stopElapsedTimer();
        setStatusMessage(messageFor(error, 'Recording or transcription failed.'));
        setPhase('failure');
      }
    }
  }, [elapsedMs, handleDetection, stopElapsedTimer]);

  const downloadRecording = useCallback(async () => {
    setStatusMessage('');
    try {
      await shareRecording();
    } catch (error) {
      logError('Basic Pitch recording download failed.', error);
      if (isMountedRef.current) {
        setStatusMessage(messageFor(error, 'Recording could not be downloaded.'));
      }
    }
  }, []);

  return {
    downloadRecording,
    elapsedMs,
    end,
    hasRecording,
    loadModel,
    notes,
    phase,
    result,
    start,
    statusMessage,
  };
}
