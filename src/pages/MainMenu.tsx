import { useNavigate } from 'react-router-dom';
import { useFlow, sectorCleared } from '@/lib/flowContext';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';

export default function MainMenu() {
  const { state, dispatch } = useFlow();
  const navigate = useNavigate();

  if (!state.username) {
    navigate('/');
    return null;
  }

  const { scanDone, sectorOrder, sectors } = state;
  const total = sectorOrder.length;
  const done = sectorOrder.filter(k => sectorCleared(state, k)).length;
  const allClear = done >= total && total > 0;

  const sectorLabel = !scanDone
    ? ' — SCAN FIRST'
    : allClear
    ? ' [ALL CLEAR]'
    : ` [STAGE ${done + 1}/${total}]`;

  const log = !scanDone
    ? "Scan your room. That's the only way this starts."
    : allClear
    ? 'ALL SECTORS CLEARED. RESCAN FOR A NEW OP.'
    : `Stage ${done + 1} of ${total} active. Hit SECTOR MAP.`;

  const handleReset = () => {
    dispatch({ type: 'RESET' });
    navigate('/');
  };

  return (
    <TerminalLayout title="ROOT" syslog={log}>
      <div className="border border-border bg-muted p-3">
        <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-3">
          MAIN MENU // {state.username}
        </div>
        <div className="flex flex-col gap-1.5">
          <TerminalButton onClick={() => navigate('/scan')}>
            {'>'} {scanDone ? 'RESCAN ROOM' : 'SCAN ROOM — START HERE'}
          </TerminalButton>
          <TerminalButton
            variant={!scanDone ? 'locked' : undefined}
            disabled={!scanDone}
            onClick={() => navigate('/sectors')}
          >
            {'>'} SECTOR MAP{sectorLabel}
          </TerminalButton>
          <TerminalButton
            variant={state.scenarios === 0 ? 'locked' : undefined}
            disabled={state.scenarios === 0}
            onClick={() => {/* scenarios history - future feature */}}
          >
            {'>'} SCENARIOS
          </TerminalButton>
        </div>
      </div>

      {/* Reset button */}
      <div className="mt-6">
        <TerminalButton variant="danger" onClick={handleReset}>
          {'>'} WIPE OS — FULL RESET
        </TerminalButton>
      </div>
    </TerminalLayout>
  );
}
