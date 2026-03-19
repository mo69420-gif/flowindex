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
  trash: number;
  loot: number;
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
}

export interface Directive {
  id: string;
  label: string;
  instruction: string;
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
}

export type FlowAction =
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'ADD_USER'; payload: string }
  | { type: 'SET_LOGS'; payload: string[] }
  | { type: 'LOAD_SCAN'; payload: { sectors: Record<string, Sector>; sectorOrder: string[]; operationName: string } }
  | { type: 'SET_DIRECTIVES'; payload: Directive[] }
  | { type: 'COMPLETE_TARGET'; payload: { targetId: string; action: string; trash: number; loot: number } }
  | { type: 'CONFIRM_SECTOR'; payload: string }
  | { type: 'START_SECTOR'; payload: string }
  | { type: 'RESET' };
