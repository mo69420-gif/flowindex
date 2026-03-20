import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { FlowState, FlowAction, ScenarioRecord } from './types';

const MOOD_LADDER: [number, string][] = [
  [0, "HOSTILE BUT HELPFUL"],
  [10, "JUDGING YOU HEAVILY"],
  [25, "CAUTIOUSLY OPTIMISTIC"],
  [50, "MILDLY IMPRESSED"],
  [75, "BEGRUDGINGLY PROUD"],
  [100, "MAXIMUM RESPECT UNLOCKED"],
];

function getMood(trash: number): string {
  let mood = MOOD_LADDER[0][1];
  for (const [threshold, label] of MOOD_LADDER) {
    if (trash >= threshold) mood = label;
  }
  return mood;
}

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
};

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'SET_USERNAME':
      return { ...state, username: action.payload, sysLogs: [`OPERATOR ${action.payload} IDENTIFIED.`, "PROFILE LOADED.", "AWAITING ORDERS."] };
    case 'ADD_USER':
      return { ...state, allUsers: state.allUsers.includes(action.payload) ? state.allUsers : [...state.allUsers, action.payload] };
    case 'SET_LOGS':
      return { ...state, sysLogs: action.payload };
    case 'SET_DIRECTIVES':
      return { ...state, directives: action.payload, sysLogs: ["PANORAMIC ANALYZED.", `${action.payload.length} DIRECTIVES ISSUED.`, "FOLLOW EACH DIRECTIVE EXACTLY."] };
    case 'LOAD_SCAN': {
      const totalTargets = Object.values(action.payload.sectors).reduce((a, s) => a + s.targets.length, 0);
      const totalEst = Object.values(action.payload.sectors).reduce((a, s) => a + s.timeEstimate, 0);
      // Auto-archive previous scenario if one exists
      let history = state.scenarioHistory;
      if (state.scanDone && state.sectorOrder.length > 0) {
        const totalT = Object.values(state.sectors).reduce((a, s) => a + s.targets.length, 0);
        const record: ScenarioRecord = {
          date: new Date().toISOString(),
          operationName: state.operationName || 'UNKNOWN OP',
          sectors: state.sectorOrder.length,
          sectorsCleared: state.sectorOrder.filter(k => {
            const targets = state.sectors[k]?.targets ?? [];
            return targets.length > 0 && targets.every(t => state.completedTargets.includes(t.id));
          }).length,
          targets: totalT,
          targetsCompleted: state.completedTargets.length,
          trash: state.trash,
          loot: state.loot,
          username: state.username || 'OPERATOR',
        };
        history = [...history, record];
      }
      return {
        ...state,
        sectors: action.payload.sectors,
        sectorOrder: action.payload.sectorOrder,
        operationName: action.payload.operationName,
        scanDone: true,
        completedTargets: [],
        targetActions: {},
        confirmedSectors: [],
        sectorStarted: {},
        directives: [],
        scenarios: state.scenarios + 1,
        scenarioHistory: history,
        sysLogs: [
          `${action.payload.sectorOrder.length} SECTORS GENERATED. ${totalTargets} TARGETS ARMED.`,
          `EST. TOTAL: ${totalEst} MIN.`,
          `${action.payload.operationName} INITIATED.`,
        ],
      };
    }
    case 'ARCHIVE_SCENARIO': {
      if (!state.scanDone || state.sectorOrder.length === 0) return state;
      const totalT = Object.values(state.sectors).reduce((a, s) => a + s.targets.length, 0);
      const record: ScenarioRecord = {
        date: new Date().toISOString(),
        operationName: state.operationName || 'UNKNOWN OP',
        sectors: state.sectorOrder.length,
        sectorsCleared: state.sectorOrder.filter(k => {
          const targets = state.sectors[k]?.targets ?? [];
          return targets.length > 0 && targets.every(t => state.completedTargets.includes(t.id));
        }).length,
        targets: totalT,
        targetsCompleted: state.completedTargets.length,
        trash: state.trash,
        loot: state.loot,
        username: state.username || 'OPERATOR',
      };
      return { ...state, scenarioHistory: [...state.scenarioHistory, record] };
    }
    case 'COMPLETE_TARGET': {
      const { targetId, action: act, trash, loot } = action.payload;
      const mult = act === 'trash' ? { t: 1.5, l: 0 } : act === 'loot' ? { t: 0, l: 1.5 } : { t: 0.5, l: 0.5 };
      const newTrash = state.trash + Math.round(trash * mult.t);
      const newLoot = state.loot + Math.round(loot * mult.l);
      return {
        ...state,
        completedTargets: [...state.completedTargets, targetId],
        targetActions: { ...state.targetActions, [targetId]: act },
        trash: newTrash,
        loot: newLoot,
        sysMood: getMood(newTrash),
      };
    }
    case 'CONFIRM_SECTOR':
      return { ...state, confirmedSectors: [...state.confirmedSectors, action.payload] };
    case 'START_SECTOR':
      return { ...state, sectorStarted: { ...state.sectorStarted, [action.payload]: new Date().toISOString() } };
    case 'SET_MOOD':
      return { ...state, sysMood: action.payload };
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
      return saved ? { ...initialState, ...JSON.parse(saved) } : initialState;
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
