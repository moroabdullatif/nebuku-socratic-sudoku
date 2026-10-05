import React from 'react';
import {
  X,
  Award,
  Zap,
  Clock,
  Target,
  ShieldCheck,
  TrendingUp,
  Brain,
  History,
  RotateCcw,
} from 'lucide-react';
import { ProficiencyProfile } from '../types/sudoku';
import { calculateTargetCluesForMMR, INITIAL_PROFILE, saveProfile } from '../utils/calibrationEngine';

interface ProficiencyCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProficiencyProfile;
  onUpdateProfile: (p: ProficiencyProfile) => void;
}

export const ProficiencyCalibrationModal: React.FC<ProficiencyCalibrationModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
}) => {
  if (!isOpen) return null;

  const targetClues = calculateTargetCluesForMMR(profile.mmr);

  // Next tier threshold calculation
  const getNextTierInfo = (mmr: number) => {
    if (mmr < 1100) return { next: 'Adept Deductive', target: 1100, progress: (mmr - 800) / 300 };
    if (mmr < 1400) return { next: 'Logic Scholar', target: 1400, progress: (mmr - 1100) / 300 };
    if (mmr < 1700) return { next: 'Master Tactician', target: 1700, progress: (mmr - 1400) / 300 };
    if (mmr < 2000) return { next: 'Grandmaster', target: 2000, progress: (mmr - 1700) / 300 };
    return { next: 'Grandmaster Peak', target: 2400, progress: Math.min(1, (mmr - 2000) / 400) };
  };

  const nextTier = getNextTierInfo(profile.mmr);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  const handleResetProfile = () => {
    if (confirm('Reset your proficiency calibration profile to baseline?')) {
      saveProfile(INITIAL_PROFILE);
      onUpdateProfile(INITIAL_PROFILE);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col liquid-glass-elevated rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/30 flex items-center justify-center border border-indigo-400/30">
              <Award className="w-4 h-4 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white/95">
                Dynamic Proficiency Calibration
              </h2>
              <div className="text-[11px] text-white/40 font-normal">
                Adaptive Skill Index & Logical Technique Calibration
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl liquid-glass-subtle text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Top Banner: MMR and Tier */}
          <div className="p-4 sm:p-5 rounded-2xl liquid-glass border border-white/15 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mb-1">
                  Current Standing
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
                  <span>{profile.tier}</span>
                  <span className="text-base font-mono text-indigo-300 font-semibold">
                    ({profile.mmr} MMR)
                  </span>
                </div>
                <div className="text-xs text-white/60 mt-1">
                  Adaptive Clue Target:{' '}
                  <strong className="text-cyan-300 font-mono">{targetClues} clues</strong> per
                  puzzle
                </div>
              </div>

              {/* Progress to next tier */}
              <div className="sm:text-right min-w-[160px]">
                <div className="text-[11px] text-white/50 mb-1">
                  Next Tier: <span className="text-white/80">{nextTier.next}</span> ({nextTier.target} MMR)
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full"
                    style={{ width: `${Math.max(5, Math.min(100, nextTier.progress * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Key Metric Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl liquid-glass-subtle border border-white/10">
              <div className="flex items-center gap-1.5 text-white/50 text-xs mb-1">
                <Target className="w-3.5 h-3.5 text-cyan-400" />
                <span>Win Rate</span>
              </div>
              <div className="text-base font-bold font-mono text-white">
                {profile.gamesPlayed > 0
                  ? `${Math.round((profile.gamesWon / profile.gamesPlayed) * 100)}%`
                  : '—'}
              </div>
              <div className="text-[10px] text-white/40">
                {profile.gamesWon} / {profile.gamesPlayed} solved
              </div>
            </div>

            <div className="p-3 rounded-2xl liquid-glass-subtle border border-white/10">
              <div className="flex items-center gap-1.5 text-white/50 text-xs mb-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Avg Solve Time</span>
              </div>
              <div className="text-base font-bold font-mono text-white">
                {profile.avgSolveTimeSec > 0 ? formatSeconds(profile.avgSolveTimeSec) : '—'}
              </div>
              <div className="text-[10px] text-white/40">Across completed games</div>
            </div>

            <div className="p-3 rounded-2xl liquid-glass-subtle border border-white/10">
              <div className="flex items-center gap-1.5 text-white/50 text-xs mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Best Streak</span>
              </div>
              <div className="text-base font-bold font-mono text-white">
                {profile.winStreak}{' '}
                <span className="text-xs font-normal text-white/50">
                  (current: {profile.currentStreak})
                </span>
              </div>
              <div className="text-[10px] text-white/40">Consecutive victories</div>
            </div>

            <div className="p-3 rounded-2xl liquid-glass-subtle border border-white/10">
              <div className="flex items-center gap-1.5 text-white/50 text-xs mb-1">
                <Brain className="w-3.5 h-3.5 text-emerald-400" />
                <span>Autonomy</span>
              </div>
              <div className="text-base font-bold font-mono text-white">
                {100 - profile.hintDependencyScore}%
              </div>
              <div className="text-[10px] text-white/40">Independent deduction</div>
            </div>
          </div>

          {/* Technique Mastery Breakdown */}
          <div className="p-4 rounded-2xl liquid-glass-subtle border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/90">
                Logic Technique Mastery Calibration
              </span>
              <span className="text-[10px] text-white/40">Deductive Proficiency</span>
            </div>

            <div className="space-y-2.5">
              {[
                { name: 'Naked Single', score: profile.techniqueProficiency.nakedSingle },
                { name: 'Hidden Single (Row/Col/Box)', score: profile.techniqueProficiency.hiddenSingle },
                { name: 'Box-Line Reduction', score: profile.techniqueProficiency.boxLineReduction },
                { name: 'Naked Pairs', score: profile.techniqueProficiency.nakedPairs },
                { name: 'Hidden Pairs', score: profile.techniqueProficiency.hiddenPairs },
                { name: 'Advanced Intersections (X-Wing)', score: profile.techniqueProficiency.advancedXWing },
              ].map((tech) => (
                <div key={tech.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">{tech.name}</span>
                    <span className="font-mono text-white/90 font-medium">{tech.score}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${tech.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Match History */}
          <div className="p-4 rounded-2xl liquid-glass-subtle border border-white/10 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90">
              <History className="w-3.5 h-3.5 text-white/50" />
              <span>Recent Calibration History</span>
            </div>

            {profile.recentHistory.length === 0 ? (
              <div className="text-center py-4 text-xs text-white/40">
                Play your first puzzle to begin calibration tracking.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {profile.recentHistory.map((item, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.won ? 'bg-emerald-400' : 'bg-rose-500'
                        }`}
                      />
                      <span className="text-white/80 capitalize">{item.difficulty}</span>
                      <span className="text-white/40 text-[10px]">{item.date}</span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-white/60">{formatSeconds(item.timeTakenSec)}</span>
                      <span
                        className={`font-semibold ${
                          item.mmrDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.mmrDelta >= 0 ? `+${item.mmrDelta}` : item.mmrDelta} MMR
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/20">
          <button
            onClick={handleResetProfile}
            className="flex items-center gap-1 text-[11px] text-white/40 hover:text-rose-400 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Profile</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl liquid-glass-subtle border border-white/10 text-xs text-white/80 hover:text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
