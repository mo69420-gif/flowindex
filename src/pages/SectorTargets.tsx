import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFlow, sectorCleared } from '@/lib/flowContext';
import { supabase } from '@/integrations/supabase/client';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';

export default function SectorTargets() {
  const { key } = useParams<{ key: string }>();
  const { state, dispatch } = useFlow();
  const navigate = useNavigate();

  const [verifyState, setVerifyState] = useState<'idle' | 'uploading' | 'confirm' | 'verifying' | 'result'>('idle');
  const [verifyPhoto, setVerifyPhoto] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ verified: boolean; tone: string; message: string } | null>(null);
  const [attackSuggestion, setAttackSuggestion] = useState<string | null>(null);
  const [loadingAttack, setLoadingAttack] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const sector = key ? state.sectors[key] : null;
  const allDone = key ? sectorCleared(state, key) : false;

  // Load attack suggestion (v4.4: moved here from SectorDetail)
  useEffect(() => {
    if (!sector || !key || allDone) return;
    // Use pre-generated suggestion from scan if available
    if (sector.attackSuggestion) {
      setAttackSuggestion(sector.attackSuggestion);
      return;
    }
    setLoadingAttack(true);
    supabase.functions.invoke('analyze-room', {
      body: {
        mode: 'attack_suggestion',
        sectorName: sector.name,
        sectorDesc: sector.desc,
        sectorTargets: sector.targets.map(t => ({ label: t.label, tier: t.tier })),
      },
    }).then(({ data, error }) => {
      if (!error && data?.suggestion) {
        setAttackSuggestion(data.suggestion);
      } else {
        setAttackSuggestion("Clear Tier 1 targets first — they're blocking everything else. Work outward from the biggest obstruction. Don't stop once you start.");
      }
      setLoadingAttack(false);
    }).catch(() => {
      setAttackSuggestion("Clear Tier 1 targets first — they're blocking everything else. Work outward from the biggest obstruction. Don't stop once you start.");
      setLoadingAttack(false);
    });
  }, [key]);

  const handleAction = (targetId: string, action: string) => {
    const target = sector.targets.find(t => t.id === targetId);
    if (!target) return;
    dispatch({
      type: 'COMPLETE_TARGET',
      payload: { targetId, action, trash: target.trash, loot: target.loot },
    });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVerifyState('uploading');
    const reader = new FileReader();
    reader.onload = () => {
      setVerifyPhoto(reader.result as string);
      setVerifyState('confirm'); // v4.4: "Are you sure?" step
    };
    reader.readAsDataURL(file);
  };

  const handleVerify = async () => {
    if (!verifyPhoto) return;
    setVerifyState('verifying');
    try {
      const sectorTargetContext = sector.targets.map(t => ({
        label: t.label,
        action: state.targetActions[t.id] || 'unknown',
      }));

      const { data, error } = await supabase.functions.invoke('analyze-room', {
        body: {
          mode: 'verify',
          images: [{ label: 'confirm', dataUrl: verifyPhoto }],
          sectorName: sector.name,
          sectorDesc: sector.desc,
          elapsedMin: elapsed,
          timeEstimate: sector.timeEstimate,
          sectorTargets: sectorTargetContext,
        },
      });
      if (error) throw error;

      // v4.4: Apply penalty for wrong photo
      if (data && !data.verified) {
        dispatch({ type: 'ADD_PENALTY', payload: { sectorKey: key, points: 5 } });
      }

      setVerifyResult(data);
      setVerifyState('result');
    } catch {
      setVerifyResult({ verified: true, tone: 'neutral', message: 'Verification unavailable — passing you through.' });
      setVerifyState('result');
    }
  };

  const handleConfirm = () => {
    dispatch({ type: 'CONFIRM_SECTOR', payload: key });
    navigate('/sectors');
  };

  const getActionLabel = (action: string) => {
    if (action === 'purge') return 'PURGED';
    if (action === 'claim') return 'CLAIMED';
    if (action === 'exile') return 'EXILED';
    return '';
  };

  const toneClass = verifyResult?.tone === 'hostile' ? 'border-destructive text-destructive'
    : verifyResult?.tone === 'reward' ? 'border-primary text-primary'
    : 'border-muted-foreground text-muted-foreground';

  return (
    <TerminalLayout title={`TARGETS — ${sector.name}`} syslog={`${doneCount}/${sector.targets.length} targets processed.`}>
      <div className="border border-border bg-muted p-3 mb-3">
        <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
          {sector.name} — TARGETS
        </div>
        <div className="text-muted-foreground text-xs mb-2 font-body">{sector.desc}</div>

        {elapsed !== null && (
          <div className={`text-[11px] mb-3 ${elapsed > sector.timeEstimate * 2 ? 'text-destructive' : elapsed > sector.timeEstimate ? 'text-destructive' : 'text-primary'}`}>
            ⏱ {elapsed} MIN ELAPSED / {sector.timeEstimate} MIN EST.
            {elapsed > sector.timeEstimate * 2 && ' — WAY OVER. EMBARRASSING.'}
            {elapsed > sector.timeEstimate && elapsed <= sector.timeEstimate * 2 && ' — RUNNING SLOW.'}
          </div>
        )}
      </div>

      {/* Attack Suggestion (v4.4: moved here from SectorDetail, only shown when targets remain) */}
      {!allDone && (
        <div className="border border-accent/30 bg-muted p-3 mb-3">
          <div className="text-accent tracking-widest text-[11px] border-b border-border pb-1.5 mb-2">
            TACTICAL RECOMMENDATION
          </div>
          <div className="text-muted-foreground text-xs font-body leading-relaxed">
            {loadingAttack ? (
              <span className="animate-pulse">Generating tactical recommendation...</span>
            ) : (
              attackSuggestion
            )}
          </div>
        </div>
      )}

      {/* Target blocks */}
      {sector.targets.map(target => {
        const isDone = state.completedTargets.includes(target.id);
        const action = state.targetActions[target.id];
        const actionLabel = getActionLabel(action);

        // v4.4: Show exact points earned
        const purgePoints = Math.round(target.trash * 1.5);
        const claimPoints = Math.round(target.loot * 1.5);
        const exileTrash = Math.round(target.trash * 0.5);
        const exileLoot = Math.round(target.loot * 0.5);

        return (
          <div key={target.id} className={`border p-3 mb-2 ${isDone ? 'border-primary/20' : 'border-border'}`}>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] px-1.5 py-0.5 border tier-${target.tier}`}>
                TIER {target.tier}
              </span>
              <span className={`text-xs ${isDone ? 'text-primary/60' : 'text-foreground'}`}>
                {target.label}
              </span>
              {isDone && (
                <span className="text-[10px] px-1.5 py-0.5 border border-primary/30 text-primary/60 ml-auto">
                  {actionLabel}
                </span>
              )}
            </div>
            <div className="text-muted-foreground text-[11px] mb-2 pl-1 border-l-2 border-border leading-relaxed font-body">
              ⚠ {target.why}
            </div>
            <div className="text-muted-foreground text-[11px] mb-2">
              EFFORT: {target.trash} | VALUE: {target.loot}
            </div>
            {!isDone && (
              <div className="flex flex-col gap-1">
                <TerminalButton variant="eliminate" onClick={() => handleAction(target.id, 'purge')}>
                  {'>'} PURGE — throw it out &nbsp;+{purgePoints} PURGED
                </TerminalButton>
                <TerminalButton variant="salvage" onClick={() => handleAction(target.id, 'claim')}>
                  {'>'} CLAIM — keep & organize &nbsp;+{claimPoints} CLAIMED
                </TerminalButton>
                <TerminalButton variant="relocate" onClick={() => handleAction(target.id, 'exile')}>
                  {'>'} EXILE — move out of zone &nbsp;+{exileTrash}/{exileLoot}
                </TerminalButton>
              </div>
            )}
          </div>
        );
      })}

      {/* Confirmation with photo verification */}
      {allDone && !state.confirmedSectors.includes(key) && (
        <div className="border border-primary bg-muted p-3 mt-3">
          <div className="text-primary text-xs tracking-widest mb-2">ALL TARGETS PROCESSED</div>
          <div className="text-muted-foreground text-[11px] font-body mb-3 leading-relaxed">
            Take a photo of THIS SPECIFIC SECTOR showing visible improvement.{'\n'}
            Wrong room, meme, selfie, or random photo = rejected + score penalty.
          </div>

          {penalties > 0 && (
            <div className="border border-destructive bg-destructive/5 p-2 mb-3 text-destructive text-[11px]">
              ⚠ {penalties} wrong photo penalt{penalties === 1 ? 'y' : 'ies'} applied (-{penalties * 5} pts)
            </div>
          )}

          {verifyState === 'idle' && (
            <div className="border border-dashed border-border p-3 mb-3">
              <div className="relative">
                <TerminalButton variant="scan" onClick={() => fileRef.current?.click()}>
                  {'>'} UPLOAD CONFIRMATION PHOTO
                </TerminalButton>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </div>
            </div>
          )}

          {/* v4.4: "Are you sure?" confirmation step */}
          {verifyState === 'confirm' && verifyPhoto && (
            <div className="border border-accent/30 p-3 mb-3">
              <div className="text-accent text-[10px] tracking-widest mb-2">PHOTO CAPTURED</div>
              <img src={verifyPhoto} alt="Confirmation" className="w-full h-32 object-cover border border-border mb-2 opacity-80" />
              <div className="border border-accent p-2 mb-3 text-accent text-[11px] font-body leading-relaxed">
                ⚠ ARE YOU SURE this photo shows {sector.name}?{'\n'}
                Submitting an unrelated photo will cost you points.
              </div>
              <TerminalButton variant="confirm" onClick={handleVerify}>
                {'>'} CONFIRM — I'M SURE THIS IS {sector.name}
              </TerminalButton>
              <TerminalButton variant="back" onClick={() => {
                setVerifyState('idle');
                setVerifyPhoto(null);
              }}>
                {'<'} RETAKE
              </TerminalButton>
            </div>
          )}

          {verifyState === 'uploading' && (
            <div className="border border-primary/30 p-3 mb-3 text-center">
              <div className="text-primary text-xs tracking-widest animate-pulse">
                LOADING PHOTO...
              </div>
            </div>
          )}

          {verifyState === 'verifying' && (
            <div className="border border-primary/30 p-3 mb-3 text-center">
              <div className="text-primary text-xs tracking-widest animate-pulse">
                VERIFYING CONFIRMATION PHOTO...
              </div>
            </div>
          )}

          {verifyState === 'result' && verifyResult && (
            <div className={`border p-3 mb-3 ${toneClass}`}>
              <div className="text-xs tracking-widest mb-1">
                {verifyResult.verified ? '✓ VERIFICATION PASSED' : '✗ VERIFICATION FAILED'}
              </div>
              <div className="text-[11px] font-body">{verifyResult.message}</div>
              {!verifyResult.verified && penalties > 0 && (
                <div className="text-destructive text-[10px] mt-1">-5 pts penalty applied</div>
              )}
            </div>
          )}

          {verifyResult?.verified && (
            <TerminalButton variant="confirm" onClick={handleConfirm}>
              {'>'} CONFIRM — SECTOR CLEARED
            </TerminalButton>
          )}

          {verifyResult && !verifyResult.verified && (
            <TerminalButton variant="default" onClick={() => {
              setVerifyState('idle');
              setVerifyPhoto(null);
              setVerifyResult(null);
            }}>
              {'>'} RETAKE PHOTO
            </TerminalButton>
          )}
        </div>
      )}

      {state.confirmedSectors.includes(key) && (
        <div className="border border-primary/30 p-3 mt-3 text-primary/60 text-xs text-center tracking-widest">
          ✓ SECTOR CONFIRMED — RESULTS LOCKED
        </div>
      )}

      <TerminalButton variant="back" onClick={() => navigate(`/sector/${key}`)}>
        {'<'} BACK TO SECTOR DETAIL
      </TerminalButton>
    </TerminalLayout>
  );
}
