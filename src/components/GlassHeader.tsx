import React from 'react';
import { Play, Pause, RotateCcw, Plus, Sparkles, BarChart2, ShieldAlert, Volume2, VolumeX, Globe } from 'lucide-react';
import { Difficulty, ProficiencyProfile } from '../types/sudoku';

interface GlassHeaderProps {
  difficulty: Difficulty;
  onSelectDifficulty: (d: Difficulty) => void;
  timerSeconds: number;
  isPaused: boolean;
  onTogglePause: () => void;
  mistakes: number;
  maxMistakes: number;
  onNewGame: () => void;
  onRestart: () => void;
  profile: ProficiencyProfile;
  onOpenCalibration: () => void;
  isSoundMuted: boolean;
  onToggleSound: () => void;
  onOpenCuriosityLounge?: () => void;
}

export const GlassHeader: React.FC<GlassHeaderProps> = ({
  difficulty,
  onSelectDifficulty,
  timerSeconds,
  isPaused,
  onTogglePause,
  mistakes,
  maxMistakes,
  onNewGame,
  onRestart,
  profile,
  onOpenCalibration,
  isSoundMuted,
  onToggleSound,
  onOpenCuriosityLounge,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="w-full max-w-5xl mx-auto px-4 pt-4 pb-3">
      {/* Top Glass Navigation Bar */}
      <div className="liquid-glass rounded-2xl p-3 md:px-5 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl liquid-glass-elevated flex items-center justify-center overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/30 to-indigo-500/20 group-hover:opacity-100 transition-opacity" />
            <div className="relative text-cyan-400 font-bold text-lg font-mono">N</div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white/95">Nebuku</span>
              <span className="text-xs text-cyan-400/90 font-medium">Liquid Logic</span>
            </div>
            <div className="text-[11px] text-white/40 font-normal">
              Socratic Sudoku & Deduction Coach
            </div>
          </div>
        </div>

        {/* Status Indicators: Timer & Mistakes */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Timer Display */}
          <button
            onClick={onTogglePause}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl liquid-glass-subtle liquid-glass-interactive text-xs font-mono text-white/80 hover:text-white"
            title={isPaused ? 'Resume Timer' : 'Pause Timer'}
          >
            {isPaused ? (
              <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            ) : (
              <Pause className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className={isPaused ? 'text-amber-300 font-semibold' : 'text-white/90'}>
              {formatTime(timerSeconds)}
            </span>
          </button>

          {/* Mistakes Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-subtle text-xs">
            <ShieldAlert
              className={`w-3.5 h-3.5 ${
                mistakes > 0 ? (mistakes >= maxMistakes ? 'text-rose-500' : 'text-amber-400') : 'text-white/40'
              }`}
            />
            <span className="text-white/50">Mistakes:</span>
            <span
              className={`font-semibold font-mono ${
                mistakes > 0 ? (mistakes >= maxMistakes ? 'text-rose-400' : 'text-amber-300') : 'text-white/80'
              }`}
            >
              {mistakes}
            </span>
            <span className="text-white/30">/</span>
            <span className="text-white/40 font-mono">{maxMistakes}</span>
          </div>

          {/* Proficiency / Calibration Badge */}
          <button
            onClick={onOpenCalibration}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl liquid-glass-subtle liquid-glass-interactive group text-xs text-white/80 hover:text-white"
            title="Open Adaptive Proficiency Calibration"
          >
            <BarChart2 className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline text-white/50 text-[11px] font-normal">Proficiency:</span>
              <span className="font-semibold text-indigo-300 font-mono">{profile.mmr}</span>
              <span className="text-[10px] text-white/40 hidden md:inline">· {profile.tier}</span>
            </div>
          </button>

          {/* Curiosity Lounge Button */}
          {onOpenCuriosityLounge && (
            <button
              onClick={onOpenCuriosityLounge}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-subtle liquid-glass-interactive group text-xs text-purple-200 hover:text-white border border-purple-400/20"
              title="Open History & Science Curiosity Lounge"
            >
              <Globe className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">Curiosity Lounge</span>
            </button>
          )}
        </div>

        {/* Game Controls & Sound Toggle */}
        <div className="flex items-center gap-2">
          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-xl liquid-glass-subtle liquid-glass-interactive text-white/70 hover:text-white"
            title={isSoundMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          >
            {isSoundMuted ? (
              <VolumeX className="w-4 h-4 text-white/40" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>

          <button
            onClick={onRestart}
            className="p-2 rounded-xl liquid-glass-subtle liquid-glass-interactive text-white/70 hover:text-white"
            title="Restart Current Puzzle"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onNewGame}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 border border-cyan-400/30 text-cyan-200 text-xs font-medium liquid-glass-interactive"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Game</span>
          </button>
        </div>
      </div>
    </header>
  );
};
