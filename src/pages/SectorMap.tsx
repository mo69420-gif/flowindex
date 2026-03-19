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

  return (
    <TerminalLayout title="SECTOR MAP" syslog={`${doneCount}/${sectorOrder.length} sectors cleared.`}>
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
            const isCurrent = key === currentKey;
            const isLocked = !cleared && !isCurrent;

            if (cleared) {
              return (
                <TerminalButton key={key} variant="cleared" onClick={() => navigate(`/sector/${key}`)}>
                  ✓ {s.name}
                  <span className="float-right text-[10px] border border-primary/30 text-primary/50 px-1.5 py-0.5">
                    CLEARED
                  </span>
                </TerminalButton>
              );
            }
            if (isLocked) {
              return (
                <TerminalButton key={key} variant="locked">
                  ◻ {s.name}
                  <span className="float-right text-[10px] border border-border/30 text-muted-foreground/30 px-1.5 py-0.5">
                    LOCKED
                  </span>
                </TerminalButton>
              );
            }
            return (
              <TerminalButton key={key} onClick={() => navigate(`/sector/${key}`)}>
                {'>'} {s.name}
                <span className="float-right text-[10px] border border-primary text-primary px-1.5 py-0.5">
                  ACTIVE
                </span>
              </TerminalButton>
            );
          })}
        </div>
      </div>

      <TerminalButton variant="back" onClick={() => navigate('/menu')}>
        {'<'} BACK TO MENU
      </TerminalButton>
    </TerminalLayout>
  );
}
