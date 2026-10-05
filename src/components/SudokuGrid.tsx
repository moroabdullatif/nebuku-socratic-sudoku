import React from 'react';
import { CellCoord, BoardGrid } from '../types/sudoku';
import { getBoxIndex } from '../utils/sudokuEngine';
import { sounds } from '../utils/soundEffects';

interface HighlightedCell {
  row: number;
  col: number;
  role: 'target' | 'peer' | 'conflict' | 'reference' | 'cause';
  label?: string;
}

interface SudokuGridProps {
  grid: BoardGrid;
  initialGrid: BoardGrid;
  candidatesGrid: number[][][];
  selectedCell: CellCoord | null;
  onSelectCell: (cell: CellCoord) => void;
  conflicts: CellCoord[];
  tutorHighlights: HighlightedCell[];
  isPaused: boolean;
}

export const SudokuGrid: React.FC<SudokuGridProps> = ({
  grid,
  initialGrid,
  candidatesGrid,
  selectedCell,
  onSelectCell,
  conflicts,
  tutorHighlights,
  isPaused,
}) => {
  const selectedValue =
    selectedCell && grid[selectedCell.row]?.[selectedCell.col] > 0
      ? grid[selectedCell.row][selectedCell.col]
      : null;

  const isConflict = (r: number, c: number) => {
    return conflicts.some(item => item.row === r && item.col === c);
  };

  const getTutorHighlight = (r: number, c: number) => {
    return tutorHighlights.find(h => h.row === r && h.col === c);
  };

  return (
    <div className="relative w-full max-w-[500px] aspect-square mx-auto p-2 sm:p-3 rounded-3xl liquid-glass-elevated border border-white/15 select-none shadow-2xl">
      {/* Ambient background reflection inside the grid border */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-indigo-500/5 pointer-events-none rounded-3xl" />

      {/* Paused Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-30 rounded-3xl liquid-glass flex flex-col items-center justify-center backdrop-blur-xl">
          <div className="text-sm font-semibold tracking-wide text-white/90 mb-1">
            PUZZLE PAUSED
          </div>
          <div className="text-xs text-white/50">Click play or resume to continue solving</div>
        </div>
      )}

      {/* 9x9 Grid */}
      <div className="grid grid-cols-9 grid-rows-9 w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-black/30 backdrop-blur-md">
        {grid.map((rowArr, r) =>
          rowArr.map((val, c) => {
            const isInitial = initialGrid[r][c] > 0;
            const isSelected = selectedCell?.row === r && selectedCell?.col === c;
            const isPeer =
              selectedCell &&
              !isSelected &&
              (selectedCell.row === r ||
                selectedCell.col === c ||
                getBoxIndex(selectedCell.row, selectedCell.col) === getBoxIndex(r, c));
            const isSameNumber =
              selectedValue !== null && val === selectedValue && val > 0 && !isSelected;
            const hasConflict = isConflict(r, c);
            const tutorHighlight = getTutorHighlight(r, c);
            const candidates = candidatesGrid[r]?.[c] || [];

            // 3x3 Box borders
            const isRightBoxBorder = c === 2 || c === 5;
            const isBottomBoxBorder = r === 2 || r === 5;

            // Highlight styling logic
            let cellBg = 'bg-transparent';
            if (isSelected) {
              cellBg = 'bg-cyan-500/25 shadow-[inset_0_0_15px_rgba(56,189,248,0.4)]';
            } else if (tutorHighlight?.role === 'target') {
              cellBg = 'bg-emerald-500/25 ring-2 ring-emerald-400/80 ring-inset shadow-[0_0_20px_rgba(52,211,153,0.3)] animate-pulse';
            } else if (tutorHighlight?.role === 'conflict' || tutorHighlight?.role === 'cause') {
              cellBg = 'bg-amber-500/20 ring-1 ring-amber-400/60 ring-inset';
            } else if (tutorHighlight?.role === 'peer' || tutorHighlight?.role === 'reference') {
              cellBg = 'bg-indigo-500/15';
            } else if (hasConflict) {
              cellBg = 'bg-rose-500/25 ring-1 ring-rose-500/60 ring-inset';
            } else if (isSameNumber) {
              cellBg = 'bg-cyan-400/15';
            } else if (isPeer) {
              cellBg = 'bg-white/[0.03]';
            }

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => {
                  sounds.playCellSelect();
                  onSelectCell({ row: r, col: c });
                }}
                className={`relative flex items-center justify-center cursor-pointer transition-all duration-150
                  border-r border-b border-white/[0.07]
                  ${isRightBoxBorder ? 'border-r-2 !border-r-white/30' : ''}
                  ${isBottomBoxBorder ? 'border-b-2 !border-b-white/30' : ''}
                  ${cellBg}
                  hover:bg-white/[0.08]
                `}
              >
                {/* Value or Candidates */}
                {val > 0 ? (
                  <span
                    className={`font-mono text-lg sm:text-2xl font-semibold transition-transform duration-100 ${
                      isSelected ? 'scale-110' : ''
                    } ${
                      hasConflict
                        ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]'
                        : isInitial
                        ? 'text-white/95 font-bold drop-shadow-[0_1px_3px_rgba(255,255,255,0.2)]'
                        : 'text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                    }`}
                  >
                    {val}
                  </span>
                ) : (
                  /* 3x3 Mini Grid for Pencil Marks / Candidates */
                  <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5 pointer-events-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                      const hasNum = candidates.includes(num);
                      const isHighlightedCandidate =
                        selectedValue === num && hasNum;

                      return (
                        <div
                          key={num}
                          className={`flex items-center justify-center text-[8px] sm:text-[10px] font-mono leading-none ${
                            hasNum
                              ? isHighlightedCandidate
                                ? 'text-cyan-300 font-bold drop-shadow-[0_0_4px_rgba(56,189,248,0.8)]'
                                : 'text-white/40'
                              : 'opacity-0'
                          }`}
                        >
                          {num}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Socratic Target Cell Glow Indicator */}
                {tutorHighlight?.role === 'target' && (
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
