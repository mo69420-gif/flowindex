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

      <div className="border border-border bg-muted p-3 mb-3">
        <div className="text-primary tracking-widest text-[11px] border-b border-border pb-1.5 mb-2">
          THE POINT SYSTEM
        </div>
        <div className="text-muted-foreground text-xs font-body leading-relaxed space-y-2">
          <p><span className="text-destructive">PURGE</span> — throw it out. Earns PURGED points based on effort required.</p>
          <p><span className="text-accent">CLAIM</span> — keep and organize it. Earns CLAIMED points based on its value.</p>
          <p><span className="text-secondary">EXILE</span> — move it out of this zone. Partial credit on both.</p>
          <div className="border-t border-border pt-2 mt-2">
            <p><span className="text-destructive">PURGED</span> = your decisiveness score.</p>
            <p><span className="text-accent">CLAIMED</span> = your organization score.</p>
            <p><span className="text-primary">SYS_MOOD</span> = set ONLY after your final review panoramic.</p>
          </div>
        </div>
      </div>

      <div className="border border-border bg-muted p-3 mb-3">
        <div className="text-primary tracking-widest text-[11px] border-b border-border pb-1.5 mb-2">
          THE TIMER
        </div>
        <div className="text-muted-foreground text-xs font-body leading-relaxed whitespace-pre-wrap">
          You get two live clocks: overall mission time and the active sector time.{"
"}
          Beat a sector estimate = +10 PURGED bonus points.{"
"}
          Miss it = -5 PURGED penalty. The OS is watching both.
        </div>
      </div>

      <div className="border border-border bg-muted p-3 mb-3">
        <div className="text-primary tracking-widest text-[11px] border-b border-border pb-1.5 mb-2">
          THE FLOW
        </div>
        <div className="text-muted-foreground text-xs font-body leading-relaxed whitespace-pre-wrap">
          Record a guided video walkthrough → OS builds sectors → clear each sector → confirm with photo → final review.{"

"}
          The mission clock and sector clock stay visible together so you can pace yourself.{"

"}
          The OS's mood is set at the end based on your final panoramic. Not the score.
        </div>
      </div>

      <div className="border border-border bg-muted p-3 mb-3">
        <div className="text-primary tracking-widest text-[11px] border-b border-border pb-1.5 mb-2">
          CONFIRMATION PHOTOS
        </div>
        <div className="text-muted-foreground text-xs font-body leading-relaxed whitespace-pre-wrap">
          After clearing a sector, you submit a photo proving it's done.{"

"}
          The OS judges by tier. Tier 1 critical items require hard visual proof. Tier 3 low priority gets a lenient pass.{"

"}
          Wrong room, meme, or random photo = rejected + 5 point penalty. Submit photos of the actual sector you cleaned.
        </div>
      </div>

      <TerminalButton variant="deploy" onClick={handleContinue}>
        {'>'} UNDERSTOOD — START SCAN
      </TerminalButton>
    </TerminalLayout>
  );
}
