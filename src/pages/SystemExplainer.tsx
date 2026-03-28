import { useNavigate } from 'react-router-dom';
import { useFlow } from '@/lib/flowContext';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';

export default function SystemExplainer() {
  const { dispatch } = useFlow();
  const navigate = useNavigate();

  const handleContinue = () => {
    dispatch({ type: 'SET_SEEN_EXPLAINER' });
    navigate('/scan');
  };

  return (
    <TerminalLayout title="SYSTEM BRIEFING" syslog="Read it. Know it. Now go clean something." showMatrix={false}>
      <div className="border border-border bg-muted p-3 mb-3.5">
        <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
          SYSTEM BRIEFING // HOW THIS WORKS
        </div>
        <div className="text-muted-foreground text-xs font-body">
          Read this once. The OS won't repeat itself.
        </div>
      </div>

      {/* Point System */}
      <div className="border border-border bg-muted p-3 mb-3">
        <div className="text-primary tracking-widest text-[11px] border-b border-border pb-1.5 mb-2">
          THE POINT SYSTEM
        </div>
        <div className="text-muted-foreground text-xs font-body leading-relaxed space-y-2">
          <p>
            <span className="text-destructive">PURGE</span> — throw it out. Earns PURGED points based on how hard it was to let go.
          </p>
          <p>
            <span className="text-accent">CLAIM</span> — keep it and organize it. Earns CLAIMED points based on its value.
          </p>
          <p>
            <span className="text-secondary">EXILE</span> — move it out of this zone. Partial credit on both.
          </p>
          <div className="border-t border-border pt-2 mt-2">
            <p><span className="text-destructive">PURGED</span> = total decisiveness score. How much you eliminated.</p>
            <p><span className="text-accent">CLAIMED</span> = total organization score. How much value you kept.</p>
            <p><span className="text-primary">SYS_MOOD</span> = the OS's overall judgment. Only set after your final review panoramic.</p>
          </div>
        </div>
      </div>

      {/* The Flow */}
      <div className="border border-border bg-muted p-3 mb-3">
        <div className="text-primary tracking-widest text-[11px] border-b border-border pb-1.5 mb-2">
          THE FLOW
        </div>
        <div className="text-muted-foreground text-xs font-body leading-relaxed">
          Scan your room → OS generates sectors → clear each sector → confirm with photo → final review.{'\n\n'}
          Each sector has a timer. Beat the estimate to impress the OS.{'\n\n'}
          The OS's mood is set at the end based on your final panoramic. Not the score.
        </div>
      </div>

      {/* Confirmation Photos */}
      <div className="border border-border bg-muted p-3 mb-3">
        <div className="text-primary tracking-widest text-[11px] border-b border-border pb-1.5 mb-2">
          CONFIRMATION PHOTOS
        </div>
        <div className="text-muted-foreground text-xs font-body leading-relaxed">
          After clearing a sector, you submit a photo proving it's done.{'\n\n'}
          The OS is strict. Wrong room, unrelated photo, or random meme = rejected and penalized.{'\n\n'}
          Submit photos of the actual sector you just cleaned.
        </div>
      </div>

      <TerminalButton variant="deploy" onClick={handleContinue}>
        {'>'} UNDERSTOOD — START SCAN
      </TerminalButton>
    </TerminalLayout>
  );
}
