export const MANDALART_SIZE = 9;

export type EisenhowerQuadrant = 'q1' | 'q2' | 'q3' | 'q4';

export interface EisenhowerItem {
  text: string;
  reason?: string;
}

export interface EisenhowerMatrix {
  q1: EisenhowerItem[];
  q2: EisenhowerItem[];
  q3: EisenhowerItem[];
  q4: EisenhowerItem[];
}

export interface MandalartState {
  cells: string[][];
  matrix: EisenhowerMatrix | null;
  generatedAt: string | null;
}

export const QUADRANT_LABELS: Record<EisenhowerQuadrant, string> = {
  q1: '급함 + 중요',
  q2: '안급함 + 중요',
  q3: '급함 + 안중요',
  q4: '안급함 + 안중요',
};

export const QUADRANT_GUIDES: Record<EisenhowerQuadrant, string> = {
  q1: '지금 즉시 처리 — 위기·마감·갚아야 할 빚',
  q2: '계획·투자 — 본질에 가까운 일, 코비가 가장 강조한 분면',
  q3: '위임·축소 — 다른 사람의 급함에 휘말리는 일',
  q4: '제거·최소화 — 시간 도둑',
};

export const QUADRANT_TONES: Record<
  EisenhowerQuadrant,
  { border: string; bg: string; text: string }
> = {
  q1: { border: 'border-clay/50', bg: 'bg-clay/10', text: 'text-clay' },
  q2: { border: 'border-sage/50', bg: 'bg-sage/10', text: 'text-sage' },
  q3: { border: 'border-warmgold/50', bg: 'bg-warmgold/10', text: 'text-warmgold' },
  q4: { border: 'border-ink/30', bg: 'bg-ink/5', text: 'text-ink-soft' },
};

export type CellRole = 'main' | 'subGoal' | 'subGoalMirror' | 'action';

export interface CellInfo {
  row: number;
  col: number;
  role: CellRole;
  blockIndex: number;
  /** sub-goal index (0~7) when role is subGoal/subGoalMirror, else null */
  subGoalIndex: number | null;
}

const CENTER = 4;

const SUB_GOAL_DELTAS: [number, number][] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

const BLOCK_CENTERS: [number, number][] = SUB_GOAL_DELTAS.map(([dr, dc]) => [
  CENTER + dr * 3,
  CENTER + dc * 3,
]);

export function getCellInfo(r: number, c: number): CellInfo {
  if (r === CENTER && c === CENTER) {
    return { row: r, col: c, role: 'main', blockIndex: 4, subGoalIndex: null };
  }

  const subGoalIdx = SUB_GOAL_DELTAS.findIndex(
    ([dr, dc]) => CENTER + dr === r && CENTER + dc === c
  );
  if (subGoalIdx !== -1) {
    return {
      row: r,
      col: c,
      role: 'subGoal',
      blockIndex: 4,
      subGoalIndex: subGoalIdx,
    };
  }

  const blockRow = Math.floor(r / 3);
  const blockCol = Math.floor(c / 3);
  const blockIndex = blockRow * 3 + blockCol;

  const mirrorIdx = BLOCK_CENTERS.findIndex(([br, bc]) => br === r && bc === c);
  if (mirrorIdx !== -1) {
    return {
      row: r,
      col: c,
      role: 'subGoalMirror',
      blockIndex,
      subGoalIndex: mirrorIdx,
    };
  }

  return { row: r, col: c, role: 'action', blockIndex, subGoalIndex: null };
}

export function emptyGrid(): string[][] {
  return Array.from({ length: MANDALART_SIZE }, () =>
    Array.from({ length: MANDALART_SIZE }, () => '')
  );
}

export function emptyState(): MandalartState {
  return { cells: emptyGrid(), matrix: null, generatedAt: null };
}

/**
 * Set a cell value, auto-syncing the linked sub-goal mirror if applicable.
 */
export function setCell(
  grid: string[][],
  r: number,
  c: number,
  value: string
): string[][] {
  const next = grid.map((row) => [...row]);
  next[r][c] = value;

  const info = getCellInfo(r, c);
  if (info.role === 'subGoal' && info.subGoalIndex !== null) {
    const [mr, mc] = BLOCK_CENTERS[info.subGoalIndex]!;
    next[mr][mc] = value;
  } else if (info.role === 'subGoalMirror' && info.subGoalIndex !== null) {
    const [dr, dc] = SUB_GOAL_DELTAS[info.subGoalIndex]!;
    next[CENTER + dr][CENTER + dc] = value;
  }

  return next;
}

export function getMainGoal(grid: string[][]): string {
  return grid[CENTER]![CENTER] ?? '';
}

export function getSubGoals(grid: string[][]): string[] {
  return SUB_GOAL_DELTAS.map(([dr, dc]) => grid[CENTER + dr]![CENTER + dc] ?? '');
}

export interface ActionEntry {
  blockIndex: number;
  subGoal: string;
  text: string;
}

export function getActions(grid: string[][]): ActionEntry[] {
  const subGoals = getSubGoals(grid);
  const actions: ActionEntry[] = [];

  for (let r = 0; r < MANDALART_SIZE; r += 1) {
    for (let c = 0; c < MANDALART_SIZE; c += 1) {
      const info = getCellInfo(r, c);
      if (info.role !== 'action') continue;
      const text = grid[r]![c]?.trim();
      if (!text) continue;

      const blockIdx = info.blockIndex;
      const subIdx = blockIdx === 4 ? -1 : blockIdx < 4 ? blockIdx : blockIdx - 1;
      actions.push({
        blockIndex: blockIdx,
        subGoal: subGoals[subIdx] ?? '',
        text,
      });
    }
  }

  return actions;
}

export function countFilled(grid: string[][]): number {
  let n = 0;
  for (const row of grid) {
    for (const v of row) {
      if (v.trim()) n += 1;
    }
  }
  return n;
}

const KEY_MANDALART = 'byeolbit:mandalart:v1';

export function loadMandalart(): MandalartState {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = window.localStorage.getItem(KEY_MANDALART);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<MandalartState>;
    const cells =
      Array.isArray(parsed.cells) &&
      parsed.cells.length === MANDALART_SIZE &&
      parsed.cells.every(
        (row) => Array.isArray(row) && row.length === MANDALART_SIZE
      )
        ? (parsed.cells as string[][]).map((row) =>
            row.map((v) => (typeof v === 'string' ? v : ''))
          )
        : emptyGrid();
    return {
      cells,
      matrix: parsed.matrix ?? null,
      generatedAt: parsed.generatedAt ?? null,
    };
  } catch {
    return emptyState();
  }
}

export function saveMandalart(state: MandalartState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY_MANDALART, JSON.stringify(state));
}

export function clearMandalart(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY_MANDALART);
}

export const MANDALART_STORAGE_KEY = KEY_MANDALART;
