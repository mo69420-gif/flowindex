export interface InventoryItem {
  number: string;
  label: string;
  category: string;
}

export interface Target {
  id: string;
  label: string;
  tier: 1 | 2 | 3;
  why: string;
  trash: number; // effort — how hard to deal with (rewards PURGE)
  loot: number;  // value — worth keeping (rewards CLAIM)
}

export interface Sector {
  name: string;
  desc: string;
  stage: number;
  timeEstimate: number;
  flowImpact: number;
  psychImpact: number;
  ergonomicRisk: number;
  whyItMatters: string;
  finalAnalysis: string;
  inventory: InventoryItem[];
  targets: Target[];
  attackSuggestion?: string;
}

export interface Directive {
  id: string;
  label: string;
  instruction: string;
}

export interface Leaderboard {
  purged: number;
  claimed: number;
  scenarios: number;
  penalties: number;
}

export interface ScenarioRecord {
  date: string;
  operationName: string;
  sectors: number;
  sectorsCleared: number;
  targets: number;
  targetsCompleted: number;
  trash: number;
  loot: number;
  username: string;
  mood?: string;
  penalties?: number;
  timerBonuses?: Record<string, number>;
}

export interface FlowState {
  username: string | null;
  allUsers: string[];
  scenarios: number;
  loot: number;
  trash: number;
  sysLogs: string[];
  sysMood: string;
  sectors: Record<string, Sector>;
  sectorOrder: string[];
  scanDone: boolean;
  completedTargets: string[];
  targetActions: Record<string, string>;
  confirmedSectors: string[];
  operationName: string;
  directives: Directive[];
  sectorStarted: Record<string, string>;
  scenarioHistory: ScenarioRecord[];
  loadingLines: string[];
  seenExplainer: boolean;
  sectorPenalties: Record<string, number>;
  // v4.6 fields
  opReviewed: boolean;
  timerBonuses: Record<string, number>;
  performanceMedian: number;
  leaderboard: Leaderboard;
  sectorBeforeRefs: Record<string, { b64?: string; mime?: string }>;
}

export type FlowAction =
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'ADD_USER'; payload: string }
  | { type: 'SET_LOGS'; payload: string[] }
  | { type: 'SET_MOOD'; payload: string }
  | { type: 'SET_LOADING_LINES'; payload: string[] }
  | { type: 'LOAD_SCAN'; payload: { sectors: Record<string, Sector>; sectorOrder: string[]; operationName: string } }
  | { type: 'SET_DIRECTIVES'; payload: Directive[] }
  | { type: 'COMPLETE_TARGET'; payload: { targetId: string; action: string; trash: number; loot: number } }
  | { type: 'CONFIRM_SECTOR'; payload: string }
  | { type: 'START_SECTOR'; payload: string }
  | { type: 'ARCHIVE_SCENARIO' }
  | { type: 'RESET_SCENARIO' }
  | { type: 'RESET_OS' }
  | { type: 'FULL_RESET' }
  | { type: 'HARD_RESET' }
  | { type: 'RESET' }
  | { type: 'SET_SEEN_EXPLAINER' }
  | { type: 'ADD_PENALTY'; payload: { sectorKey: string; points: number } }
  | { type: 'SET_OP_REVIEWED' }
  | { type: 'APPLY_TIMER_BONUS'; payload: { sectorKey: string; bonus: number } }
  | { type: 'CLEAR_SCENARIOS' }
  | { type: 'SAVE_BEFORE_REF'; payload: { sectorKey: string; dataUrl: string } }
  | { type: 'SAVE_AFTER_REF'; payload: { sectorKey: string; dataUrl: string } };
