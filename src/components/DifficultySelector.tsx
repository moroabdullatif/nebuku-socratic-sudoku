import React from 'react';
import { Sparkles, TrendingUp, ChevronRight } from 'lucide-react';
import { Difficulty, ProficiencyProfile } from '../types/sudoku';

interface DifficultySelectorProps {
  difficulty: Difficulty;
  onSelectDifficulty: (d: Difficulty) => void;
  profile: ProficiencyProfile;
  disabled?: boolean;
  onOpenCalibration?: () => void;
}

export function calculateTierProgression(mmr: number) {
  if (mmr < 1100) {
    const floor = 800;
    const ceil = 1100;
    const pointsNeeded = Math.max(0, ceil - mmr);
    // Average clean solve yields ~25 MMR
    const puzzlesNeeded = Math.max(1, Math.ceil(pointsNeeded / 25));
    const progressPct = Math.min(100, Math.max(0, ((mmr - floor) / (ceil - floor)) * 100));
    return {
      currentTier: 'Novice Logician',
      nextTier: 'Adept Deductive',
      targetMMR: ceil,
      pointsNeeded,
      puzzlesNeeded,
      progressPct: Math.round(progressPct),
      isMaxTier: false,
    };
  }

  if (mmr < 1400) {
    const floor = 1100;
    const ceil = 1400;
    const pointsNeeded = Math.max(0, ceil - mmr);
    const puzzlesNeeded = Math.max(1, Math.ceil(pointsNeeded / 25));
    const progressPct = Math.min(100, Math.max(0, ((mmr - floor) / (ceil - floor)) * 100));
    return {
      currentTier: 'Adept Deductive',
      nextTier: 'Logic Scholar',
      targetMMR: ceil,
      pointsNeeded,
      puzzlesNeeded,
      progressPct: Math.round(progressPct),
      isMaxTier: false,
    };
  }

  if (mmr < 1700) {
    const floor = 1400;
    const ceil = 1700;
    const pointsNeeded = Math.max(0, ceil - mmr);
    const puzzlesNeeded = Math.max(1, Math.ceil(pointsNeeded / 25));
    const progressPct = Math.min(100, Math.max(0, ((mmr - floor) / (ceil - floor)) * 100));
    return {
      currentTier: 'Logic Scholar',
      nextTier: 'Master Tactician',
      targetMMR: ceil,
      pointsNeeded,
      puzzlesNeeded,
      progressPct: Math.round(progressPct),
      isMaxTier: false,
    };
  }

  if (mmr < 2000) {
    const floor = 1700;
    const ceil = 2000;
    const pointsNeeded = Math.max(0, ceil - mmr);
    const puzzlesNeeded = Math.max(1, Math.ceil(pointsNeeded / 25));
    const progressPct = Math.min(100, Math.max(0, ((mmr - floor) / (ceil - floor)) * 100));
    return {
      currentTier: 'Master Tactician',
      nextTier: 'Grandmaster',
      targetMMR: ceil,
      pointsNeeded,
      puzzlesNeeded,
      progressPct: Math.round(progressPct),
      isMaxTier: false,
    };
  }

  // Peak Grandmaster tier
  const floor = 2000;
  const ceil = 2400;
  const progressPct = Math.min(100, Math.max(0, ((mmr - floor) / (ceil - floor)) * 100));
  return {
    currentTier: 'Grandmaster',
    nextTier: 'Peak Mastery',
    targetMMR: 2400,
    pointsNeeded: Math.max(0, 2400 - mmr),
    puzzlesNeeded: 0,
    progressPct: Math.round(progressPct),
    isMaxTier: true,
  };
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  difficulty,
  onSelectDifficulty,
  profile,
  disabled = false,
  onOpenCalibration,
}) => {
  const options: { id: Difficulty; label: string; sub?: string }[] = [
    { id: 'easy', label: 'Easy', sub: '38 clues' },
    { id: 'medium', label: 'Medium', sub: '30 clues' },
    { id: 'hard', label: 'Hard', sub: '25 clues' },
    { id: 'adaptive', label: 'Adaptive', sub: `${profile.mmr} MMR` },
  ];

  const tierInfo = calculateTierProgression(profile.mmr);

  return (
    <div className="w-full max-w-[460px] flex flex-col items-center py-2 px-2">
      {/* Segmented Difficulty Selector */}
      <div className="inline-flex p-1 rounded-2xl liquid-glass border border-white/10 relative">
        {options.map((opt) => {
          const isActive = difficulty === opt.id;
          const isAdaptive = opt.id === 'adaptive';

          return (
            <button
              key={opt.id}
              disabled={disabled}
              onClick={() => onSelectDifficulty(opt.id)}
              className={`relative px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-gradient-to-b from-white/20 to-white/5 text-white shadow-lg border border-white/20'
                  : 'text-white/60 hover:text-white/90 hover:bg-white/5'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isAdaptive && (
                <Sparkles
                  className={`w-3.5 h-3.5 ${
                    isActive ? 'text-cyan-300 animate-pulse' : 'text-indigo-400'
                  }`}
                />
              )}
              <span>{opt.label}</span>
              {opt.sub && (
                <span
                  className={`text-[10px] hidden sm:inline ${
                    isActive ? 'text-white/70' : 'text-white/40'
                  }`}
                >
                  ({opt.sub})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Visual ELO Tier Progression Progress Bar */}
      <div
        onClick={onOpenCalibration}
        className="w-full mt-2.5 px-3 py-2 rounded-2xl liquid-glass-subtle border border-white/10 transition-all duration-200 hover:border-white/20 hover:bg-white/[0.04] cursor-pointer group"
        title="Click to view detailed ELO calibration and technique mastery"
      >
        <div className="flex items-center justify-between text-[11px] mb-1.5 text-white/70">
          {/* Current Tier -> Next Tier */}
          <div className="flex items-center gap-1.5 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-white/90">{tierInfo.currentTier}</span>
            {!tierInfo.isMaxTier && (
              <>
                <ChevronRight className="w-3 h-3 text-white/40" />
                <span className="text-indigo-300">{tierInfo.nextTier}</span>
              </>
            )}
          </div>

          {/* How many more puzzles needed */}
          <div className="font-mono text-[10px]">
            {tierInfo.isMaxTier ? (
              <span className="text-emerald-400 font-semibold">Peak Standing</span>
            ) : (
              <span className="text-cyan-300/90 font-medium">
                ~{tierInfo.puzzlesNeeded} more {tierInfo.puzzlesNeeded === 1 ? 'solve' : 'solves'}{' '}
                to advance
              </span>
            )}
          </div>
        </div>

        {/* Liquid Glass Progress Bar Track */}
        <div className="w-full h-1.5 rounded-full bg-black/40 border border-white/10 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-cyan-300 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(56,189,248,0.5)]"
            style={{ width: `${Math.max(4, tierInfo.progressPct)}%` }}
          />
        </div>

        {/* Secondary Subtext with MMR delta and percentage */}
        <div className="flex items-center justify-between text-[9px] text-white/40 mt-1 font-mono">
          <span>{profile.mmr} MMR</span>
          <span>{tierInfo.progressPct}% to next tier</span>
          <span>{tierInfo.targetMMR} MMR</span>
        </div>
      </div>
    </div>
  );
};
