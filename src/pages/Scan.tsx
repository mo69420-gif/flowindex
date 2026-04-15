import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlow } from '@/lib/flowContext';
import { LOADING_LINES } from '@/lib/mockData';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';
import { supabase } from '@/integrations/supabase/client';

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Extract N evenly-spaced frames from a video file as data URLs */
async function extractFramesFromVideo(file: File, frameCount = 8): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d')!;
      const frames: string[] = [];
      const times: number[] = [];

      for (let i = 0; i < frameCount; i++) {
        times.push((duration / (frameCount + 1)) * (i + 1));
      }

      let idx = 0;
      const captureNext = () => {
        if (idx >= times.length) {
          URL.revokeObjectURL(url);
          resolve(frames);
          return;
        }
        video.currentTime = times[idx];
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg', 0.7));
        idx++;
        captureNext();
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to process video'));
      };

      captureNext();
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video'));
    };
  });
}

export default function Scan() {
  const { state, dispatch } = useFlow();
  const navigate = useNavigate();
  const [step, setStep] = useState<'upload' | 'loading' | 'error'>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loadingPct, setLoadingPct] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [loadingLogs, setLoadingLogs] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [customLoadingLines, setCustomLoadingLines] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const abortRef = useRef(false);

  useEffect(() => {
    if (!state.seenExplainer) {
      navigate('/explainer');
    }
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const activeLoadingLines = customLoadingLines.length > 0 ? customLoadingLines
    : state.loadingLines.length > 0 ? state.loadingLines
    : LOADING_LINES;

  const startLoadingAnimation = () => {
    setLoadingPct(0);
    setLoadingLogs([]);
    let lineIdx = 0;
    let pct = 0;
    abortRef.current = false;

    timerRef.current = setInterval(() => {
      if (abortRef.current) {
        clearInterval(timerRef.current);
        return;
      }
      pct += Math.floor(Math.random() * 4) + 1;
      if (pct > 90) pct = 90;
      setLoadingPct(pct);

      if (lineIdx < activeLoadingLines.length) {
        setLoadingMsg(activeLoadingLines[lineIdx]);
        setLoadingLogs(prev => [...prev.slice(-5), activeLoadingLines[lineIdx]]);
        lineIdx++;
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
      setLoadingMsg('EXTRACTING FRAMES FROM VIDEO...');

      const frames = await extractFramesFromVideo(videoFile, 8);
      if (frames.length === 0) throw new Error('Could not extract frames from video.');

      setLoadingMsg(`${frames.length} FRAMES CAPTURED. ANALYZING...`);

      const images = frames.map((dataUrl, i) => ({
        label: `FRAME_${i + 1}`,
        dataUrl,
      }));

      // Save first frame as before reference
      const firstFrameDataUrl = frames[0];

      // Fire analysis and loading lines in parallel
      const [scanResult, loadingResult] = await Promise.allSettled([
        supabase.functions.invoke('analyze-room', {
          body: { mode: 'video_scan', images },
        }),
        supabase.functions.invoke('analyze-room', {
          body: { mode: 'generate_loading_lines', images: [{ label: 'frame', dataUrl: frames[0] }] },
        }),
      ]);

      stopLoadingAnimation();

      // Handle loading lines
      if (loadingResult.status === 'fulfilled' && loadingResult.value.data?.lines) {
        setCustomLoadingLines(loadingResult.value.data.lines);
        dispatch({ type: 'SET_LOADING_LINES', payload: loadingResult.value.data.lines });
      }

      // Handle scan result
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

        // Save first frame as before reference for first sector
        if (data.sectorOrder?.length > 0) {
          dispatch({ type: 'SAVE_BEFORE_REF', payload: { sectorKey: data.sectorOrder[0], dataUrl: firstFrameDataUrl } });
        }

        navigate('/briefing');
      }, 800);
    } catch (e: any) {
      stopLoadingAnimation();
      setErrorMsg(e.message || 'Video analysis failed');
      setStep('error');
    }
  };

  // Error screen
  if (step === 'error') {
    return (
      <TerminalLayout title="ERROR" syslog="Something went wrong. Details above.">
        <div className="border border-destructive text-destructive p-3.5 mb-3 text-xs whitespace-pre-wrap leading-relaxed">
          <div className="text-[13px] tracking-widest mb-2">[ERROR] SCAN FAILED</div>
          {errorMsg}
        </div>
        <TerminalButton variant="scan" onClick={() => { setErrorMsg(''); setStep('upload'); }}>
          {'>'} RETRY SCAN
        </TerminalButton>
        <TerminalButton variant="back" onClick={() => navigate('/menu')}>
          {'<'} BACK TO MENU
        </TerminalButton>
      </TerminalLayout>
    );
  }

  // Loading screen
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
            {loadingLogs.map((line, i) => (
              <span key={i} className="block fade-in">{line}</span>
            ))}
          </div>
        </div>
      </TerminalLayout>
    );
  }

  // Upload screen — single step, video only
  return (
    <TerminalLayout title="SCAN" syslog="Record a 30-second video walkthrough of your room. Upload it here.">
      <div className="border border-border bg-muted p-3 mb-3.5">
        <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
          VIDEO WALKTHROUGH SCAN
        </div>
        <div className="text-muted-foreground text-xs mb-3 font-body leading-relaxed whitespace-pre-wrap">
          Record a ~30 second video of your room.{'\n'}Walk slowly through the space — get every corner.{'\n'}Talk while you walk. Describe what you see.{'\n'}The OS will extract frames and analyze everything.
        </div>
        <div className="text-accent text-[10px] tracking-widest mb-1">
          ⚠ VIDEO PRODUCES SIGNIFICANTLY BETTER RESULTS THAN PHOTOS
        </div>
        <div className="text-muted-foreground text-[10px] mb-2 font-body">
          8 frames will be extracted chronologically. Your narration helps the AI understand context.
        </div>
      </div>

      <div className={`border mb-3 bg-muted ${videoFile ? 'border-primary' : 'border-border border-dashed'}`}>
        <div className="px-3.5 py-3 flex justify-between items-center">
          <span className={`text-xs tracking-widest ${videoFile ? 'text-primary' : 'text-muted-foreground'}`}>
            VIDEO WALKTHROUGH
          </span>
          <span className={`text-[11px] ${videoFile ? 'text-primary' : 'text-muted-foreground'}`}>
            {videoFile ? '✓ LOADED' : 'AWAITING'}
          </span>
        </div>
        <div className="px-3.5 pb-3.5">
          {videoFile && (
            <div className="text-muted-foreground text-[10px] mb-2 font-body">
              ✓ {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
            </div>
          )}
          <label className={`block w-full border text-xs px-3 py-3 text-center cursor-pointer relative tracking-wide ${
            videoFile ? 'border-primary text-primary' : 'border-border text-muted-foreground'
          }`}>
            {'>'} {videoFile ? 'CHANGE VIDEO' : 'TAP TO RECORD OR UPLOAD VIDEO'}
            <input
              type="file"
              accept="video/*"
              capture="environment"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) setVideoFile(file);
              }}
            />
          </label>
        </div>
      </div>

      <TerminalButton
        variant="scan"
        disabled={!videoFile}
        onClick={analyzeVideo}
      >
        {'>'} ANALYZE VIDEO — BUILD SECTOR MAP
      </TerminalButton>

      <TerminalButton variant="back" onClick={() => navigate('/menu')}>
        {'<'} BACK TO MENU
      </TerminalButton>
    </TerminalLayout>
  );
}
