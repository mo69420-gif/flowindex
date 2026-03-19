import { useParams, useNavigate } from 'react-router-dom';
import { useFlow, sectorCleared } from '@/lib/flowContext';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';

export default function SectorTargets() {
  const { key } = useParams<{ key: string }>();
  const { state, dispatch } = useFlow();
  const navigate = useNavigate();

  const sector = key ? state.sectors[key] : null;
  if (!sector || !key) {
    navigate('/sectors');
    return null;
  }

  const allDone = sectorCleared(state, key);
  const doneCount = sector.targets.filter(t => state.completedTargets.includes(t.id)).length;

  // Timer
  const started = state.sectorStarted[key];
  let elapsed: number | null = null;
  if (started) {
    elapsed = Math.floor((Date.now() - new Date(started).getTime()) / 60000);
  }

  const handleAction = (targetId: string, action: string) => {
    const target = sector.targets.find(t => t.id === targetId);
    if (!target) return;
    dispatch({
      type: 'COMPLETE_TARGET',
      payload: { targetId, action, trash: target.trash, loot: target.loot },
    });
  };

  const handleConfirm = () => {
    dispatch({ type: 'CONFIRM_SECTOR', payload: key });
    navigate('/sectors');
  };

  return (
    <TerminalLayout title={`TARGETS — ${sector.name}`} syslog={`${doneCount}/${sector.targets.length} targets processed.`}>
      <div className="border border-border bg-muted p-3 mb-3">
        <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
          {sector.name} — TARGETS
        </div>
        <div className="text-muted-foreground text-xs mb-2 font-body">{sector.desc}</div>

        {/* Timer */}
        {elapsed !== null && (
          <div className={`text-[11px] mb-3 ${elapsed > sector.timeEstimate ? 'text-destructive' : 'text-primary'}`}>
            ⏱ {elapsed} MIN ELAPSED / {sector.timeEstimate} MIN EST.
            {elapsed > sector.timeEstimate && ' — OVER TIME'}
          </div>
        )}
      </div>

      {/* Target blocks */}
      {sector.targets.map(target => {
        const isDone = state.completedTargets.includes(target.id);
        const action = state.targetActions[target.id];
        const actionLabel = action === 'trash' ? 'ELIMINATED' : action === 'loot' ? 'SALVAGED' : action === 'relocate' ? 'RELOCATED' : '';

        return (
          <div
            key={target.id}
            className={`border p-3 mb-2 ${isDone ? 'border-primary/20' : 'border-border'}`}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] px-1.5 py-0.5 border tier-${target.tier}`}>
                TIER {target.tier}
              </span>
              <span className={`text-xs ${isDone ? 'text-primary/60' : 'text-foreground'}`}>
                {target.label}
              </span>
              {isDone && (
                <span className="text-[10px] px-1.5 py-0.5 border border-primary/30 text-primary/60 ml-auto">
                  {actionLabel}
                </span>
              )}
            </div>

            {/* Why */}
            <div className="text-muted-foreground text-[11px] mb-2 pl-1 border-l-2 border-border leading-relaxed font-body">
              {target.why}
            </div>

            {/* Scores */}
            <div className="text-muted-foreground text-[11px] mb-2">
              TRASH: +{target.trash} | LOOT: +{target.loot}
            </div>

            {/* Action buttons */}
            {!isDone && (
              <div className="flex flex-col gap-1">
                <TerminalButton variant="eliminate" onClick={() => handleAction(target.id, 'trash')}>
                  {'>'} ELIMINATE — TRASH IT (+{Math.round(target.trash * 1.5)} TRASH)
                </TerminalButton>
                <TerminalButton variant="salvage" onClick={() => handleAction(target.id, 'loot')}>
                  {'>'} SALVAGE — KEEP IT (+{Math.round(target.loot * 1.5)} LOOT)
                </TerminalButton>
                <TerminalButton variant="relocate" onClick={() => handleAction(target.id, 'relocate')}>
                  {'>'} RELOCATE — MOVE IT (+{Math.round(target.trash * 0.5)} / +{Math.round(target.loot * 0.5)})
                </TerminalButton>
              </div>
            )}
          </div>
        );
      })}

      {/* Confirmation */}
      {allDone && !state.confirmedSectors.includes(key) && (
        <div className="border border-primary bg-muted p-3 mt-3">
          <div className="text-primary text-xs tracking-widest mb-2">ALL TARGETS PROCESSED</div>
          <div className="text-muted-foreground text-[11px] font-body mb-3">
            Sector cleared. Confirm to lock results and advance to next stage.
          </div>
          <TerminalButton variant="confirm" onClick={handleConfirm}>
            {'>'} CONFIRM — SECTOR CLEARED
          </TerminalButton>
        </div>
      )}

      {state.confirmedSectors.includes(key) && (
        <div className="border border-primary/30 p-3 mt-3 text-primary/60 text-xs text-center tracking-widest">
          ✓ SECTOR CONFIRMED — RESULTS LOCKED
        </div>
      )}

      <TerminalButton variant="back" onClick={() => navigate(`/sector/${key}`)}>
        {'<'} BACK TO SECTOR DETAIL
      </TerminalButton>
    </TerminalLayout>
  );
}
