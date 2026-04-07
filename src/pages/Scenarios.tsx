import { useNavigate } from 'react-router-dom';
import { useFlow } from '@/lib/flowContext';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';

export default function Scenarios() {
  const { state } = useFlow();
  const navigate = useNavigate();
  const history = [...state.scenarioHistory].reverse();

  const totalOps = history.length;
  const totalTrash = history.reduce((a, h) => a + h.trash, 0);
  const totalLoot = history.reduce((a, h) => a + h.loot, 0);
  const totalTargets = history.reduce((a, h) => a + h.targetsCompleted, 0);

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
      {/* Lifetime stats */}
      <div className="border border-border bg-muted p-3 mb-3.5">
        <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
          LIFETIME STATS
        </div>
        <div className="space-y-1">
          <StatRow label="OPERATIONS" value={String(totalOps)} />
          <StatRow label="TARGETS HIT" value={String(totalTargets)} />
          <StatRow label="TOTAL PURGED" value={`${totalTrash} PTS`} />
          <StatRow label="TOTAL CLAIMED" value={`${totalLoot} PTS`} />
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
                <div className="text-accent text-xs tracking-widest leading-tight">
                  {record.operationName}
                </div>
                <div className="text-foreground text-[10px] flex-shrink-0 ml-2">
                  {formatDate(record.date)}
                </div>
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
          <div className="text-muted-foreground text-[11px] font-body">
            Complete a scan to start logging operations.
          </div>
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
