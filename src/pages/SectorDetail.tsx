import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFlow } from '@/lib/flowContext';
import { supabase } from '@/integrations/supabase/client';
import TerminalLayout from '@/components/TerminalLayout';
import { TerminalButton } from '@/components/TerminalButton';

function ImpactBar({ score, label }: { score: number; label: string }) {
  const filled = Math.min(5, score);
  const empty = 5 - filled;
  const colorClass = score >= 4 ? 'impact-high' : score >= 3 ? 'impact-med' : 'impact-low';
  return (
    <div className="flex items-center gap-2 mb-2 text-xs">
      <span className="w-[130px] text-muted-foreground shrink-0">{label}</span>
      <span className={colorClass}>{'█'.repeat(filled)}</span>
      <span className="text-border">{'░'.repeat(empty)}</span>
      <span className={`text-[11px] ml-1 ${colorClass}`}>{score}/5</span>
    </div>
  );
}

export default function SectorDetail() {
  const { key } = useParams<{ key: string }>();
  const { state, dispatch } = useFlow();
  const navigate = useNavigate();
  const [attackSuggestion, setAttackSuggestion] = useState<string | null>(null);
  const [loadingAttack, setLoadingAttack] = useState(false);

  const sector = key ? state.sectors[key] : null;

  useEffect(() => {
    if (!sector || !key) return;
    // Generate attack suggestion
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
        setAttackSuggestion("Clear Tier 1 targets first. Work outward from the biggest obstruction. Don't stop once you start.");
      }
      setLoadingAttack(false);
    }).catch(() => {
      setAttackSuggestion("Clear Tier 1 targets first. Work outward from the biggest obstruction. Don't stop once you start.");
      setLoadingAttack(false);
    });
  }, [key]);

  if (!sector || !key) {
    navigate('/sectors');
    return null;
  }

  // Group inventory by category
  const categories: Record<string, typeof sector.inventory> = {};
  sector.inventory.forEach(item => {
    const cat = item.category || 'MISC';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(item);
  });

  const handleDeploy = () => {
    if (!state.sectorStarted[key]) {
      dispatch({ type: 'START_SECTOR', payload: key });
    }
    navigate(`/sector/${key}/targets`);
  };

  return (
    <TerminalLayout title={sector.name} syslog={`Reviewing ${sector.name}. ${sector.inventory.length} items catalogued.`}>
      {/* Sector Header */}
      <div className="border border-border bg-muted p-3 mb-3">
        <div className="text-primary tracking-widest text-[13px] border-b border-border pb-1.5 mb-2">
          {sector.name}
        </div>
        <div className="text-muted-foreground text-xs mb-3 font-body">{sector.desc}</div>
        <div className="text-muted-foreground text-[11px]">
          EST. TIME: {sector.timeEstimate} MIN | TARGETS: {sector.targets.length}
        </div>
      </div>

      {/* Attack Suggestion */}
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

      {/* Inventory */}
      <div className="border border-border bg-muted p-3 mb-3">
        <div className="text-primary tracking-widest text-[11px] border-b border-border pb-1.5 mb-2">
          INVENTORY — {sector.inventory.length} ITEMS
        </div>
        {Object.entries(categories).map(([cat, items]) => (
          <div key={cat} className="mb-3">
            <div className="text-primary/60 text-[10px] tracking-widest mb-1.5 border-b border-border/50 pb-1">{cat}</div>
            {items.map(item => (
              <div key={item.number} className="flex gap-2 py-1 border-b border-border/20 text-xs">
                <span className="text-muted-foreground w-9 shrink-0">{item.number}</span>
                <span className="text-foreground font-body">{item.label}</span>
              </div>
            ))}
          </div>
        ))}
        <div className="text-accent text-[13px] tracking-widest pt-3 border-t border-border mt-2 text-center">
          TOTAL: {sector.inventory.length} ITEMS
        </div>
      </div>

      {/* Impact Assessment */}
      <div className="border border-border bg-muted p-3 mb-3">
        <div className="text-primary tracking-widest text-[11px] border-b border-border pb-1.5 mb-3">
          IMPACT ASSESSMENT
        </div>
        <ImpactBar score={sector.flowImpact} label="FLOW IMPACT" />
        <ImpactBar score={sector.psychImpact} label="PSYCH IMPACT" />
        <ImpactBar score={sector.ergonomicRisk} label="ERGONOMIC RISK" />

        <div className="border-l-2 border-destructive pl-3 py-2 my-3 text-muted-foreground text-xs font-body leading-relaxed">
          <span className="text-destructive text-[10px] tracking-widest block mb-1">WHY IT MATTERS</span>
          {sector.whyItMatters}
        </div>

        <div className="border border-border p-3 mt-3 text-foreground text-xs font-body leading-relaxed">
          <span className="text-primary text-[10px] tracking-widest block mb-1">FINAL ANALYSIS</span>
          {sector.finalAnalysis}
        </div>
      </div>

      <TerminalButton variant="deploy" onClick={handleDeploy}>
        {'>'} DEPLOY — ENGAGE TARGETS
      </TerminalButton>

      <TerminalButton variant="back" onClick={() => navigate('/sectors')}>
        {'<'} BACK TO SECTOR MAP
      </TerminalButton>
    </TerminalLayout>
  );
}
