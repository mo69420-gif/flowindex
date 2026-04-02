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
  const allConfirmed = total > 0 && sectorOrder.every(k => state.confirmedSectors.includes(k));

  // Determine what to show
  const opActive = scanDone && !allClear;

  const log = !scanDone
    ? "Scan your room. That's the only way this starts."
    : allConfirmed
    ? 'ALL SECTORS CLEARED AND CONFIRMED. SUBMIT FINAL REVIEW.'
    : allClear
    ? 'ALL SECTORS CLEARED. CONFIRM REMAINING OR SUBMIT REVIEW.'
    : `Stage ${done + 1} of ${total} active. Hit SECTOR MAP.`;

  const handleScanClick = () => {
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
          {/* Scan button: show when no scan or when all sectors confirmed (rescan) */}
          {!scanDone && (
            <TerminalButton onClick={handleScanClick}>
              {'>'} SCAN ROOM — START HERE
            </TerminalButton>
          )}

          {/* During active op: show continue button, NOT scan */}
          {opActive && (
            <TerminalButton onClick={() => navigate('/sectors')}>
              {'>'} CONTINUE OP — SECTOR MAP [STAGE {done + 1}/{total}]
            </TerminalButton>
          )}

          {/* All clear: show rescan + final review */}
          {allClear && (
            <>
              {allConfirmed && (
                <TerminalButton variant="deploy" onClick={() => navigate('/review')}>
                  {'>'} SUBMIT FINAL REVIEW
                </TerminalButton>
              )}
              <TerminalButton onClick={() => navigate('/sectors')}>
                {'>'} SECTOR MAP [ALL CLEAR]
              </TerminalButton>
              <TerminalButton onClick={handleScanClick}>
                {'>'} RESCAN ROOM
              </TerminalButton>
            </>
          )}

          {/* Sector map disabled before first scan */}
          {!scanDone && (
            <TerminalButton variant="locked" disabled>
              {'>'} SECTOR MAP — SCAN FIRST
            </TerminalButton>
          )}

          <TerminalButton onClick={() => navigate('/scenarios')}>
            {'>'} SCENARIOS
          </TerminalButton>
          <TerminalButton onClick={() => navigate('/options')}>
            {'>'} OPTIONS
          </TerminalButton>
        </div>
      </div>
    </TerminalLayout>
  );
}
