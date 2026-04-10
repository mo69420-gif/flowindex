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

  const { scanDone, sectorOrder, sectors, opReviewed } = state;
  const total = sectorOrder.length;
  const done = sectorOrder.filter(k => sectorCleared(state, k)).length;
  const allClear = done >= total && total > 0;
  const allConfirmed = total > 0 && sectorOrder.every(k => state.confirmedSectors.includes(k));

  const opActive = scanDone && !allClear && !opReviewed;

  const log = !scanDone
    ? "Scan your room. That's the only way this starts."
    : opReviewed
    ? 'Operation reviewed and archived. Start a new scenario or view history.'
    : allConfirmed
    ? 'ALL SECTORS CLEARED AND CONFIRMED. SUBMIT FINAL REVIEW.'
    : allClear
    ? 'ALL SECTORS CLEARED. CONFIRM REMAINING OR SUBMIT REVIEW.'
    : `Stage ${done + 1} of ${total} active. Hit SECTOR MAP.`;

  const handleNewScenario = () => {
    // Patch 5+6: Archive old scenario before starting new one
    if (scanDone && sectorOrder.length > 0 && !opReviewed) {
      dispatch({ type: 'ARCHIVE_SCENARIO' });
    }
    if (scanDone || opReviewed) {
      dispatch({ type: 'RESET_SCENARIO' });
    }
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
          {/* No scan yet or op reviewed — show new scenario */}
          {(!scanDone || opReviewed) && (
            <TerminalButton onClick={handleNewScenario}>
              {'>'} {opReviewed ? 'NEW SCENARIO' : 'SCAN ROOM — START HERE'}
            </TerminalButton>
          )}

          {/* During active op */}
          {opActive && (
            <TerminalButton onClick={() => navigate('/sectors')}>
              {'>'} CONTINUE OP — SECTOR MAP [STAGE {done + 1}/{total}]
            </TerminalButton>
          )}

          {/* All clear but not reviewed */}
          {allClear && !opReviewed && (
            <>
              {allConfirmed && (
                <TerminalButton variant="deploy" onClick={() => navigate('/review')}>
                  {'>'} SUBMIT FINAL REVIEW
                </TerminalButton>
              )}
              <TerminalButton onClick={() => navigate('/sectors')}>
                {'>'} SECTOR MAP [ALL CLEAR]
              </TerminalButton>
              <TerminalButton onClick={handleNewScenario}>
                {'>'} RESCAN ROOM
              </TerminalButton>
            </>
          )}

          {/* Sector map disabled before first scan */}
          {!scanDone && !opReviewed && (
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
