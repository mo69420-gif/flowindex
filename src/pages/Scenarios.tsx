import { useNavigate } from 'react-router-dom';
import { useFlow, sectorCleared } from '@/lib/flowContext';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';

export default function Scenarios() {
  const { state, dispatch } = useFlow();
  const navigate = useNavigate();
  const history = [...state.scenarioHistory].reverse();

  const totalOps = history.length;
  const totalTrash = history.reduce((a, h) => a + h.trash, 0);
  const totalLoot = history.reduce((a, h) => a + h.loot, 0);
  const totalTargets = history.reduce((a, h) => a + h.targetsCompleted, 0);

  // Current scenario info
  const { sectors, sectorOrder, operationName, completedTargets, trash, loot } = state;
  const curTotal = sectorOrder.reduce((a, k) => a + (sectors[k]?.targets.length ?? 0), 0);
  const curDone = completedTargets.length;
  const curPct = curTotal > 0 ? Math.round((curDone / curTotal) * 100) : 0;
  const stagesDone = sectorOrder.filter(k => sectorCleared(state, k)).length;

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
        ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch { return iso; }
  };

  const handleResetScenario = () => {
    if (state.sectors && sectorOrder.length > 0) {
      dispatch({ type: 'ARCHIVE_SCENARIO' });
    }
    dispatch({ type: 'RESET_SCENARIO' });
  };

  const handleHardReset = () => {
    dispatch({ type: 'HARD_RESET' });
    navigate('/');
  };

  return (
    <TerminalLayout
      title="SCENARIOS"
      syslog={totalOps === 0 && !state.scanDone ? 'No operations on record. Scan a room first.' : `${totalOps} operation(s) logged. ${totalTargets} total targets neutralized.`}
    >
      {/* Current scenario */}
      {state.scanDone && sectorOrder.length > 0 && (
        <div className="border border-border bg-muted p-3 mb-3.5">
          <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
            CURRENT SCENARIO // #{state.scenarios}
          </div>
          <div className="space-y-1">
            <StatRow label="OPERATOR" value={state.username || 'OPERATOR'} />
            <StatRow label="OPERATION" value={operationName || 'UNKNOWN'} />
            <StatRow label="TARGETS DONE" value={`${curDone}/${curTotal} (${curPct}%)`} />
            <StatRow label="STAGES CLEARED" value={`${stagesDone}/${sectorOrder.length}`} />
            <StatRow label="PURGED" value={String(trash)} />
            <StatRow label="CLAIMED" value={String(loot)} />
            <StatRow label="SYS_MOOD" value={state.sysMood} />
          </div>
        </div>
      )}

      {/* Lifetime stats */}
      <div className="border border-border bg-muted p-3 mb-3.5">
        <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
          LIFETIME STATS
        </div>
        <div className="space-y-1">
          <StatRow label="OPERATIONS" value={String(totalOps)} />
          <StatRow label="TARGETS HIT" value={String(totalTargets)} />
          <StatRow label="TOTAL PURGED" value={String(totalTrash)} />
          <StatRow label="TOTAL CLAIMED" value={String(totalLoot)} />
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mb-3.5">
          <div className="text-primary tracking-widest text-[11px] mb-2">HISTORY // LAST 5 OPS</div>
          {history.slice(0, 5).map((record, i) => (
            <div key={i} className="border border-border bg-muted p-3 mb-2.5">
              <div className="flex justify-between items-start mb-2">
                <div className="text-accent text-xs tracking-widest leading-tight">
                  {record.operationName}
                </div>
                <div className="text-muted-foreground text-[10px] flex-shrink-0 ml-2">
                  {formatDate(record.date)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
                <StatRow label="SECTORS" value={`${record.sectorsCleared}/${record.sectors}`} small />
                <StatRow label="TARGETS" value={`${record.targetsCompleted}/${record.targets}`} small />
                <StatRow label="PURGED" value={String(record.trash)} small />
                <StatRow label="CLAIMED" value={String(record.loot)} small />
              </div>
              <div className="mt-1.5 text-[10px] text-muted-foreground">
                OPERATOR: {record.username}
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length === 0 && !state.scanDone && (
        <div className="border border-dashed border-border p-4 text-center mb-3.5">
          <div className="text-muted-foreground text-xs tracking-widest mb-1">NO RECORDS</div>
          <div className="text-muted-foreground text-[11px] font-body">
            Complete a scan to start logging operations.
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="border border-destructive/20 bg-muted p-3 mb-3">
        <div className="text-destructive tracking-widest text-[11px] border-b border-destructive/20 pb-1.5 mb-2">
          DANGER ZONE
        </div>
        <div className="text-muted-foreground text-[10px] mb-3 font-body">
          Hard reset lives here. Not on the main menu.
        </div>
        <div className="flex flex-col gap-1.5">
          {state.scanDone && (
            <TerminalButton variant="danger" onClick={handleResetScenario}>
              {'>'} RESET CURRENT SCENARIO [KEEP HISTORY]
            </TerminalButton>
          )}
          <TerminalButton variant="danger" onClick={handleHardReset}>
            {'>'} HARD RESET [WIPE EVERYTHING]
          </TerminalButton>
        </div>
      </div>

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
