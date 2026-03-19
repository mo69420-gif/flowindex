import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlow } from '@/lib/flowContext';
import { MOCK_SECTORS, MOCK_SECTOR_ORDER, MOCK_OPERATION_NAME, LOADING_LINES } from '@/lib/mockData';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';

export default function Scan() {
  const { dispatch } = useFlow();
  const navigate = useNavigate();
  const [step, setStep] = useState<'panoramic' | 'directives' | 'loading'>('panoramic');
  const [panoFile, setPanoFile] = useState<File | null>(null);
  const [directiveFiles, setDirectiveFiles] = useState<Record<string, File>>({});
  const [loadingPct, setLoadingPct] = useState(0);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [loadingLogs, setLoadingLogs] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Mock directives (in real version these come from AI panoramic analysis)
  const mockDirectives = [
    { id: 'D1', label: 'DIRECTIVE 1 — KITCHEN ZONE', instruction: 'Stand at the entrance. Shoot the counter and sink area. Get every surface in frame. I need to see what you\'ve been ignoring.' },
    { id: 'D2', label: 'DIRECTIVE 2 — DESK SECTOR', instruction: 'Face the desk straight on. Capture the full surface, cable situation behind, and that chair you\'ve been using as a closet.' },
    { id: 'D3', label: 'DIRECTIVE 3 — FLOOR ASSESSMENT', instruction: 'Point the camera down. Sweep the floor from wall to wall. I need to see every obstacle, textile, and abandoned item.' },
  ];

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startLoading = () => {
    setStep('loading');
    setLoadingPct(0);
    setLoadingLogs([]);
    let lineIdx = 0;
    let pct = 0;

    timerRef.current = setInterval(() => {
      pct += Math.floor(Math.random() * 8) + 3;
      if (pct > 100) pct = 100;
      setLoadingPct(pct);

      if (lineIdx < LOADING_LINES.length) {
        setLoadingMsg(LOADING_LINES[lineIdx]);
        setLoadingLogs(prev => [...prev.slice(-4), LOADING_LINES[lineIdx]]);
        lineIdx++;
      }

      if (pct >= 100) {
        clearInterval(timerRef.current);
        setTimeout(() => {
          dispatch({
            type: 'LOAD_SCAN',
            payload: {
              sectors: MOCK_SECTORS,
              sectorOrder: MOCK_SECTOR_ORDER,
              operationName: MOCK_OPERATION_NAME,
            },
          });
          navigate('/briefing');
        }, 800);
      }
    }, 700);
  };

  if (step === 'loading') {
    return (
      <TerminalLayout title="SCANNING" syslog="AI is analyzing. Do not close this screen.">
        <div className="border border-primary p-4 bg-muted">
          <div className="h-1 bg-border w-full mb-1.5">
            <div className="h-1 bg-primary transition-all duration-700" style={{ width: `${loadingPct}%` }} />
          </div>
          <div className="text-primary text-[11px] text-right mb-2">{loadingPct}%</div>
          <div className="text-primary text-xs tracking-wide mb-1.5 min-h-[18px]">
            [AI] {loadingMsg}
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

  if (step === 'directives') {
    return (
      <TerminalLayout title="SCAN_STEP_2" syslog="Follow each directive. Shoot exactly what AI asked for.">
        <div className="border border-border bg-muted p-3 mb-3.5">
          <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
            SCAN // STEP 2 OF 2 — AI DIRECTIVES
          </div>
          <div className="text-muted-foreground text-xs mb-4 font-body leading-relaxed">
            AI analyzed your space and needs these specific shots.{'\n'}Follow each directive exactly.
          </div>
        </div>

        {mockDirectives.map((d, i) => (
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
              {'>'} {directiveFiles[d.id] ? `✓ ${directiveFiles[d.id].name}` : 'TAP TO TAKE PHOTO'}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setDirectiveFiles(prev => ({ ...prev, [d.id]: file }));
                }}
              />
            </label>
          </div>
        ))}

        <TerminalButton
          variant="scan"
          onClick={startLoading}
        >
          {'>'} RUN FULL SCAN — ANALYZE WITH AI
        </TerminalButton>

        <TerminalButton variant="back" onClick={() => setStep('panoramic')}>
          {'<'} BACK TO PANORAMIC
        </TerminalButton>
      </TerminalLayout>
    );
  }

  // Step 1: Panoramic
  return (
    <TerminalLayout title="SCAN_STEP_1" syslog="One wide shot. AI analyzes and issues directives.">
      <div className="border border-border bg-muted p-3 mb-3.5">
        <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
          SCAN // STEP 1 OF 2 — PANORAMIC
        </div>
        <div className="text-muted-foreground text-xs mb-3 font-body leading-relaxed whitespace-pre-wrap">
          Take ONE wide panoramic shot of the entire space.{'\n'}Sweep slowly left to right. Get everything in frame.{'\n'}AI analyzes it and tells you exactly what follow-up shots it needs.
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
              Stand in the center. Sweep wide. Get everything.
            </div>
          )}
          <label className={`block w-full border text-xs px-3 py-3 text-center cursor-pointer relative tracking-wide ${
            panoFile ? 'border-primary text-primary' : 'border-border text-muted-foreground'
          }`}>
            {'>'} {panoFile ? `✓ ${panoFile.name}` : 'TAP TO TAKE PANORAMIC'}
            <input
              type="file"
              accept="image/*"
              capture="environment"
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
        onClick={() => setStep('directives')}
      >
        {'>'} ANALYZE — GET AI DIRECTIVES
      </TerminalButton>

      <TerminalButton variant="back" onClick={() => navigate('/menu')}>
        {'<'} BACK
      </TerminalButton>
    </TerminalLayout>
  );
}
