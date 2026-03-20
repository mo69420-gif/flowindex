import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFlow, sectorCleared } from '@/lib/flowContext';
import { supabase } from '@/integrations/supabase/client';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';

export default function OperationReview() {
  const { state, dispatch } = useFlow();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [reviewState, setReviewState] = useState<'upload' | 'verifying' | 'result'>('upload');
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<{
    rating: number;
    mood: string;
    roast: string;
    verdict: string;
  } | null>(null);

  const { sectors, sectorOrder, operationName, completedTargets, trash, loot } = state;
  const totalTargets = sectorOrder.reduce((a, k) => a + (sectors[k]?.targets.length ?? 0), 0);
  const sectorsCleared = sectorOrder.filter(k => sectorCleared(state, k)).length;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitReview = async () => {
    if (!photo) return;
    setReviewState('verifying');

    try {
      const { data, error } = await supabase.functions.invoke('analyze-room', {
        body: {
          mode: 'final_review',
          images: [{ label: 'final_review', dataUrl: photo }],
          operationName,
          stats: {
            sectors: sectorOrder.length,
            sectorsCleared,
            targets: totalTargets,
            targetsCompleted: completedTargets.length,
            trash,
            loot,
          },
        },
      });

      if (error) throw error;

      setResult(data);
      // Update mood based on AI review
      if (data?.mood) {
        dispatch({ type: 'SET_MOOD', payload: data.mood });
      }
      setReviewState('result');
    } catch {
      setResult({
        rating: 5,
        mood: 'CAUTIOUSLY OPTIMISTIC',
        roast: 'Verification unavailable. The AI assumes you did... something.',
        verdict: 'Operation status: inconclusive.',
      });
      setReviewState('result');
    }
  };

  const handleFinish = () => {
    dispatch({ type: 'ARCHIVE_SCENARIO' });
    navigate('/menu');
  };

  const ratingColor = (r: number) =>
    r >= 8 ? 'text-primary' : r >= 5 ? 'text-accent' : 'text-destructive';

  const ratingBar = (r: number) => {
    const filled = Math.min(10, r);
    return (
      <span className="font-display">
        <span className={ratingColor(r)}>{'█'.repeat(filled)}</span>
        <span className="text-border">{'░'.repeat(10 - filled)}</span>
      </span>
    );
  };

  return (
    <TerminalLayout title="OPERATION REVIEW" syslog={`${operationName} — final assessment pending.`}>
      {/* Op stats summary */}
      <div className="border border-border bg-muted p-3 mb-3">
        <div className="text-primary text-[13px] tracking-[2px] border-b border-border pb-1.5 mb-2">
          {operationName} — DEBRIEF
        </div>
        <div className="grid grid-cols-2 gap-y-1 text-xs mb-2">
          <span className="text-muted-foreground">SECTORS CLEARED</span>
          <span className="text-foreground text-right">{sectorsCleared}/{sectorOrder.length}</span>
          <span className="text-muted-foreground">TARGETS HIT</span>
          <span className="text-foreground text-right">{completedTargets.length}/{totalTargets}</span>
          <span className="text-muted-foreground">ITEMS PURGED</span>
          <span className="text-foreground text-right">{trash}</span>
          <span className="text-muted-foreground">LOOT SECURED</span>
          <span className="text-foreground text-right">{loot}</span>
        </div>
      </div>

      {/* Upload phase */}
      {reviewState === 'upload' && (
        <div className="border border-primary bg-muted p-3 mb-3">
          <div className="text-primary text-xs tracking-widest mb-2">FINAL VERIFICATION REQUIRED</div>
          <div className="text-muted-foreground text-[11px] font-body mb-3 leading-relaxed">
            Take a follow-up photo or panoramic of the space NOW.{'\n'}
            The AI will compare against what it saw before and rate your performance.{'\n'}
            This determines your final SYS_MOOD rating.
          </div>

          {!photo && (
            <div className="border border-dashed border-border p-3 mb-3">
              <TerminalButton variant="scan" onClick={() => fileRef.current?.click()}>
                {'>'} UPLOAD FOLLOW-UP PHOTO
              </TerminalButton>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>
          )}

          {photo && (
            <div className="border border-primary/30 p-3 mb-3">
              <div className="text-primary/60 text-[10px] tracking-widest mb-2">PHOTO CAPTURED</div>
              <img src={photo} alt="Final review" className="w-full h-32 object-cover border border-border mb-2 opacity-80" />
              <TerminalButton variant="confirm" onClick={handleSubmitReview}>
                {'>'} SUBMIT FOR FINAL AI REVIEW
              </TerminalButton>
            </div>
          )}
        </div>
      )}

      {/* Verifying */}
      {reviewState === 'verifying' && (
        <div className="border border-primary/30 p-3 mb-3 text-center">
          <div className="text-primary text-xs tracking-widest animate-pulse">
            AI REVIEWING OPERATION RESULTS...
          </div>
          <div className="text-muted-foreground text-[10px] mt-2 font-body">
            Comparing before and after. Generating judgment.
          </div>
        </div>
      )}

      {/* Result */}
      {reviewState === 'result' && result && (
        <>
          {/* Rating */}
          <div className="border border-border bg-muted p-3 mb-3">
            <div className="text-primary text-[11px] tracking-widest mb-2">PERFORMANCE RATING</div>
            <div className="flex items-center gap-3 mb-2">
              {ratingBar(result.rating)}
              <span className={`text-sm font-display ${ratingColor(result.rating)}`}>
                {result.rating}/10
              </span>
            </div>
            <div className="text-[11px] tracking-widest mb-1">
              <span className="text-muted-foreground">SYS_MOOD: </span>
              <span className="text-destructive">{result.mood}</span>
            </div>
          </div>

          {/* AI Verdict */}
          <div className="border border-primary/40 bg-muted p-3 mb-3">
            <div className="text-primary text-[11px] tracking-widest mb-2">AI VERDICT</div>
            <div className="text-accent text-xs font-body mb-3 leading-relaxed italic">
              "{result.verdict}"
            </div>
            <div className="text-muted-foreground text-[11px] font-body leading-relaxed border-l-2 border-destructive pl-3">
              {result.roast}
            </div>
          </div>

          {/* Skip / Finish */}
          <TerminalButton variant="confirm" onClick={handleFinish}>
            {'>'} CLOSE OPERATION — RETURN TO BASE
          </TerminalButton>
        </>
      )}

      {/* Skip review option */}
      {reviewState === 'upload' && (
        <TerminalButton variant="back" onClick={handleFinish}>
          {'<'} SKIP REVIEW — CLOSE OPERATION
        </TerminalButton>
      )}
    </TerminalLayout>
  );
}
