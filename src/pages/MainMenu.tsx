import { useNavigate } from 'react-router-dom';
import { useFlow, sectorCleared } from '@/lib/flowContext';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';

export default function MainMenu() {
  const { state } = useFlow();
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
    ? 'ALL SECTORS CLEARED. SUBMIT FINAL REVIEW OR RESCAN.'
    : `Stage ${done + 1} of ${total} active. Hit SECTOR MAP.`;

  // v4.4: Rescan only shows as deliberate choice after op complete or if not scanned
  // During active op, show "CONTINUE CURRENT OP — SECTOR MAP" instead
  const showScanButton = !scanDone || allClear;
  const scanLabel = !scanDone ? 'SCAN ROOM — START HERE' : 'RESCAN ROOM';

  const handleScanClick = () => {
    // Show explainer on first scan if not seen
    if (!state.seenExplainer) {
      navigate('/explainer');
    } else {
      navigate('/scan');
    }
  };

  return (
    <TerminalLayout title="ROOT" syslog={log}>
      <div className="border border-border bg-muted p-3">
        <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-3">
          MAIN MENU // {state.username}
        </div>
        <div className="flex flex-col gap-1.5">
          {showScanButton && (
            <TerminalButton onClick={handleScanClick}>
              {'>'} {scanLabel}
            </TerminalButton>
          )}
          <TerminalButton
            variant={!scanDone ? 'locked' : undefined}
            disabled={!scanDone}
            onClick={() => navigate('/sectors')}
          >
            {'>'} SECTOR MAP{sectorLabel}
          </TerminalButton>
          <TerminalButton
            onClick={() => navigate('/scenarios')}
          >
            {'>'} SCENARIOS + OPTIONS
          </TerminalButton>
        </div>
      </div>
    </TerminalLayout>
  );
}
