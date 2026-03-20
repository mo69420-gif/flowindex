import { useFlow, renderBar, getCurrentStage, sectorCleared } from '@/lib/flowContext';

function BarDisplay({ value, cap = 50, width = 5 }: { value: number; cap?: number; width?: number }) {
  const { filled, empty } = renderBar(value, cap, width);
  return (
    <span className="font-display">
      <span className="bar-filled">{'█'.repeat(filled)}</span>
      <span className="bar-empty">{'░'.repeat(empty)}</span>
    </span>
  );
}

export default function StatusMatrix() {
  const { state } = useFlow();

  const scenarioInfo = (() => {
    const { sectors, sectorOrder } = state;
    if (!sectorOrder.length) return null;
    const total = sectorOrder.reduce((a, k) => a + (sectors[k]?.targets.length ?? 0), 0);
    const done = state.completedTargets.length;
    const stagesDone = sectorOrder.filter(k => sectorCleared(state, k)).length;
    const current = getCurrentStage(state);
    if (!current) return `OP COMPLETE — ALL ${sectorOrder.length} SECTORS CLEARED`;
    return `ACTIVE: ${sectors[current]?.name} | ${done}/${total} TARGETS | STAGE ${stagesDone + 1}/${sectorOrder.length}`;
  })();

  return (
    <div className="mb-4">
      {/* System logs */}
      <div className="mb-3">
        {state.sysLogs.slice(-3).map((log, i) => (
          <div key={i} className="text-muted-foreground text-xs font-body">
            [SYSTEM] {log}
          </div>
        ))}
      </div>

      {/* Matrix */}
      <div className="border border-border bg-muted p-3 text-xs font-display">
        <div className="text-primary mb-2 tracking-widest text-[11px]">STATUS MATRIX</div>

        <div className="flex items-center gap-2 mb-1">
          <span className="w-[90px] text-muted-foreground">SCENARIOS</span>
          <BarDisplay value={state.scenarios * 10} />
          <span className="text-foreground text-[11px]">{state.scenarios} LOGGED</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-[90px] text-muted-foreground">LOOT</span>
          <BarDisplay value={state.loot} />
          <span className="text-foreground text-[11px]">{state.loot} SECURED</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-[90px] text-muted-foreground">TRASH</span>
          <BarDisplay value={state.trash} />
          <span className="text-foreground text-[11px]">{state.trash} PURGED</span>
        </div>

        <div className="border-t border-border my-2" />

        <div className="flex items-center gap-2">
          <span className="w-[90px] text-muted-foreground">SYS_MOOD</span>
          <span className="bar-filled font-display">█████</span>
          <span className="text-destructive text-[11px]">{state.sysMood}</span>
        </div>

        {scenarioInfo && (
          <>
            <div className="border-t border-border my-2" />
            <div className="text-accent text-[11px] pt-0.5">▸ {scenarioInfo}</div>
          </>
        )}
      </div>
    </div>
  );
}
