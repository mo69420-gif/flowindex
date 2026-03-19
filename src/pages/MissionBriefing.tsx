import { useNavigate } from 'react-router-dom';
import { useFlow } from '@/lib/flowContext';
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

export default function MissionBriefing() {
  const { state } = useFlow();
  const navigate = useNavigate();
  const { sectors, sectorOrder, operationName, username } = state;

  if (!sectorOrder.length) {
    navigate('/menu');
    return null;
  }

  const totalItems = sectorOrder.reduce((a, k) => a + (sectors[k]?.inventory.length ?? 0), 0);
  const totalTargets = sectorOrder.reduce((a, k) => a + (sectors[k]?.targets.length ?? 0), 0);
  const totalEst = sectorOrder.reduce((a, k) => a + (sectors[k]?.timeEstimate ?? 0), 0);

  return (
    <TerminalLayout title="MISSION BRIEFING" syslog={`${operationName} — ${totalTargets} targets across ${sectorOrder.length} sectors.`}>
      {/* Operation Header */}
      <div className="border border-primary bg-muted p-4 mb-3.5">
        <div className="text-primary text-sm tracking-[3px] mb-1">{operationName}</div>
        <div className="text-muted-foreground text-[11px]">OPERATOR: {username} | SECTORS: {sectorOrder.length} | ITEMS: {totalItems} | EST: {totalEst} MIN</div>
      </div>

      {/* Per-sector breakdown */}
      {sectorOrder.map((key, idx) => {
        const s = sectors[key];
        if (!s) return null;

        // Group inventory by category
        const categories: Record<string, typeof s.inventory> = {};
        s.inventory.forEach(item => {
          const cat = item.category || 'MISC';
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(item);
        });

        return (
          <div key={key} className="border border-border bg-muted p-3 mb-3">
            {/* Sector header */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-primary text-[13px] tracking-widest">{s.name}</div>
              <span className="text-[10px] border border-accent text-accent px-1.5 py-0.5">
                STAGE {idx + 1}
              </span>
            </div>
            <div className="text-muted-foreground text-xs mb-3 font-body">{s.desc}</div>

            {/* Impact bars */}
            <ImpactBar score={s.flowImpact} label="FLOW IMPACT" />
            <ImpactBar score={s.psychImpact} label="PSYCH IMPACT" />
            <ImpactBar score={s.ergonomicRisk} label="ERGONOMIC RISK" />

            {/* Time estimate */}
            <div className="text-muted-foreground text-[11px] mt-2 mb-3">
              EST. TIME: {s.timeEstimate} MIN | ITEMS: {s.inventory.length} | TARGETS: {s.targets.length}
            </div>

            {/* Inventory preview */}
            <div className="border-t border-border pt-2 mt-2">
              <div className="text-primary text-[11px] tracking-widest mb-2">INVENTORY ({s.inventory.length} ITEMS)</div>
              {Object.entries(categories).map(([cat, items]) => (
                <div key={cat} className="mb-2">
                  <div className="text-primary/60 text-[10px] tracking-widest mb-1">{cat}</div>
                  {items.map(item => (
                    <div key={item.number} className="flex gap-2 py-0.5 border-b border-border/30 text-xs">
                      <span className="text-muted-foreground w-9 shrink-0">{item.number}</span>
                      <span className="text-foreground font-body">{item.label}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Targets preview */}
            <div className="border-t border-border pt-2 mt-2">
              <div className="text-destructive text-[11px] tracking-widest mb-2">TARGETS ({s.targets.length})</div>
              {s.targets.map(t => (
                <div key={t.id} className="flex items-center gap-2 mb-1 text-xs">
                  <span className={`text-[10px] px-1 border tier-${t.tier}`}>T{t.tier}</span>
                  <span className="text-foreground font-body">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Overall assessment */}
      <div className="border border-border bg-muted p-3 mb-3">
        <div className="text-destructive text-[11px] tracking-widest mb-2">OVERALL ASSESSMENT</div>
        <div className="text-foreground text-xs font-body leading-relaxed">
          {sectorOrder.length} sectors identified. {totalItems} items catalogued. {totalTargets} targets armed.
          Estimated completion: {totalEst} minutes if you stop overthinking and start executing.
          Begin with {sectors[sectorOrder[0]]?.name} — it has the highest flow impact.
          Each sector cleared compounds the psychological benefit of the next.
          Stop reading. Start clearing.
        </div>
      </div>

      <TerminalButton variant="deploy" onClick={() => navigate('/sectors')}>
        {'>'} DEPLOY — BEGIN OPERATION
      </TerminalButton>

      <TerminalButton variant="back" onClick={() => navigate('/menu')}>
        {'<'} BACK TO MENU
      </TerminalButton>
    </TerminalLayout>
  );
}
