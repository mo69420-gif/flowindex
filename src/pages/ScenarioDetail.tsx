import { useParams, useNavigate } from 'react-router-dom';
import { useFlow } from '@/lib/flowContext';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';

export default function ScenarioDetail() {
  const { id } = useParams<{ id: string }>();
  const { state } = useFlow();
  const navigate = useNavigate();

  const idx = id ? parseInt(id, 10) : -1;
  const history = [...state.scenarioHistory].reverse();
  const record = idx >= 0 && idx < history.length ? history[idx] : null;

  if (!record) {
    navigate('/scenarios');
    return null;
  }

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) +
        ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch { return iso; }
  };

  const completionPct = record.targets > 0 ? Math.round((record.targetsCompleted / record.targets) * 100) : 0;
  const sectorPct = record.sectors > 0 ? Math.round((record.sectorsCleared / record.sectors) * 100) : 0;

  const ratingColor = completionPct >= 80 ? 'text-primary' : completionPct >= 50 ? 'text-accent' : 'text-destructive';

  return (
    <TerminalLayout title="OP DETAIL" syslog={`Reviewing ${record.operationName}.`}>
      {/* Header */}
      <div className="border border-primary bg-muted p-4 mb-3">
        <div className="text-primary text-sm tracking-[3px] mb-1">{record.operationName}</div>
        <div className="text-foreground text-[11px]">{formatDate(record.date)}</div>
        <div className="text-foreground text-[11px]">OPERATOR: {record.username}</div>
      </div>

      {/* Completion bars */}
      <div className="border border-border bg-muted p-3 mb-3">
        <div className="text-primary tracking-widest text-[11px] border-b border-border pb-1.5 mb-3">
          COMPLETION
        </div>
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-foreground">SECTORS</span>
            <span className={ratingColor}>{record.sectorsCleared}/{record.sectors} ({sectorPct}%)</span>
          </div>
          <div className="h-1.5 bg-border w-full">
            <div className="h-1.5 bg-primary transition-all" style={{ width: `${sectorPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-foreground">TARGETS</span>
            <span className={ratingColor}>{record.targetsCompleted}/{record.targets} ({completionPct}%)</span>
          </div>
          <div className="h-1.5 bg-border w-full">
            <div className="h-1.5 bg-primary transition-all" style={{ width: `${completionPct}%` }} />
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="border border-border bg-muted p-3 mb-3">
        <div className="text-primary tracking-widest text-[11px] border-b border-border pb-1.5 mb-2">
          SCORE BREAKDOWN
        </div>
        <div className="space-y-1">
          <Row label="PURGED" value={`${record.trash} PTS`} />
          <Row label="CLAIMED" value={`${record.loot} PTS`} />
          <Row label="TOTAL SCORE" value={`${record.trash + record.loot} PTS`} highlight />
          {(record.penalties ?? 0) > 0 && (
            <Row label="PENALTIES" value={`${record.penalties} WRONG PHOTOS`} danger />
          )}
        </div>
      </div>

      {/* Mood */}
      {record.mood && (
        <div className="border border-border bg-muted p-3 mb-3">
          <div className="text-primary tracking-widest text-[11px] border-b border-border pb-1.5 mb-2">
            FINAL MOOD
          </div>
          <div className="text-destructive text-sm tracking-widest font-display">
            {record.mood}
          </div>
        </div>
      )}

      <TerminalButton variant="back" onClick={() => navigate('/scenarios')}>
        {'<'} BACK TO SCENARIOS
      </TerminalButton>
    </TerminalLayout>
  );
}

function Row({ label, value, highlight, danger }: { label: string; value: string; highlight?: boolean; danger?: boolean }) {
  return (
    <div className="flex justify-between text-xs border-b border-border/50 py-0.5">
      <span className="text-foreground">{label}</span>
      <span className={danger ? 'text-destructive' : highlight ? 'text-primary' : 'text-foreground'}>{value}</span>
    </div>
  );
}
