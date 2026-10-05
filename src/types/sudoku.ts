export type Difficulty = 'easy' | 'medium' | 'hard' | 'adaptive';

export interface CellCoord {
  row: number; // 0 to 8
  col: number; // 0 to 8
}

export interface CellData {
  row: number;
  col: number;
  value: number; // 0 = empty, 1-9
  initial: boolean; // given clues
  candidates: number[]; // pencil marks 1-9
  isError?: boolean;
}

export type BoardGrid = number[][]; // 9x9 numbers (0 = empty)

export interface LogicalDeduction {
  technique: string;
  targetCell: CellCoord;
  suggestedDigit?: number; // Internal solver knowledge, hidden from user in Socratic mode
  candidatesEliminated?: { cell: CellCoord; digit: number }[];
  explanation: string;
  guidingQuestions: string[];
  highlightedCells: {
    cell: CellCoord;
    role: 'target' | 'peer' | 'conflict' | 'reference';
    label?: string;
  }[];
  difficultyTier: 'beginner' | 'intermediate' | 'advanced';
}

export interface SocraticHintResponse {
  techniqueName: string;
  techniqueType: string;
  level: number; // 1 = gentle nudge, 2 = Socratic guiding questions, 3 = technique breakdown
  focusRegion: {
    row?: number;
    col?: number;
    boxIndex?: number;
    description: string;
  };
  guidingQuestions: string[];
  pedagogicalNudge: string;
  techniqueDescription: string;
  highlightedCells: {
    row: number;
    col: number;
    role: 'target' | 'peer' | 'conflict' | 'reference';
  }[];
  revealsDigit: boolean; // Always false for Socratic tutor
}

export interface LogicStep {
  stepIndex: number;
  cell: CellCoord;
  digit: number;
  technique: string;
  explanation: string;
  whyValid: string;
  eliminatedCandidates?: { cell: CellCoord; digits: number[] }[];
  involvedCells: {
    cell: CellCoord;
    role: 'target' | 'peer' | 'cause';
  }[];
}

export interface SolutionExplanationResponse {
  steps: LogicStep[];
  overallStrategy: string;
  totalRemaining: number;
  keyTechniquesUsed: string[];
}

export interface ProficiencyProfile {
  mmr: number; // ELO rating (e.g. 1000 - 2400)
  tier: 'Novice Logician' | 'Adept Deductive' | 'Logic Scholar' | 'Master Tactician' | 'Grandmaster';
  gamesPlayed: number;
  gamesWon: number;
  winStreak: number;
  currentStreak: number;
  avgSolveTimeSec: number;
  mistakeFrequency: number; // avg mistakes per game
  hintDependencyScore: number; // 0-100 (lower is more independent)
  techniqueProficiency: {
    nakedSingle: number; // 0 - 100%
    hiddenSingle: number;
    boxLineReduction: number;
    nakedPairs: number;
    hiddenPairs: number;
    advancedXWing: number;
  };
  recentHistory: {
    date: string;
    difficulty: Difficulty;
    timeTakenSec: number;
    mistakes: number;
    hintsUsed: number;
    mmrDelta: number;
    won: boolean;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'tutor';
  text: string;
  timestamp: number;
  relatedCell?: CellCoord;
}
