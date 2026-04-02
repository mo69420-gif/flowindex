import { useNavigate } from 'react-router-dom';
import { useFlow, sectorCleared, getCurrentStage } from '@/lib/flowContext';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';

export default function SectorMap() {
  const { state } = useFlow();
  const navigate = useNavigate();
  const { sectors, sectorOrder } = state;

  if (!sectorOrder.length) {
    navigate('/menu');
    return null;
  }

  const currentKey = getCurrentStage(state);
  const doneCount = sectorOrder.filter(k => sectorCleared(state, k)).length;
  const allConfirmed = sectorOrder.length > 0 && sectorOrder.every(k => state.confirmedSectors.includes(k));
  const allCleared = sectorOrder.length > 0 && sectorOrder.every(k => sectorCleared(state, k));

  return (
    <TerminalLayout title="SECTOR MAP" syslog={allCleared && !allConfirmed ? 'All sectors cleared. Confirm remaining sectors.' : `${doneCount}/${sectorOrder.length} sectors cleared.`}>
      <div className="border border-border bg-muted p-3 mb-3.5">
        <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
          {state.operationName}
        </div>
        <div className="text-muted-foreground text-xs mb-3 font-body">
          Sectors ordered by flow impact. Clear them in sequence.
        </div>

        <div className="flex flex-col gap-1.5">
          {sectorOrder.map((key, idx) => {
            const s = sectors[key];
            if (!s) return null;
            const cleared = sectorCleared(state, key);
            const confirmed = state.confirmedSectors.includes(key);
            const isCurrent = key === currentKey;
            const isLocked = !cleared && !isCurrent;

            if (cleared && confirmed) {
              return (
                <TerminalButton key={key} variant="cleared" onClick={() => navigate(`/sector/${key}`)}>
                  ✓ S{idx + 1}: {s.name}
                  <span className="float-right text-[10px] border border-primary/30 text-primary/50 px-1.5 py-0.5">
                    CLEARED
                  </span>
                </TerminalButton>
              );
            }
            if (cleared && !confirmed) {
              // Cleared but not confirmed — needs photo
              return (
                <TerminalButton key={key} onClick={() => navigate(`/sector/${key}/targets`)}>
                  {'>'} S{idx + 1}: {s.name}
                  <span className="float-right text-[10px] border border-accent text-accent px-1.5 py-0.5">
                    CONFIRM
                  </span>
                </TerminalButton>
              );
            }
            if (isLocked) {
              return (
                <TerminalButton key={key} variant="locked">
                  ◻ S{idx + 1}: ████████
                  <span className="float-right text-[10px] border border-border/30 text-muted-foreground/30 px-1.5 py-0.5">
                    LOCKED
                  </span>
                </TerminalButton>
              );
            }
            return (
              <TerminalButton key={key} onClick={() => navigate(`/sector/${key}`)}>
                {'>'} S{idx + 1}: {s.name}
                <span className="float-right text-[10px] border border-primary text-primary px-1.5 py-0.5">
                  ACTIVE ~{s.timeEstimate}min
                </span>
              </TerminalButton>
            );
          })}
        </div>
      </div>

      {/* Final review button when all cleared */}
      {allCleared && allConfirmed && (
        <TerminalButton variant="deploy" onClick={() => navigate('/review')}>
          {'>'} ALL SECTORS CLEAR — SUBMIT FINAL REVIEW
        </TerminalButton>
      )}

      {allCleared && !allConfirmed && (
        <div className="border border-accent bg-muted p-3 mt-3 text-center">
          <div className="text-accent text-xs tracking-widest mb-1">ALL TARGETS DONE</div>
          <div className="text-muted-foreground text-[11px] font-body">
            Confirm remaining sectors with photos before final review.
          </div>
        </div>
      )}

      <TerminalButton variant="back" onClick={() => navigate('/menu')}>
        {'<'} BACK TO MENU
      </TerminalButton>
    </TerminalLayout>
  );
}
