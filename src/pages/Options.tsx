import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlow } from '@/lib/flowContext';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';

export default function Options() {
  const { dispatch } = useFlow();
  const navigate = useNavigate();
  const [confirmReset, setConfirmReset] = useState(false);

  const handleConfirmedAction = () => {
    dispatch({ type: 'FULL_RESET' });
    setConfirmReset(false);
    navigate('/');
  };

  return (
    <TerminalLayout title="OPTIONS" syslog="One reset. No duplicate dead weight." showMatrix={false}>
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
          RESET OS
        </div>
        <div className="text-muted-foreground text-[10px] mb-3 font-body leading-relaxed">
          This wipes the current OS state and sends you back to boot. One action. One confirmation.
        </div>

        {confirmReset ? (
          <div className="border border-accent bg-muted p-3 mb-3">
            <div className="text-accent text-[11px] tracking-widest mb-2">⚠ RESET OS?</div>
            <div className="text-muted-foreground text-[10px] mb-3 font-body leading-relaxed">
              Full wipe. Scenario state, history, leaderboard, everything tracked in this build gets cleared.
            </div>
            <TerminalButton variant="danger" onClick={handleConfirmedAction}>
              {'>'} CONFIRM RESET OS
            </TerminalButton>
            <TerminalButton variant="back" onClick={() => setConfirmReset(false)}>
              {'<'} CANCEL
            </TerminalButton>
          </div>
        ) : (
          <TerminalButton variant="danger" onClick={() => setConfirmReset(true)}>
            {'>'} RESET OS
          </TerminalButton>
        )}
      </div>

      <TerminalButton variant="back" onClick={() => navigate('/menu')}>
        {'<'} BACK TO MENU
      </TerminalButton>
    </TerminalLayout>
  );
}
