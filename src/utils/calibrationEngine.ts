import type { Difficulty, ProficiencyProfile } from '../types/sudoku.ts';

const STORAGE_KEY = 'nebuku_proficiency_profile_v1';

export const INITIAL_PROFILE: ProficiencyProfile = {
  mmr: 1200,
  tier: 'Adept Deductive',
  gamesPlayed: 0,
  gamesWon: 0,
  winStreak: 0,
  currentStreak: 0,
  avgSolveTimeSec: 0,
  mistakeFrequency: 0,
  hintDependencyScore: 25,
  techniqueProficiency: {
    nakedSingle: 60,
    hiddenSingle: 45,
    boxLineReduction: 20,
    nakedPairs: 15,
    hiddenPairs: 10,
    advancedXWing: 5,
  },
  recentHistory: [],
};

export function getTierFromMMR(mmr: number): ProficiencyProfile['tier'] {
  if (mmr < 1100) return 'Novice Logician';
  if (mmr < 1400) return 'Adept Deductive';
  if (mmr < 1700) return 'Logic Scholar';
  if (mmr < 2000) return 'Master Tactician';
  return 'Grandmaster';
}

export function loadProfile(): ProficiencyProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...INITIAL_PROFILE,
        ...parsed,
        tier: getTierFromMMR(parsed.mmr || 1200),
      };
    }
  } catch (e) {
    console.warn('Failed to load proficiency profile, using defaults:', e);
  }
  return INITIAL_PROFILE;
}

export function saveProfile(profile: ProficiencyProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Failed to save proficiency profile:', e);
  }
}

export function calculateTargetCluesForMMR(mmr: number): number {
  // 900 MMR -> 42 clues (gentle)
  // 1200 MMR -> 34 clues (balanced)
  // 1500 MMR -> 29 clues (intermediate)
  // 1800 MMR -> 25 clues (advanced)
  // 2100+ MMR -> 22 clues (extreme)
  const clampedMMR = Math.max(800, Math.min(2200, mmr));
  const ratio = (clampedMMR - 800) / (2200 - 800);
  const target = Math.round(42 - ratio * 20);
  return Math.max(22, Math.min(42, target));
}

export function getRecommendedDifficulty(mmr: number): Difficulty {
  if (mmr < 1150) return 'easy';
  if (mmr < 1600) return 'medium';
  return 'hard';
}

export interface GameResult {
  won: boolean;
  difficulty: Difficulty;
  timeTakenSec: number;
  mistakes: number;
  hintsUsed: number;
  techniquesEncountered?: string[];
}

export function recordGameResult(
  current: ProficiencyProfile,
  result: GameResult
): { updatedProfile: ProficiencyProfile; deltaMMR: number } {
  const parTimes: Record<Difficulty, number> = {
    easy: 360,    // 6 min
    medium: 600,  // 10 min
    hard: 960,    // 16 min
    adaptive: 600,
  };

  const parTime = parTimes[result.difficulty];
  let delta = 0;

  if (result.won) {
    let baseGain = 25;
    if (result.difficulty === 'hard') baseGain = 35;
    if (result.difficulty === 'easy') baseGain = 15;

    // Time efficiency modifier (-10 to +15)
    const timeRatio = result.timeTakenSec / parTime;
    let timeModifier = 0;
    if (timeRatio < 0.6) timeModifier = 15;
    else if (timeRatio < 0.9) timeModifier = 8;
    else if (timeRatio > 1.5) timeModifier = -8;

    // Accuracy modifier
    let accuracyModifier = 0;
    if (result.mistakes === 0) accuracyModifier = 10;
    else if (result.mistakes === 1) accuracyModifier = 4;
    else accuracyModifier = -Math.min(10, result.mistakes * 4);

    // Hint penalty
    const hintPenalty = Math.min(15, result.hintsUsed * 3);

    delta = Math.max(5, Math.round(baseGain + timeModifier + accuracyModifier - hintPenalty));
  } else {
    // Loss or abandoned
    let baseLoss = -20;
    if (result.difficulty === 'hard') baseLoss = -12; // softer penalty for hard
    if (result.difficulty === 'easy') baseLoss = -25;
    delta = baseLoss;
  }

  const newMMR = Math.max(800, current.mmr + delta);
  const newGamesPlayed = current.gamesPlayed + 1;
  const newGamesWon = result.won ? current.gamesWon + 1 : current.gamesWon;
  const newCurrentStreak = result.won ? current.currentStreak + 1 : 0;
  const newWinStreak = Math.max(current.winStreak, newCurrentStreak);

  // Update rolling average solve time
  const currentTotalTime = current.avgSolveTimeSec * current.gamesPlayed;
  const newAvgTime = Math.round((currentTotalTime + result.timeTakenSec) / newGamesPlayed);

  // Update mistake frequency
  const currentTotalMistakes = current.mistakeFrequency * current.gamesPlayed;
  const newMistakeFreq = Number(((currentTotalMistakes + result.mistakes) / newGamesPlayed).toFixed(2));

  // Hint dependency metric (0 - 100)
  const currentHintScore = current.hintDependencyScore;
  const gameHintScore = Math.min(100, result.hintsUsed * 20);
  const newHintScore = Math.round(currentHintScore * 0.8 + gameHintScore * 0.2);

  // Technique mastery increments
  const newProficiency = { ...current.techniqueProficiency };
  if (result.won) {
    newProficiency.nakedSingle = Math.min(100, newProficiency.nakedSingle + (result.hintsUsed === 0 ? 3 : 1));
    if (result.difficulty !== 'easy') {
      newProficiency.hiddenSingle = Math.min(100, newProficiency.hiddenSingle + 2);
      newProficiency.boxLineReduction = Math.min(100, newProficiency.boxLineReduction + 2);
    }
    if (result.difficulty === 'hard') {
      newProficiency.nakedPairs = Math.min(100, newProficiency.nakedPairs + 3);
      newProficiency.hiddenPairs = Math.min(100, newProficiency.hiddenPairs + 2);
      newProficiency.advancedXWing = Math.min(100, newProficiency.advancedXWing + 1);
    }
  }

  const updatedProfile: ProficiencyProfile = {
    ...current,
    mmr: newMMR,
    tier: getTierFromMMR(newMMR),
    gamesPlayed: newGamesPlayed,
    gamesWon: newGamesWon,
    winStreak: newWinStreak,
    currentStreak: newCurrentStreak,
    avgSolveTimeSec: newAvgTime,
    mistakeFrequency: newMistakeFreq,
    hintDependencyScore: newHintScore,
    techniqueProficiency: newProficiency,
    recentHistory: [
      {
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        difficulty: result.difficulty,
        timeTakenSec: result.timeTakenSec,
        mistakes: result.mistakes,
        hintsUsed: result.hintsUsed,
        mmrDelta: delta,
        won: result.won,
      },
      ...current.recentHistory.slice(0, 9),
    ],
  };

  saveProfile(updatedProfile);
  return { updatedProfile, deltaMMR: delta };
}
