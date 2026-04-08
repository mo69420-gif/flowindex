import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { FlowState, FlowAction, ScenarioRecord, Leaderboard } from './types';

const TIMER_BEAT_BONUS = 10;
const TIMER_MISS_PENALTY = 5;

const freshLeaderboard = (): Leaderboard => ({ purged: 0, claimed: 0, scenarios: 0, penalties: 0 });

const initialState: FlowState = {
  username: null,
  allUsers: [],
  scenarios: 0,
  loot: 0,
  trash: 0,
  sysLogs: ["FRESH BOOT.", "MEMORY CLEAN.", "AWAITING ORDERS."],
  sysMood: "HOSTILE BUT HELPFUL",
  sectors: {},
  sectorOrder: [],
  scanDone: false,
  completedTargets: [],
  targetActions: {},
  confirmedSectors: [],
  operationName: "",
  directives: [],
  sectorStarted: {},
  scenarioHistory: [],
  loadingLines: [],
  seenExplainer: false,
  sectorPenalties: {},
  opReviewed: false,
  timerBonuses: {},
  performanceMedian: 0,
  leaderboard: freshLeaderboard(),
  sectorBeforeRefs: {},
};

/** Fresh scenario keys — zero bleed between ops */
function freshScenario(): Partial<FlowState> {
  return {
    sectors: {},
    sectorOrder: [],
    scanDone: false,
    completedTargets: [],
    targetActions: {},
    confirmedSectors: [],
    operationName: "",
    directives: [],
    sectorStarted: {},
    sectorPenalties: {},
    opReviewed: false,
    timerBonuses: {},
    loot: 0,
    trash: 0,
    loadingLines: [],
    sectorBeforeRefs: {},
  };
}

/** State validator — auto-correct impossible states */
export function validateState(state: FlowState): FlowState {
  const s = { ...state };

  // scan_done but no sectors — reset scan
  if (s.scanDone && (!s.sectors || Object.keys(s.sectors).length === 0)) {
    s.scanDone = false;
    s.sectorOrder = [];
    s.sysLogs = ["STATE CORRECTED.", "Scan data missing. Re-scan required.", ""];
  }

  // op_reviewed but no history — unset
  if (s.opReviewed && (!s.scenarioHistory || s.scenarioHistory.length === 0)) {
    s.opReviewed = false;
  }

  // confirmed_sectors has keys not in sectorOrder
  const orderSet = new Set(s.sectorOrder);
  s.confirmedSectors = (s.confirmedSectors || []).filter(k => orderSet.has(k));

  // completed_targets referencing IDs from sectors that no longer exist
  const validIds = new Set<string>();
  for (const sec of Object.values(s.sectors || {})) {
    for (const t of sec.targets) validIds.add(t.id);
  }
  s.completedTargets = (s.completedTargets || []).filter(tid => validIds.has(tid));

  // sector_started keys not in sectorOrder
  if (s.sectorStarted) {
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(s.sectorStarted)) {
      if (orderSet.has(k)) cleaned[k] = v;
    }
    s.sectorStarted = cleaned;
  }

  // Ensure leaderboard exists
  if (!s.leaderboard) s.leaderboard = freshLeaderboard();

  return s;
}

/** Calculate performance median across all completed scenarios */
function updatePerformanceMedian(state: FlowState): number {
  const history = state.scenarioHistory || [];
  if (!history.length) return 0;
  const scores = history.map(h => {
    const total = (h.trash || 0) + (h.loot || 0);
    const penalty = (h.penalties || 0) * 5;
    return Math.max(0, total - penalty);
  });
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/** Get OS tone based on performance */
export function getOsTone(state: FlowState): string {
  const median = state.performanceMedian || 0;
  const ops = (state.scenarioHistory || []).length;
  if (ops === 0) return "new_operator";
  if (median < 20) return "struggling";
  if (median < 50) return "improving";
  if (median < 100) return "solid";
  return "veteran";
}

function archiveScenario(state: FlowState): FlowState {
  const { sectors, sectorOrder } = state;
  if (!sectors || !sectorOrder.length) return state;

  const op = state.operationName || "UNKNOWN OP";
  const today = new Date().toISOString().slice(0, 10);
  const history = [...(state.scenarioHistory || [])];

  // Dedup guard
  for (const h of history.slice(-3)) {
    if (h.operationName === op && (h.date || "").startsWith(today)) return state;
  }

  const totalT = sectorOrder.reduce((a, k) => a + (sectors[k]?.targets.length ?? 0), 0);
  const record: ScenarioRecord = {
    date: new Date().toISOString(),
    operationName: op,
    sectors: sectorOrder.length,
    sectorsCleared: sectorOrder.filter(k => sectorCleared(state, k)).length,
    targets: totalT,
    targetsCompleted: state.completedTargets.length,
    trash: state.trash,
    loot: state.loot,
    username: state.username || "OPERATOR",
    mood: state.sysMood,
    penalties: Object.values(state.sectorPenalties || {}).reduce((a, b) => a + b, 0),
    timerBonuses: { ...state.timerBonuses },
  };

  history.push(record);

  const lb = { ...(state.leaderboard || freshLeaderboard()) };
  lb.purged += state.trash;
  lb.claimed += state.loot;
  lb.scenarios += 1;
  lb.penalties += record.penalties || 0;

  const newState = { ...state, scenarioHistory: history, leaderboard: lb, scenarios: state.scenarios };
  newState.performanceMedian = updatePerformanceMedian(newState);

  return newState;
}

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'SET_USERNAME':
      return { ...state, username: action.payload, sysLogs: [`OPERATOR ${action.payload} IDENTIFIED.`, "PROFILE LOADED.", "AWAITING ORDERS."] };
    case 'ADD_USER':
      return {
        ...state,
        allUsers: state.allUsers.includes(action.payload) ? state.allUsers : [...state.allUsers, action.payload],
        seenExplainer: false,
      };
    case 'SET_LOGS':
      return { ...state, sysLogs: action.payload };
    case 'SET_DIRECTIVES':
      return { ...state, directives: action.payload, sysLogs: ["PANORAMIC ANALYZED.", `${action.payload.length} DIRECTIVES ISSUED.`, "FOLLOW EACH DIRECTIVE EXACTLY."] };
    case 'SET_LOADING_LINES':
      return { ...state, loadingLines: action.payload };
    case 'LOAD_SCAN': {
      const totalTargets = Object.values(action.payload.sectors).reduce((a, s) => a + s.targets.length, 0);
      const totalEst = Object.values(action.payload.sectors).reduce((a, s) => a + s.timeEstimate, 0);
      return {
        ...state,
        ...freshScenario(),
        sectors: action.payload.sectors,
        sectorOrder: action.payload.sectorOrder,
        operationName: action.payload.operationName,
        scanDone: true,
        scenarios: state.scenarios + 1,
        sysMood: "HOSTILE BUT HELPFUL",
        sysLogs: [
          `${action.payload.sectorOrder.length} SECTORS GENERATED. ${totalTargets} TARGETS ARMED.`,
          `EST. TOTAL: ${totalEst} MIN.`,
          `${action.payload.operationName} INITIATED.`,
        ],
      };
    }
    case 'ARCHIVE_SCENARIO': {
      return archiveScenario(state);
    }
    case 'COMPLETE_TARGET': {
      const { targetId, action: act, trash, loot } = action.payload;
      const mult = act === 'purge' ? { t: 1.5, l: 0 } : act === 'claim' ? { t: 0, l: 1.5 } : { t: 0.5, l: 0.5 };
      return {
        ...state,
        completedTargets: [...state.completedTargets, targetId],
        targetActions: { ...state.targetActions, [targetId]: act },
        trash: state.trash + Math.round(trash * mult.t),
        loot: state.loot + Math.round(loot * mult.l),
      };
    }
    case 'CONFIRM_SECTOR':
      return { ...state, confirmedSectors: [...state.confirmedSectors, action.payload] };
    case 'START_SECTOR':
      return { ...state, sectorStarted: { ...state.sectorStarted, [action.payload]: new Date().toISOString() } };
    case 'SET_MOOD':
      return { ...state, sysMood: action.payload };
    case 'SET_SEEN_EXPLAINER':
      return { ...state, seenExplainer: true };
    case 'SET_OP_REVIEWED':
      return { ...state, opReviewed: true };
    case 'APPLY_TIMER_BONUS': {
      const { sectorKey, bonus } = action.payload;
      return {
        ...state,
        timerBonuses: { ...state.timerBonuses, [sectorKey]: bonus },
        trash: Math.max(0, state.trash + bonus),
      };
    }
    case 'ADD_PENALTY': {
      const { sectorKey, points } = action.payload;
      return {
        ...state,
        sectorPenalties: { ...state.sectorPenalties, [sectorKey]: (state.sectorPenalties[sectorKey] || 0) + 1 },
        trash: Math.max(0, state.trash - points),
      };
    }
    case 'RESET_SCENARIO': {
      // Archive first if active
      let s = state;
      if (state.scanDone && state.sectorOrder.length > 0) {
        s = archiveScenario(state);
      }
      return {
        ...s,
        ...freshScenario(),
        sysLogs: ["SCENARIO RESET.", "OPERATOR DATA PRESERVED.", "READY FOR NEW OP."],
      };
    }
    case 'CLEAR_SCENARIOS': {
      return {
        ...state,
        scenarioHistory: [],
        sysLogs: ["ALL SCENARIOS CLEARED.", "OPERATOR PROFILE PRESERVED.", "LEADERBOARD INTACT."],
      };
    }
    case 'RESET_OS': {
      // Keep leaderboard + users
      const lb = state.leaderboard;
      const users = [...state.allUsers];
      const username = state.username;
      return {
        ...initialState,
        allUsers: users,
        username: username,
        leaderboard: lb,
        sysLogs: ["OS STATE RESET.", "LEADERBOARD STATS PRESERVED.", "STARTING FRESH."],
      };
    }
    case 'FULL_RESET': {
      // Wipe everything including leaderboard — keep allUsers for re-select
      const users = [...state.allUsers];
      return {
        ...initialState,
        allUsers: users,
        sysLogs: ["FULL RESET COMPLETE.", "ALL DATA WIPED.", "LEADERBOARD CLEARED."],
      };
    }
    case 'HARD_RESET': {
      const history = state.scenarioHistory;
      return {
        ...initialState,
        scenarioHistory: history,
        sysLogs: ["HARD RESET COMPLETE.", "SCENARIO HISTORY PRESERVED.", "BACK TO ZERO."],
      };
    }
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

const FlowContext = createContext<{ state: FlowState; dispatch: React.Dispatch<FlowAction> } | null>(null);

const STORAGE_KEY = 'flowindex-os-state';

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(flowReducer, initialState, () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = { ...initialState, ...JSON.parse(saved) };
        // Ensure new fields have defaults
        if (!parsed.leaderboard) parsed.leaderboard = freshLeaderboard();
        if (parsed.opReviewed === undefined) parsed.opReviewed = false;
        if (!parsed.timerBonuses) parsed.timerBonuses = {};
        if (parsed.performanceMedian === undefined) parsed.performanceMedian = 0;
        if (!parsed.sectorBeforeRefs) parsed.sectorBeforeRefs = {};
        return validateState(parsed);
      }
      return initialState;
    } catch { return initialState; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return <FlowContext.Provider value={{ state, dispatch }}>{children}</FlowContext.Provider>;
}

export function useFlow() {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error('useFlow must be used within FlowProvider');
  return ctx;
}

export function renderBar(value: number, cap = 50, width = 5): { filled: number; empty: number } {
  const filled = Math.min(width, Math.round((value / cap) * width));
  return { filled, empty: width - filled };
}

export function sectorCleared(state: FlowState, key: string): boolean {
  const targets = state.sectors[key]?.targets ?? [];
  return targets.length > 0 && targets.every(t => state.completedTargets.includes(t.id));
}

export function getCurrentStage(state: FlowState): string | null {
  for (const key of state.sectorOrder) {
    if (!sectorCleared(state, key)) return key;
  }
  return null;
}

export { TIMER_BEAT_BONUS, TIMER_MISS_PENALTY };
