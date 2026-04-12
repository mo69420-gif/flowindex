import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlow } from '@/lib/flowContext';
import { LOADING_LINES } from '@/lib/mockData';
import { formatClock } from '@/hooks/useMissionClock';
import { useVideoRecorder } from '@/hooks/useVideoRecorder';
import { extractFramesFromVideo, MAX_SCAN_RECORDING_SECONDS } from '@/lib/videoScan';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';
import { supabase } from '@/integrations/supabase/client';

export default function Scan() {
  const { state, dispatch } = useFlow();
  const navigate = useNavigate();
  const [step, setStep] = useState<'capture' | 'loading' | 'error'>('capture');
  const [loadingPct, setLoadingPct] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [loadingLogs, setLoadingLogs] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [customLoadingLines, setCustomLoadingLines] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const abortRef = useRef(false);
  const {
    discardRecording,
    errorMessage: recorderError,
    isSupported,
    liveVideoRef,
    previewUrl,
    recordingState,
    secondsRemaining,
    startRecording,
    stopRecording,
    videoFile,
  } = useVideoRecorder();

  useEffect(() => {
    if (!state.seenExplainer) {
      navigate('/explainer');
    }
  }, [navigate, state.seenExplainer]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (recordingState === 'error' && recorderError) {
      setErrorMsg(recorderError);
      setStep('error');
    }
  }, [recorderError, recordingState]);

  const activeLoadingLines = customLoadingLines.length > 0
    ? customLoadingLines
    : state.loadingLines.length > 0
      ? state.loadingLines
      : LOADING_LINES;

  const startLoadingAnimation = () => {
    setLoadingPct(0);
    setLoadingLogs([]);
    let lineIdx = 0;
    let pct = 0;
    abortRef.current = false;

    timerRef.current = setInterval(() => {
      if (abortRef.current) {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }

      pct += Math.floor(Math.random() * 4) + 1;
      if (pct > 90) pct = 90;
      setLoadingPct(pct);

      if (lineIdx < activeLoadingLines.length) {
        setLoadingMsg(activeLoadingLines[lineIdx]);
        setLoadingLogs((prev) => [...prev.slice(-5), activeLoadingLines[lineIdx]]);
        lineIdx += 1;
      }
    }, 1200);
  };

  const stopLoadingAnimation = () => {
    abortRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const analyzeVideo = async () => {
    if (!videoFile) return;

    setStep('loading');
    startLoadingAnimation();

    try {
      setLoadingMsg('SAMPLING VIDEO WALKTHROUGH...');

      const frames = await extractFramesFromVideo(videoFile);
      if (frames.length === 0) throw new Error('Could not extract frames from video.');

      setLoadingMsg(`${frames.length} VISUAL CHECKPOINTS CAPTURED. ANALYZING...`);

      const images = frames.map((dataUrl, index) => ({
        label: `FRAME_${index + 1}`,
        dataUrl,
      }));

      const firstFrameDataUrl = frames[0];

      const [scanResult, loadingResult] = await Promise.allSettled([
        supabase.functions.invoke('analyze-room', {
          body: { mode: 'video_scan', images },
        }),
        supabase.functions.invoke('analyze-room', {
          body: { mode: 'generate_loading_lines', images: [{ label: 'frame', dataUrl: frames[0] }] },
        }),
      ]);

      stopLoadingAnimation();

      if (loadingResult.status === 'fulfilled' && loadingResult.value.data?.lines) {
        setCustomLoadingLines(loadingResult.value.data.lines);
        dispatch({ type: 'SET_LOADING_LINES', payload: loadingResult.value.data.lines });
      }

      if (scanResult.status === 'rejected') throw new Error('Video analysis failed');
      const { data, error } = scanResult.value;
      if (error) throw new Error(error.message || 'Video analysis failed');
      if (data?.error) throw new Error(data.error);

      setLoadingPct(100);
      setLoadingMsg('SCAN COMPLETE. SECTORS ARMED.');

      setTimeout(() => {
        dispatch({
          type: 'LOAD_SCAN',
          payload: {
            sectors: data.sectors,
            sectorOrder: data.sectorOrder,
            operationName: data.operationName,
          },
        });

        if (data.sectorOrder?.length > 0) {
          dispatch({ type: 'SAVE_BEFORE_REF', payload: { sectorKey: data.sectorOrder[0], dataUrl: firstFrameDataUrl } });
        }

        navigate('/briefing');
      }, 800);
    } catch (error: any) {
      stopLoadingAnimation();
      setErrorMsg(error.message || 'Video analysis failed');
      setStep('error');
    }
  };

  if (step === 'error') {
    return (
      <TerminalLayout title="ERROR" syslog="Something went wrong. Details above.">
        <div className="border border-destructive text-destructive p-3.5 mb-3 text-xs whitespace-pre-wrap leading-relaxed">
          <div className="text-[13px] tracking-widest mb-2">[ERROR] SCAN FAILED</div>
          {errorMsg}
        </div>
        <TerminalButton
          variant="scan"
          onClick={() => {
            discardRecording();
            setErrorMsg('');
            setStep('capture');
          }}
        >
          {'>'} RETRY SCAN
        </TerminalButton>
        <TerminalButton variant="back" onClick={() => navigate('/menu')}>
          {'<'} BACK TO MENU
        </TerminalButton>
      </TerminalLayout>
    );
  }

  if (step === 'loading') {
    return (
      <TerminalLayout title="SCANNING" syslog="Analyzing video. Do not close this screen.">
        <div className="border border-primary p-4 bg-muted">
          <div className="h-1 bg-border w-full mb-1.5">
            <div className="h-1 bg-primary transition-all duration-700" style={{ width: `${loadingPct}%` }} />
          </div>
          <div className="text-primary text-[11px] text-right mb-2">{loadingPct}%</div>
          <div className="text-primary text-xs tracking-wide mb-1.5 min-h-[18px]">
            [SYSTEM] {loadingMsg}
          </div>
          <div className="text-muted-foreground text-[11px] max-h-24 overflow-hidden">
            {loadingLogs.map((line, index) => (
              <span key={index} className="block fade-in">{line}</span>
            ))}
          </div>
        </div>
      </TerminalLayout>
    );
  }

  const statusLabel = recordingState === 'requesting'
    ? 'ARMING'
    : recordingState === 'recording'
      ? `REC ${formatClock(secondsRemaining)}`
      : recordingState === 'review'
        ? 'READY'
        : 'AWAITING';

  return (
    <TerminalLayout title="SCAN" syslog="Record a 30-second walkthrough. The OS handles the rest.">
      <div className="border border-border bg-muted p-3 mb-3.5">
        <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
          VIDEO WALKTHROUGH SCAN
        </div>
        <div className="text-muted-foreground text-xs mb-3 font-body leading-relaxed whitespace-pre-wrap">
          Record a 30-second scan of the scenario you want to break down.{"
"}
          Walk every corner. Talk while you move. Describe what you see.{"
"}
          The OS will pull what it needs and build the sector map.
        </div>
        <div className="text-accent text-[10px] tracking-widest mb-1">
          30-SECOND CAP IS ENFORCED AUTOMATICALLY
        </div>
      </div>

      <div className={`border mb-3 bg-muted ${recordingState === 'review' ? 'border-primary' : recordingState === 'recording' || recordingState === 'requesting' ? 'border-accent' : 'border-border'}`}>
        <div className="px-3.5 py-3 flex justify-between items-center gap-2">
          <span className={`text-xs tracking-widest ${recordingState === 'review' || recordingState === 'recording' || recordingState === 'requesting' ? 'text-primary' : 'text-muted-foreground'}`}>
            VIDEO WALKTHROUGH
          </span>
          <span className={`text-[11px] ${recordingState === 'recording' ? 'text-accent' : recordingState === 'review' ? 'text-primary' : 'text-muted-foreground'}`}>
            {statusLabel}
          </span>
        </div>

        <div className="px-3.5 pb-3.5">
          {(recordingState === 'recording' || recordingState === 'requesting') && (
            <>
              <div className="border border-accent/30 bg-background/40 overflow-hidden mb-3 aspect-[3/4] sm:aspect-video">
                <video ref={liveVideoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              </div>
              <div className="border border-accent/30 p-3 mb-3">
                <div className="text-accent text-xs tracking-widest">RECORDING IN PROGRESS</div>
                <div className="text-muted-foreground text-[11px] mt-1 font-body leading-relaxed">
                  Walk the space. Get every angle. The recorder will hard-stop at {MAX_SCAN_RECORDING_SECONDS} seconds.
                </div>
              </div>
              <TerminalButton variant="danger" onClick={stopRecording}>
                {'>'} STOP RECORDING NOW
              </TerminalButton>
            </>
          )}

          {recordingState === 'review' && previewUrl && videoFile && (
            <>
              <div className="border border-primary/30 bg-background/40 overflow-hidden mb-3 aspect-[3/4] sm:aspect-video">
                <video src={previewUrl} className="w-full h-full object-cover" controls playsInline />
              </div>
              <div className="text-muted-foreground text-[10px] mb-3 font-body">
                {videoFile.name} · {(videoFile.size / 1024 / 1024).toFixed(1)} MB · capped at {MAX_SCAN_RECORDING_SECONDS}s
              </div>
              <TerminalButton variant="scan" onClick={analyzeVideo}>
                {'>'} USE RECORDING — BUILD SECTOR MAP
              </TerminalButton>
              <TerminalButton variant="back" onClick={discardRecording}>
                {'<'} RETAKE VIDEO
              </TerminalButton>
            </>
          )}

          {recordingState === 'idle' && (
            <>
              <div className="text-muted-foreground text-[11px] mb-3 font-body leading-relaxed">
                Tap once to open the camera and start a capped recording. No gallery upload step here.
              </div>
              <TerminalButton variant="scan" disabled={!isSupported} onClick={startRecording}>
                {'>'} TAP TO RECORD VIDEO
              </TerminalButton>
              {!isSupported && (
                <div className="border border-destructive/30 text-destructive text-[11px] mt-3 p-3 font-body">
                  Inline video recording is not supported in this browser.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <TerminalButton variant="back" onClick={() => navigate('/menu')}>
        {'<'} BACK TO MENU
      </TerminalButton>
    </TerminalLayout>
  );
}
