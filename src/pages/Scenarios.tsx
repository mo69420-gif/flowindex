import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlow, sectorCleared } from '@/lib/flowContext';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';

export default function Scenarios() {
  const { state, dispatch } = useFlow();
  const navigate = useNavigate();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const history = [...state.scenarioHistory].reverse();
  const lb = state.leaderboard || { purged: 0, claimed: 0, scenarios: 0, penalties: 0 };

  const totalOps = history.length;
  const totalTargets = history.reduce((a, h) => a + h.targetsCompleted, 0);

  // Current scenario info
  const hasActiveScan = state.scanDone && state.sectorOrder.length > 0;
  const allClear = hasActiveScan && state.sectorOrder.every(k => sectorCleared(state, k));
  const allConfirmed = hasActiveScan && state.sectorOrder.every(k => state.confirmedSectors.includes(k));

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
        ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch { return iso; }
  };

  return (
    <TerminalLayout
      title="SCENARIOS"
      syslog={totalOps === 0 ? 'No operations on record.' : `${totalOps} operation(s) logged. ${totalTargets} total targets neutralized.`}
    >
      {/* Current Scenario Block */}
      {hasActiveScan && (
        <div className="border border-primary/40 bg-muted p-3 mb-3.5">
          <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
            CURRENT SCENARIO // {state.operationName}
          </div>
          <div className="grid grid-cols-2 gap-y-0.5 text-xs mb-2">
            <StatRow label="OPERATOR" value={state.username || 'OPERATOR'} />
            <StatRow label="TARGETS" value={`${state.completedTargets.length}/${state.sectorOrder.reduce((a, k) => a + (state.sectors[k]?.targets.length ?? 0), 0)}`} />
            <StatRow label="STAGES" value={`${state.sectorOrder.filter(k => sectorCleared(state, k)).length}/${state.sectorOrder.length}`} />
            <StatRow label="PURGED" value={`${state.trash}`} />
            <StatRow label="CLAIMED" value={`${state.loot}`} />
            <StatRow label="SYS_MOOD" value={state.sysMood} />
          </div>
          <div className="flex flex-col gap-1.5 mt-2">
            {!allClear && (
              <TerminalButton onClick={() => navigate('/sectors')}>
                {'>'} CONTINUE OP
              </TerminalButton>
            )}
            {allClear && allConfirmed && !state.opReviewed && (
              <TerminalButton variant="deploy" onClick={() => navigate('/review')}>
                {'>'} SUBMIT FINAL REVIEW
              </TerminalButton>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard Stats */}
      <div className="border border-border bg-muted p-3 mb-3.5">
        <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
          LEADERBOARD STATS // {state.username || 'OPERATOR'}
        </div>
        <div className="space-y-1">
          <StatRow label="TOTAL PURGED" value={`${lb.purged} PTS`} />
          <StatRow label="TOTAL CLAIMED" value={`${lb.claimed} PTS`} />
          <StatRow label="OPS COMPLETED" value={String(lb.scenarios)} />
          <StatRow label="TOTAL PENALTIES" value={String(lb.penalties)} />
          <StatRow label="PERFORMANCE" value={`${state.performanceMedian} AVG`} />
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mb-3.5">
          <div className="text-primary tracking-widest text-[11px] mb-2">HISTORY // LAST 5 OPS</div>
          {history.slice(0, 5).map((record, i) => (
            <div
              key={i}
              className="border border-border bg-muted p-3 mb-2.5 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => navigate(`/scenario/${i}`)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="text-accent text-xs tracking-widest leading-tight">{record.operationName}</div>
                <div className="text-foreground text-[10px] flex-shrink-0 ml-2">{formatDate(record.date)}</div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
                <StatRow label="SECTORS" value={`${record.sectorsCleared}/${record.sectors}`} small />
                <StatRow label="TARGETS" value={`${record.targetsCompleted}/${record.targets}`} small />
                <StatRow label="PURGED" value={`${record.trash}`} small />
                <StatRow label="CLAIMED" value={`${record.loot}`} small />
              </div>
              <div className="mt-1.5 text-[10px] text-foreground flex justify-between">
                <span>OPERATOR: {record.username}</span>
                {record.mood && <span className="text-destructive">{record.mood}</span>}
              </div>
              <div className="text-primary/40 text-[10px] mt-1 tracking-widest">TAP FOR DETAILS →</div>
            </div>
          ))}
        </div>
      )}

      {history.length === 0 && (
        <div className="border border-dashed border-border p-4 text-center mb-3.5">
          <div className="text-muted-foreground text-xs tracking-widest mb-1">NO RECORDS</div>
          <div className="text-muted-foreground text-[11px] font-body">Complete a scan to start logging operations.</div>
        </div>
      )}

      {/* Danger Zone */}
      {history.length > 0 && (
        <div className="border border-destructive/20 bg-muted p-3 mb-3.5">
          <div className="text-destructive tracking-widest text-[11px] border-b border-destructive/20 pb-1.5 mb-2">
            ⚠ DANGER ZONE
          </div>
          {showClearConfirm ? (
            <div className="border border-accent p-3 mb-2">
              <div className="text-accent text-[11px] mb-2">Clear all scenario history? Leaderboard will be preserved.</div>
              <TerminalButton variant="danger" onClick={() => {
                dispatch({ type: 'CLEAR_SCENARIOS' });
                setShowClearConfirm(false);
              }}>
                {'>'} CONFIRM — CLEAR ALL HISTORY
              </TerminalButton>
              <TerminalButton variant="back" onClick={() => setShowClearConfirm(false)}>
                {'<'} CANCEL
              </TerminalButton>
            </div>
          ) : (
            <TerminalButton variant="danger" onClick={() => setShowClearConfirm(true)}>
              {'>'} CLEAR ALL SCENARIO HISTORY
            </TerminalButton>
          )}
        </div>
      )}

      <TerminalButton variant="back" onClick={() => navigate('/menu')}>
        {'<'} BACK TO MENU
      </TerminalButton>
    </TerminalLayout>
  );
}

function StatRow({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className={`flex justify-between ${small ? 'text-[11px]' : 'text-xs'} border-b border-border/50 py-0.5`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="text-primary">{value}</span>
    </div>
  );
}
