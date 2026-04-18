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

  const { scanDone, sectorOrder, sectors, opReviewed } = state;
  const total = sectorOrder.length;
  const done = sectorOrder.filter(k => sectorCleared(state, k)).length;
  const allClear = done >= total && total > 0;
  const allConfirmed = total > 0 && sectorOrder.every(k => state.confirmedSectors.includes(k));

  const opActive = scanDone && !allClear && !opReviewed;

  const log = !scanDone
    ? "No active operation. Start a new scan."
    : opReviewed
    ? 'Operation reviewed and archived. Start a new scenario or view history.'
    : allConfirmed
    ? 'ALL SECTORS CLEARED AND CONFIRMED. SUBMIT FINAL REVIEW.'
    : allClear
    ? 'ALL SECTORS CLEARED. CONFIRM REMAINING OR SUBMIT REVIEW.'
    : `Stage ${done + 1} of ${total} active. Hit SECTOR MAP.`;

  const handleNewScenario = () => {
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

  const scenarioCount = (state.scenarioHistory || []).length;
  const lb = state.leaderboard;

  return (
    <TerminalLayout title="ROOT" syslog={log}>
      {/* Operator Status Block */}
      <div className="border border-border bg-muted p-3 mb-3">
        <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
          OPERATOR // {state.username}
        </div>
        <div className="grid grid-cols-3 gap-2 text-[10px] tracking-wider text-muted-foreground mb-1">
          <div>OPS: <span className="text-primary">{scenarioCount}</span></div>
          <div>PURGED: <span className="text-primary">{lb?.purged || 0}</span></div>
          <div>CLAIMED: <span className="text-primary">{lb?.claimed || 0}</span></div>
        </div>
        {scanDone && !opReviewed && (
          <div className="text-accent text-[10px] tracking-widest mt-1">
            ACTIVE OP: {state.operationName || 'UNNAMED'}
          </div>
        )}
      </div>

      {/* Menu Actions */}
      <div className="border border-border bg-muted p-3">
        <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-3">
          MAIN MENU
        </div>
        <div className="flex flex-col gap-1.5">

          {/* Primary action — always visible, context-aware */}
          {(!scanDone || opReviewed) && (
            <TerminalButton variant="scan" onClick={handleNewScenario}>
              {'>'} {opReviewed ? 'NEW SCENARIO — SCAN ROOM' : 'SCAN ROOM — START HERE'}
            </TerminalButton>
          )}

          {/* During active op */}
          {opActive && (
            <TerminalButton variant="confirm" onClick={() => navigate('/sectors')}>
              {'>'} CONTINUE OP — SECTOR MAP [{done}/{total}]
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

          {/* Locked sector map */}
          {!scanDone && !opReviewed && (
            <TerminalButton variant="locked" disabled>
              {'>'} SECTOR MAP — SCAN FIRST
            </TerminalButton>
          )}

          <div className="border-t border-border my-1" />

          <TerminalButton onClick={() => navigate('/scenarios')}>
            {'>'} SCENARIOS [{scenarioCount}]
          </TerminalButton>
          <TerminalButton onClick={() => navigate('/options')}>
            {'>'} OPTIONS
          </TerminalButton>
          <TerminalButton variant="back" onClick={() => {
            dispatch({ type: 'SET_USERNAME', payload: '' as any });
            navigate('/');
          }}>
            {'<'} SWITCH OPERATOR
          </TerminalButton>
        </div>
      </div>
    </TerminalLayout>
  );
}
