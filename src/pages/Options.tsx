import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlow } from '@/lib/flowContext';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';

export default function Options() {
  const { state, dispatch } = useFlow();
  const navigate = useNavigate();
  const [confirmAction, setConfirmAction] = useState<'reset_scenario' | 'reset_os' | 'full_reset' | null>(null);
  const [fullResetStep, setFullResetStep] = useState(0); // 0=not started, 1=first confirm, 2=second confirm

  const handleConfirmedAction = () => {
    if (confirmAction === 'reset_scenario') {
      dispatch({ type: 'RESET_SCENARIO' });
      navigate('/menu');
    } else if (confirmAction === 'reset_os') {
      dispatch({ type: 'RESET_OS' });
      navigate('/');
    } else if (confirmAction === 'full_reset') {
      if (fullResetStep < 2) {
        setFullResetStep(fullResetStep + 1);
        return;
      }
      dispatch({ type: 'FULL_RESET' });
      navigate('/');
    }
    setConfirmAction(null);
    setFullResetStep(0);
  };

  const cancelConfirm = () => {
    setConfirmAction(null);
    setFullResetStep(0);
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

      {/* Danger Zone */}
      <div className="border border-destructive/20 bg-muted p-3 mb-3">
        <div className="text-destructive tracking-widest text-[11px] border-b border-destructive/20 pb-1.5 mb-2">
          ⚠ DANGER ZONE
        </div>
        <div className="text-muted-foreground text-[10px] mb-3 font-body">
          Resets live here. All destructive actions require confirmation.
        </div>

        {/* Confirm dialog overlay */}
        {confirmAction && (
          <div className="border border-accent bg-muted p-3 mb-3">
            <div className="text-accent text-[11px] tracking-widest mb-2">
              {confirmAction === 'reset_scenario' && '⚠ RESET CURRENT SCENARIO?'}
              {confirmAction === 'reset_os' && '⚠ RESET OS STATE?'}
              {confirmAction === 'full_reset' && (
                fullResetStep < 2 ? '⚠ FULL RESET — ARE YOU SURE?' : '⚠ FINAL CONFIRMATION — THIS WIPES EVERYTHING'
              )}
            </div>
            <div className="text-muted-foreground text-[10px] mb-3 font-body leading-relaxed">
              {confirmAction === 'reset_scenario' && 'This will archive the current op and wipe all active scenario data. Operator profile and history preserved.'}
              {confirmAction === 'reset_os' && 'This resets all OS state. Leaderboard stats will be preserved. Scenario history will be wiped.'}
              {confirmAction === 'full_reset' && (
                fullResetStep < 2
                  ? 'This wipes EVERYTHING including leaderboard. Only operator names are kept. This cannot be undone.'
                  : 'LAST CHANCE. After this, all data is gone. Leaderboard, history, everything. Confirm again to proceed.'
              )}
            </div>
            <TerminalButton variant="danger" onClick={handleConfirmedAction}>
              {'>'} {confirmAction === 'full_reset' && fullResetStep < 2 ? 'YES — CONTINUE' : 'CONFIRM'}
            </TerminalButton>
            <TerminalButton variant="back" onClick={cancelConfirm}>
              {'<'} CANCEL
            </TerminalButton>
          </div>
        )}

        {!confirmAction && (
          <div className="flex flex-col gap-1.5">
            {state.scanDone && (
              <TerminalButton variant="danger" onClick={() => setConfirmAction('reset_scenario')}>
                {'>'} RESET CURRENT SCENARIO [KEEP HISTORY]
              </TerminalButton>
            )}
            <TerminalButton variant="danger" onClick={() => setConfirmAction('reset_os')}>
              {'>'} RESET OS [KEEP LEADERBOARD]
            </TerminalButton>
            <TerminalButton variant="danger" onClick={() => { setConfirmAction('full_reset'); setFullResetStep(1); }}>
              {'>'} FULL RESET [WIPE EVERYTHING]
            </TerminalButton>
          </div>
        )}
      </div>

      <TerminalButton variant="back" onClick={() => navigate('/menu')}>
        {'<'} BACK TO MENU
      </TerminalButton>
    </TerminalLayout>
  );
}
