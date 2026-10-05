import React from 'react';
import { Trophy, Clock, ShieldCheck, Sparkles, ArrowRight, RotateCcw, BookOpen } from 'lucide-react';
import { Difficulty } from '../types/sudoku';

interface WinModalProps {
  isOpen: boolean;
  isVictory: boolean;
  timeSeconds: number;
  mistakes: number;
  hintsUsed: number;
  difficulty: Difficulty;
  mmrDelta: number;
  newMMR: number;
  newTier: string;
  onNewGame: () => void;
  onReviewLogic: () => void;
  onClose: () => void;
}

export const WinModal: React.FC<WinModalProps> = ({
  isOpen,
  isVictory,
  timeSeconds,
  mistakes,
  hintsUsed,
  difficulty,
  mmrDelta,
  newMMR,
  newTier,
  onNewGame,
  onReviewLogic,
  onClose,
}) => {
  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-md liquid-glass-elevated rounded-3xl border border-white/20 p-6 sm:p-7 shadow-2xl text-center overflow-hidden">
        {/* Ambient Glow */}
        <div
          className={`absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            isVictory ? 'bg-cyan-500/25' : 'bg-rose-500/20'
          }`}
        />

        {/* Icon */}
        <div
          className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center border shadow-xl ${
            isVictory
              ? 'bg-gradient-to-tr from-cyan-500/30 to-indigo-500/30 border-cyan-400/50 text-cyan-300'
              : 'bg-gradient-to-tr from-rose-500/20 to-amber-500/20 border-rose-400/40 text-rose-300'
          }`}
        >
          {isVictory ? <Trophy className="w-8 h-8" /> : <RotateCcw className="w-8 h-8" />}
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-1">
          {isVictory ? 'Deduction Accomplished' : 'Logical Limit Reached'}
        </h2>
        <p className="text-xs text-white/60 mb-5 max-w-xs mx-auto">
          {isVictory
            ? 'You reasoned through each constraint with mathematical poise and precision.'
            : 'Every mistake in Sudoku reveals a deeper structural pattern. Review and try again!'}
        </p>

        {/* MMR Calibration Delta Card */}
        <div className="p-3.5 rounded-2xl liquid-glass border border-white/15 mb-5 flex items-center justify-around">
          <div>
            <div className="text-[11px] text-white/50 mb-0.5">Rating Calibration</div>
            <div
              className={`text-lg font-bold font-mono ${
                mmrDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {mmrDelta >= 0 ? `+${mmrDelta}` : mmrDelta} MMR
            </div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="text-[11px] text-white/50 mb-0.5">New Standing</div>
            <div className="text-sm font-semibold text-white font-mono">
              {newMMR} · <span className="text-indigo-300 text-xs">{newTier}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="p-2.5 rounded-xl liquid-glass-subtle border border-white/5">
            <div className="text-[10px] text-white/40 mb-1 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Time</span>
            </div>
            <div className="font-mono text-xs font-semibold text-white">
              {formatTime(timeSeconds)}
            </div>
          </div>

          <div className="p-2.5 rounded-xl liquid-glass-subtle border border-white/5">
            <div className="text-[10px] text-white/40 mb-1 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              <span>Mistakes</span>
            </div>
            <div className="font-mono text-xs font-semibold text-white">{mistakes}</div>
          </div>

          <div className="p-2.5 rounded-xl liquid-glass-subtle border border-white/5">
            <div className="text-[10px] text-white/40 mb-1 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Hints</span>
            </div>
            <div className="font-mono text-xs font-semibold text-white">{hintsUsed}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={onReviewLogic}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-2xl liquid-glass-subtle hover:bg-white/10 border border-white/10 text-white/80 text-xs font-medium liquid-glass-interactive"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Explain Solution Logic</span>
          </button>
          <button
            onClick={onNewGame}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500/30 to-indigo-500/30 hover:from-cyan-500/40 hover:to-indigo-500/40 border border-cyan-400/40 text-cyan-100 text-xs font-semibold liquid-glass-interactive"
          >
            <span>Next Puzzle</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
