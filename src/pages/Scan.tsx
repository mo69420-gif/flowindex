import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlow } from '@/lib/flowContext';
import { LOADING_LINES } from '@/lib/mockData';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';
import { supabase } from '@/integrations/supabase/client';
import type { Directive } from '@/lib/types';

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Scan() {
  const { state, dispatch } = useFlow();
  const navigate = useNavigate();
  const [step, setStep] = useState<'panoramic' | 'directives' | 'loading' | 'error'>('panoramic');
  const [panoFile, setPanoFile] = useState<File | null>(null);
  const [directiveFiles, setDirectiveFiles] = useState<Record<string, File>>({});
  const [loadingPct, setLoadingPct] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [loadingLogs, setLoadingLogs] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [aiDirectives, setAiDirectives] = useState<Directive[]>([]);
  const [customLoadingLines, setCustomLoadingLines] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const abortRef = useRef(false);

  // v4.4: Redirect to explainer if not seen
  useEffect(() => {
    if (!state.seenExplainer) {
      navigate('/explainer');
    }
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const directives = aiDirectives.length > 0 ? aiDirectives : state.directives;

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
      pct += Math.floor(Math.random() * 5) + 2;
      if (pct > 90) pct = 90;
      setLoadingPct(pct);

      if (lineIdx < activeLoadingLines.length) {
        setLoadingMsg(activeLoadingLines[lineIdx]);
        setLoadingLogs(prev => [...prev.slice(-4), activeLoadingLines[lineIdx]]);
        lineIdx++;
      }
    }, 800);
  };

  const stopLoadingAnimation = () => {
    abortRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const analyzePanoramic = async () => {
    if (!panoFile) return;
    setStep('loading');
    startLoadingAnimation();

    try {
      const dataUrl = await fileToDataUrl(panoFile);

      // Fire panoramic analysis AND loading lines generation in parallel
      const [panoResult, loadingResult] = await Promise.allSettled([
        supabase.functions.invoke('analyze-room', {
          body: { mode: 'panoramic', images: [{ label: 'panoramic', dataUrl }] },
        }),
        supabase.functions.invoke('analyze-room', {
          body: { mode: 'generate_loading_lines', images: [{ label: 'panoramic', dataUrl }] },
        }),
      ]);

      stopLoadingAnimation();

      // Handle loading lines result
      if (loadingResult.status === 'fulfilled' && loadingResult.value.data?.lines) {
        setCustomLoadingLines(loadingResult.value.data.lines);
        dispatch({ type: 'SET_LOADING_LINES', payload: loadingResult.value.data.lines });
      }

      // Handle panoramic result
      if (panoResult.status === 'rejected') throw new Error('Panoramic analysis failed');
      const { data, error } = panoResult.value;
      if (error) throw new Error(error.message || 'Panoramic analysis failed');
      if (data?.error) throw new Error(data.error);

      const dirs: Directive[] = (data.directives || []).map((d: any, i: number) => ({
        id: d.id || `D${i + 1}`,
        label: d.label || `DIRECTIVE ${i + 1}`,
        instruction: d.instruction || 'Take a photo of this area.',
      }));

      if (dirs.length === 0) throw new Error('AI returned no directives. Try a clearer photo.');

      setAiDirectives(dirs);
      dispatch({ type: 'SET_DIRECTIVES', payload: dirs });
      setLoadingPct(100);
      setTimeout(() => setStep('directives'), 500);
    } catch (e: any) {
      stopLoadingAnimation();
      setErrorMsg(e.message || 'Panoramic analysis failed');
      setStep('error');
    }
  };

  const runFullScan = async () => {
    setStep('loading');
    startLoadingAnimation();

    try {
      const images: { label: string; dataUrl: string }[] = [];
      for (const d of directives) {
        const file = directiveFiles[d.id];
        if (file) {
          const dataUrl = await fileToDataUrl(file);
          images.push({ label: d.label, dataUrl });
        }
      }
      if (images.length === 0) throw new Error('No photos captured. Go back and take photos.');

      const { data, error } = await supabase.functions.invoke('analyze-room', {
        body: { mode: 'full_scan', images },
      });

      stopLoadingAnimation();
      if (error) throw new Error(error.message || 'Scan failed');
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
        navigate('/briefing');
      }, 800);
    } catch (e: any) {
      stopLoadingAnimation();
      setErrorMsg(e.message || 'Full scan failed');
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
        <TerminalButton variant="scan" onClick={() => { setErrorMsg(''); setStep('panoramic'); }}>
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
      <TerminalLayout title="SCANNING" syslog="Analyzing. Do not close this screen.">
        <div className="border border-primary p-4 bg-muted">
          <div className="h-1 bg-border w-full mb-1.5">
            <div className="h-1 bg-primary transition-all duration-700" style={{ width: `${loadingPct}%` }} />
          </div>
          <div className="text-primary text-[11px] text-right mb-2">{loadingPct}%</div>
          <div className="text-primary text-xs tracking-wide mb-1.5 min-h-[18px]">
            [SYSTEM] {loadingMsg}
          </div>
          <div className="text-muted-foreground text-[11px] max-h-20 overflow-hidden">
            {loadingLogs.map((line, i) => (
              <span key={i} className="block fade-in">{line}</span>
            ))}
          </div>
        </div>
      </TerminalLayout>
    );
  }

  // Step 2: Directives
  if (step === 'directives') {
    return (
      <TerminalLayout title="SCAN_STEP_2" syslog="Follow each directive. Shoot exactly what was asked for.">
        <div className="border border-border bg-muted p-3 mb-3.5">
          <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
            SCAN // STEP 2 OF 2 — DIRECTIVES
          </div>
          <div className="text-muted-foreground text-xs mb-2 font-body leading-relaxed">
            Follow each directive exactly. Upload or take photos for each zone.
          </div>
          <div className="text-accent text-[10px] tracking-widest mb-4">
            TIP: REGULAR PHOTOS WORK FINE HERE
          </div>
        </div>

        {directives.map((d) => (
          <div
            key={d.id}
            className={`border p-3.5 mb-3 bg-muted ${directiveFiles[d.id] ? 'border-primary' : 'border-border border-dashed'}`}
          >
            <div className="text-accent text-xs tracking-widest mb-1">{d.label}</div>
            <div className="text-muted-foreground text-[11px] mb-3 leading-relaxed font-body">{d.instruction}</div>
            <label className={`block w-full border text-xs px-3 py-3 text-center cursor-pointer relative tracking-wide ${
              directiveFiles[d.id]
                ? 'border-primary text-primary'
                : 'border-border text-muted-foreground'
            }`}>
              {'>'} {directiveFiles[d.id] ? `✓ ${directiveFiles[d.id].name}` : 'UPLOAD OR TAKE PHOTO'}
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setDirectiveFiles(prev => ({ ...prev, [d.id]: file }));
                }}
              />
            </label>
          </div>
        ))}

        <TerminalButton variant="scan" onClick={runFullScan}>
          {'>'} RUN FULL SCAN — ANALYZE ROOM
        </TerminalButton>

        <TerminalButton variant="back" onClick={() => setStep('panoramic')}>
          {'<'} BACK TO PANORAMIC
        </TerminalButton>
      </TerminalLayout>
    );
  }

  // Step 1: Panoramic
  return (
    <TerminalLayout title="SCAN_STEP_1" syslog="Open phone camera. Switch to panoramic. Sweep. Upload.">
      <div className="border border-border bg-muted p-3 mb-3.5">
        <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
          SCAN // STEP 1 OF 2 — PANORAMIC
        </div>
        <div className="text-muted-foreground text-xs mb-3 font-body leading-relaxed whitespace-pre-wrap">
          Open your phone camera app. Switch to PANORAMIC mode.{'\n'}Sweep slowly across the entire space — left to right.{'\n'}Get everything in frame. Then come back and upload it here.
        </div>
        <div className="text-accent text-[10px] tracking-widest mb-1">
          ⚠ PANORAMIC PHOTOS PRODUCE SIGNIFICANTLY BETTER RESULTS
        </div>
        <div className="text-muted-foreground text-[10px] mb-2 font-body">
          The OS analyzes it and tells you exactly what follow-up shots it needs. Must be a real room.
        </div>
      </div>

      <div className={`border mb-3 bg-muted ${panoFile ? 'border-primary' : 'border-border border-dashed'}`}>
        <div className="px-3.5 py-3 flex justify-between items-center">
          <span className={`text-xs tracking-widest ${panoFile ? 'text-primary' : 'text-muted-foreground'}`}>
            PANORAMIC SHOT
          </span>
          <span className={`text-[11px] ${panoFile ? 'text-primary' : 'text-muted-foreground'}`}>
            {panoFile ? '✓ CAPTURED' : 'AWAITING'}
          </span>
        </div>
        <div className="px-3.5 pb-3.5">
          {!panoFile && (
            <div className="text-muted-foreground text-xs mb-3 font-body">
              Take panoramic with phone camera app, then upload here.
            </div>
          )}
          {panoFile && (
            <div className="text-muted-foreground text-[10px] mb-2 font-body">
              ✓ File loaded: {panoFile.name}
            </div>
          )}
          <label className={`block w-full border text-xs px-3 py-3 text-center cursor-pointer relative tracking-wide ${
            panoFile ? 'border-primary text-primary' : 'border-border text-muted-foreground'
          }`}>
           {'>'} {panoFile ? 'CHANGE PHOTO' : 'TAP TO UPLOAD PANORAMIC'}
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) setPanoFile(file);
              }}
            />
          </label>
        </div>
      </div>

      <TerminalButton
        variant="scan"
        disabled={!panoFile}
        onClick={analyzePanoramic}
      >
        {'>'} ANALYZE — GET DIRECTIVES
      </TerminalButton>

      <TerminalButton variant="back" onClick={() => navigate('/menu')}>
        {'<'} BACK
      </TerminalButton>
    </TerminalLayout>
  );
}
