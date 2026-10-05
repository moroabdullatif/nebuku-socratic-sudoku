import { useState, useEffect, useRef } from 'react';
import { BoardGrid, Difficulty } from '../types/sudoku';
import { isBoardSolved } from '../utils/sudokuEngine';

const STORAGE_KEY = 'nebuku_saved_game_state_v1';

export interface SavedGameState {
  grid: BoardGrid;
  initialGrid: BoardGrid;
  solutionGrid: BoardGrid;
  candidatesGrid: number[][][];
  timerSeconds: number;
  difficulty: Difficulty;
  mistakes: number;
  hintsUsed: number;
  timestamp: number;
}

export function loadSavedGameState(): SavedGameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: SavedGameState = JSON.parse(raw);

    // Validate structural integrity
    if (
      Array.isArray(data.grid) &&
      data.grid.length === 9 &&
      Array.isArray(data.initialGrid) &&
      data.initialGrid.length === 9 &&
      Array.isArray(data.solutionGrid) &&
      data.solutionGrid.length === 9 &&
      typeof data.timerSeconds === 'number' &&
      !isBoardSolved(data.grid) // Don't resume an already-solved board
    ) {
      return data;
    }
  } catch (err) {
    console.warn('Failed to load saved Sudoku game state:', err);
  }
  return null;
}

export function clearSavedGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear saved Sudoku game state:', err);
  }
}

export function saveGameState(state: SavedGameState): void {
  try {
    // If the game is already completed, remove rather than storing a finished game
    if (isBoardSolved(state.grid)) {
      clearSavedGameState();
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to persist Sudoku game state to localStorage:', err);
  }
}

export function usePersistentGameState(params: {
  grid: BoardGrid;
  initialGrid: BoardGrid;
  solutionGrid: BoardGrid;
  candidatesGrid: number[][][];
  timerSeconds: number;
  difficulty: Difficulty;
  mistakes: number;
  hintsUsed: number;
  isGameOver: boolean;
  isGameWon: boolean;
}) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save whenever board, timer, or candidates change
  useEffect(() => {
    // Don't persist empty initial boards or ended games
    const isGridEmpty = params.grid.every((row) => row.every((val) => val === 0));
    if (isGridEmpty || params.isGameOver || params.isGameWon) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save by 500ms to keep performance blazing
    saveTimeoutRef.current = setTimeout(() => {
      saveGameState({
        grid: params.grid,
        initialGrid: params.initialGrid,
        solutionGrid: params.solutionGrid,
        candidatesGrid: params.candidatesGrid,
        timerSeconds: params.timerSeconds,
        difficulty: params.difficulty,
        mistakes: params.mistakes,
        hintsUsed: params.hintsUsed,
        timestamp: Date.now(),
      });
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    params.grid,
    params.initialGrid,
    params.solutionGrid,
    params.candidatesGrid,
    params.timerSeconds,
    params.difficulty,
    params.mistakes,
    params.hintsUsed,
    params.isGameOver,
    params.isGameWon,
  ]);
}
