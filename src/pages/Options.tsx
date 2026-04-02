import { useNavigate } from 'react-router-dom';
import { useFlow } from '@/lib/flowContext';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';

export default function Options() {
  const { state, dispatch } = useFlow();
  const navigate = useNavigate();

  const handleResetScenario = () => {
    if (state.scanDone && state.sectorOrder.length > 0) {
      dispatch({ type: 'ARCHIVE_SCENARIO' });
    }
    dispatch({ type: 'RESET_SCENARIO' });
    navigate('/menu');
  };

  const handleHardReset = () => {
    dispatch({ type: 'HARD_RESET' });
    navigate('/');
  };

  return (
    <TerminalLayout title="OPTIONS" syslog="Settings and resets. Handle with care." showMatrix={false}>
      <div className="border border-border bg-muted p-3 mb-3">
        <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
          OPTIONS
        </div>
        <div className="flex flex-col gap-1.5">
          <TerminalButton onClick={() => navigate('/explainer')}>
            {'>'} VIEW SYSTEM BRIEFING
          </TerminalButton>
        </div>
      </div>

      <div className="border border-destructive/20 bg-muted p-3 mb-3">
        <div className="text-destructive tracking-widest text-[11px] border-b border-destructive/20 pb-1.5 mb-2">
          DANGER ZONE
        </div>
        <div className="text-muted-foreground text-[10px] mb-3 font-body">
          Resets live here. Not on the main menu.
        </div>
        <div className="flex flex-col gap-1.5">
          {state.scanDone && (
            <TerminalButton variant="danger" onClick={handleResetScenario}>
              {'>'} RESET CURRENT SCENARIO [KEEP HISTORY]
            </TerminalButton>
          )}
          <TerminalButton variant="danger" onClick={handleHardReset}>
            {'>'} HARD RESET [WIPE EVERYTHING EXCEPT HISTORY]
          </TerminalButton>
        </div>
      </div>

      <TerminalButton variant="back" onClick={() => navigate('/menu')}>
        {'<'} BACK TO MENU
      </TerminalButton>
    </TerminalLayout>
  );
}
