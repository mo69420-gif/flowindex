import { formatClock, getElapsedSeconds, useMissionClock } from '@/hooks/useMissionClock';

interface MissionTimerPanelProps {
  overallEstimateMin: number;
  overallStartedAt?: string | null;
  sectionEstimateMin?: number | null;
  sectionStartedAt?: string | null;
  sectionLabel?: string;
}

interface TimerCardProps {
  label: string;
  estimateMin: number;
  startedAt?: string | null;
  nowMs: number;
  helper: string;
}

function TimerCard({ label, estimateMin, startedAt, nowMs, helper }: TimerCardProps) {
  const budgetSeconds = Math.max(60, estimateMin * 60);
  const elapsedSeconds = getElapsedSeconds(startedAt, nowMs);
  const remainingSeconds = budgetSeconds - elapsedSeconds;
  const isRunning = Boolean(startedAt);
  const isOvertime = isRunning && remainingSeconds < 0;
  const progressWidth = isRunning ? Math.min(100, (elapsedSeconds / budgetSeconds) * 100) : 0;

  const statusClass = !isRunning
    ? 'text-muted-foreground'
    : isOvertime
      ? 'text-destructive'
      : 'text-primary';

  const badgeLabel = !isRunning ? 'READY' : isOvertime ? 'OVERTIME' : 'ON TRACK';
  const headline = !isRunning
    ? `${estimateMin}M BUDGET`
    : isOvertime
      ? `+${formatClock(Math.abs(remainingSeconds))}`
      : formatClock(remainingSeconds);

  const subline = !isRunning
    ? 'Starts when you deploy.'
    : `Elapsed ${formatClock(elapsedSeconds)} / ${estimateMin}m est.`;

  return (
    <div className="border border-border bg-muted p-3">
      <div className="flex items-center justify-between gap-2 border-b border-border pb-1.5 mb-2">
        <span className="text-primary text-[11px] tracking-widest">{label}</span>
        <span className={`text-[10px] tracking-widest ${statusClass}`}>{badgeLabel}</span>
      </div>

      <div className={`text-xl tracking-[3px] font-display tabular-nums ${statusClass}`}>{headline}</div>
      <div className="text-muted-foreground text-[10px] mt-1 font-body leading-relaxed">{helper}</div>
      <div className="text-muted-foreground text-[10px] mt-1 font-body">{subline}</div>

      <div className="h-1 w-full bg-border mt-3">
        <div
          className={`h-1 transition-all duration-700 ${isOvertime ? 'bg-destructive' : 'bg-primary'}`}
          style={{ width: `${progressWidth}%` }}
        />
      </div>
    </div>
  );
}

export default function MissionTimerPanel({
  overallEstimateMin,
  overallStartedAt,
  sectionEstimateMin,
  sectionStartedAt,
  sectionLabel,
}: MissionTimerPanelProps) {
  const nowMs = useMissionClock(Boolean(overallStartedAt || sectionStartedAt));

  return (
    <div className="grid gap-2 mb-3 sm:grid-cols-2">
      <TimerCard
        label="OVERALL TIMER"
        estimateMin={overallEstimateMin}
        startedAt={overallStartedAt}
        nowMs={nowMs}
        helper="Total mission budget. Keep this visible."
      />

      <TimerCard
        label={sectionLabel ? `${sectionLabel} TIMER` : 'SECTOR TIMER'}
        estimateMin={sectionEstimateMin ?? 1}
        startedAt={sectionStartedAt}
        nowMs={nowMs}
        helper={sectionLabel ? `Active sector: ${sectionLabel}` : 'Deploy a sector to start section timing.'}
      />
    </div>
  );
}
