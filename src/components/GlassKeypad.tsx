import React from 'react';
import { Pencil, Delete, Undo2, Sparkles, Check } from 'lucide-react';
import { BoardGrid } from '../types/sudoku';

interface GlassKeypadProps {
  onInputNumber: (num: number) => void;
  onErase: () => void;
  onUndo: () => void;
  canUndo: boolean;
  isNotesMode: boolean;
  onToggleNotesMode: () => void;
  onAutoCandidates: () => void;
  grid: BoardGrid;
  disabled?: boolean;
}

export const GlassKeypad: React.FC<GlassKeypadProps> = ({
  onInputNumber,
  onErase,
  onUndo,
  canUndo,
  isNotesMode,
  onToggleNotesMode,
  onAutoCandidates,
  grid,
  disabled = false,
}) => {
  // Calculate remaining count for each digit (1-9)
  const digitCounts: Record<number, number> = {};
  for (let n = 1; n <= 9; n++) digitCounts[n] = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = grid[r][c];
      if (v >= 1 && v <= 9) {
        digitCounts[v]++;
      }
    }
  }

  return (
    <div className="w-full max-w-[500px] mx-auto mt-4 px-2">
      {/* Top action row: Notes mode, Erase, Undo, Auto-Candidates */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {/* Notes Toggle Button */}
        <button
          disabled={disabled}
          onClick={onToggleNotesMode}
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl border transition-all duration-200 liquid-glass-interactive ${
            isNotesMode
              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
              : 'liquid-glass-subtle text-white/70 hover:text-white border-white/10'
          }`}
          title="Toggle Pencil Notes (Shortcut: N)"
        >
          <div className="flex items-center gap-1.5">
            <Pencil className={`w-4 h-4 ${isNotesMode ? 'text-cyan-400' : 'text-white/60'}`} />
            <span className="text-xs font-semibold">Notes</span>
          </div>
          <span className="text-[10px] text-white/40 mt-0.5">
            {isNotesMode ? 'ACTIVE' : 'OFF'}
          </span>
        </button>

        {/* Erase Button */}
        <button
          disabled={disabled}
          onClick={onErase}
          className="flex flex-col items-center justify-center py-2 px-3 rounded-2xl liquid-glass-subtle border border-white/10 text-white/70 hover:text-white liquid-glass-interactive"
          title="Erase cell value (Shortcut: Backspace / Delete)"
        >
          <Delete className="w-4 h-4 text-white/60" />
          <span className="text-xs font-semibold mt-0.5">Erase</span>
        </button>

        {/* Undo Button */}
        <button
          disabled={disabled || !canUndo}
          onClick={onUndo}
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl liquid-glass-subtle border border-white/10 transition-opacity liquid-glass-interactive ${
            canUndo ? 'text-white/70 hover:text-white cursor-pointer' : 'opacity-35 cursor-not-allowed'
          }`}
          title="Undo last action (Shortcut: Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4 text-white/60" />
          <span className="text-xs font-semibold mt-0.5">Undo</span>
        </button>

        {/* Auto Candidates Button */}
        <button
          disabled={disabled}
          onClick={onAutoCandidates}
          className="flex flex-col items-center justify-center py-2 px-3 rounded-2xl liquid-glass-subtle border border-white/10 text-indigo-300 hover:text-indigo-200 liquid-glass-interactive"
          title="Calculate and display all logical candidates"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold mt-0.5">Auto-Fill</span>
        </button>
      </div>

      {/* 1-9 Number Buttons */}
      <div className="grid grid-cols-9 gap-1.5 sm:gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const placedCount = digitCounts[num] || 0;
          const isComplete = placedCount >= 9;

          return (
            <button
              key={num}
              disabled={disabled || isComplete}
              onClick={() => onInputNumber(num)}
              className={`relative flex flex-col items-center justify-center py-2.5 sm:py-3 rounded-2xl border transition-all duration-150 liquid-glass-interactive ${
                isComplete
                  ? 'opacity-25 bg-white/[0.02] border-white/5 cursor-not-allowed'
                  : 'liquid-glass-elevated border-white/15 hover:border-cyan-400/40 hover:bg-cyan-500/10 active:scale-95'
              }`}
            >
              <span className="font-mono text-base sm:text-xl font-bold text-white/95">
                {num}
              </span>
              <span className="text-[9px] font-mono text-white/40 mt-0.5">
                {isComplete ? (
                  <Check className="w-2.5 h-2.5 text-emerald-400 inline" />
                ) : (
                  9 - placedCount
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
