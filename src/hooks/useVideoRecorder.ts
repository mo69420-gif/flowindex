import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MAX_SCAN_RECORDING_SECONDS, getSupportedRecordingMimeType } from '@/lib/videoScan';

type RecordingState = 'idle' | 'requesting' | 'recording' | 'review' | 'error';

async function getCameraStream() {
  const preferredVideo = {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  };

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: preferredVideo,
      audio: true,
    });
  } catch {
    return navigator.mediaDevices.getUserMedia({
      video: preferredVideo,
      audio: false,
    });
  }
}

export function useVideoRecorder() {
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const autoStopTimeoutRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const previewUrlRef = useRef<string | null>(null);

  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [secondsRemaining, setSecondsRemaining] = useState(MAX_SCAN_RECORDING_SECONDS);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const isSupported = useMemo(
    () => typeof window !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined',
    [],
  );

  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current !== null) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (autoStopTimeoutRef.current !== null) {
      window.clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
  }, []);

  const clearPreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (liveVideoRef.current) {
      liveVideoRef.current.pause();
      liveVideoRef.current.srcObject = null;
    }
  }, []);

  const discardRecording = useCallback(() => {
    clearCountdown();
    clearPreviewUrl();
    stopStream();
    chunksRef.current = [];
    recorderRef.current = null;
    setVideoFile(null);
    setPreviewUrl(null);
    setErrorMessage('');
    setSecondsRemaining(MAX_SCAN_RECORDING_SECONDS);
    setRecordingState('idle');
  }, [clearCountdown, clearPreviewUrl, stopStream]);

  const stopRecording = useCallback(() => {
    clearCountdown();
    const recorder = recorderRef.current;

    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      stopStream();
    }
  }, [clearCountdown, stopStream]);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setRecordingState('error');
      setErrorMessage('This browser cannot record inline video. Use a modern mobile browser and try again.');
      return;
    }

    discardRecording();
    setRecordingState('requesting');

    try {
      const stream = await getCameraStream();
      streamRef.current = stream;

      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        await liveVideoRef.current.play().catch(() => undefined);
      }

      const mimeType = getSupportedRecordingMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const startedAt = Date.now();

      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        clearCountdown();
        stopStream();
        setRecordingState('error');
        setErrorMessage('Recording failed mid-capture. Retake the scan.');
      };

      recorder.onstop = () => {
        clearCountdown();
        stopStream();

        if (chunksRef.current.length === 0) {
          setRecordingState('error');
          setErrorMessage('No video was captured. Retake the scan.');
          return;
        }

        const blobType = recorder.mimeType || mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        const extension = blobType.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `flowindex-scan-${Date.now()}.${extension}`, { type: blobType });
        const objectUrl = URL.createObjectURL(blob);

        clearPreviewUrl();
        previewUrlRef.current = objectUrl;

        setVideoFile(file);
        setPreviewUrl(objectUrl);
        setSecondsRemaining(MAX_SCAN_RECORDING_SECONDS);
        setRecordingState('review');
      };

      recorder.start(250);
      setSecondsRemaining(MAX_SCAN_RECORDING_SECONDS);
      setRecordingState('recording');

      countdownIntervalRef.current = window.setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
        setSecondsRemaining(Math.max(0, MAX_SCAN_RECORDING_SECONDS - elapsedSeconds));
      }, 250);

      autoStopTimeoutRef.current = window.setTimeout(() => {
        stopRecording();
      }, MAX_SCAN_RECORDING_SECONDS * 1000);
    } catch {
      clearCountdown();
      stopStream();
      setRecordingState('error');
      setErrorMessage('Camera access failed. Allow camera access and try again.');
    }
  }, [clearCountdown, clearPreviewUrl, discardRecording, isSupported, stopRecording, stopStream]);

  useEffect(() => {
    return () => {
      clearCountdown();
      clearPreviewUrl();
      stopStream();
    };
  }, [clearCountdown, clearPreviewUrl, stopStream]);

  return {
    discardRecording,
    errorMessage,
    isSupported,
    liveVideoRef,
    previewUrl,
    recordingState,
    secondsRemaining,
    startRecording,
    stopRecording,
    videoFile,
  };
}
