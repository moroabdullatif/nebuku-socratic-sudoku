import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  ListOrdered,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { LogicStep, SolutionExplanationResponse, CellCoord } from '../types/sudoku';

interface SolutionLogicDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  solutionData: SolutionExplanationResponse | null;
  isLoading: boolean;
  onSelectStepCell: (cell: CellCoord, related: { cell: CellCoord; role: 'target' | 'peer' | 'cause' }[]) => void;
  onApplyStep?: (step: LogicStep) => void;
  onExplainRequested: () => void;
}

export const SolutionLogicDrawer: React.FC<SolutionLogicDrawerProps> = ({
  isOpen,
  onClose,
  solutionData,
  isLoading,
  onSelectStepCell,
  onApplyStep,
  onExplainRequested,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const steps = solutionData?.steps || [];
  const currentStep = steps[currentStepIndex] || null;

  // Auto-play timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoPlaying && steps.length > 0) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsAutoPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2500);
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying, steps.length]);

  // Sync board highlights whenever current step changes
  useEffect(() => {
    if (currentStep) {
      onSelectStepCell(currentStep.cell, currentStep.involvedCells || []);
    }
  }, [currentStepIndex, currentStep, onSelectStepCell]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col liquid-glass-elevated rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/30 flex items-center justify-center border border-indigo-400/30">
              <ListOrdered className="w-4 h-4 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white/95">
                Logical Deduction Breakdown
              </h2>
              <div className="text-[11px] text-white/40 font-normal">
                Step-by-Step Educational Solution Sequence
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setIsAutoPlaying(false);
              onClose();
            }}
            className="p-1.5 rounded-xl liquid-glass-subtle text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
              <div className="text-xs text-white/70 font-medium">
                Solving remaining puzzle & constructing logical chain...
              </div>
            </div>
          ) : !solutionData || steps.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Lightbulb className="w-10 h-10 text-amber-400/80 mx-auto" />
              <div className="text-sm font-semibold text-white/90">
                Ready to review the complete logical deduction process?
              </div>
              <p className="text-xs text-white/50 max-w-md mx-auto">
                Nebuku will logically solve all remaining empty cells from your current state and
                break down the mathematical deduction behind each number.
              </p>
              <button
                onClick={onExplainRequested}
                className="mt-2 px-5 py-2.5 rounded-2xl bg-cyan-500/25 hover:bg-cyan-500/35 border border-cyan-400/40 text-cyan-100 text-xs font-semibold liquid-glass-interactive"
              >
                Generate Breakdown Now
              </button>
            </div>
          ) : (
            <>
              {/* Overall Strategy Summary */}
              {solutionData.overallStrategy && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-cyan-950/30 border border-indigo-500/20 text-xs leading-relaxed text-indigo-100/90 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-indigo-300">Strategy Overview: </span>
                    {solutionData.overallStrategy}
                  </div>
                </div>
              )}

              {/* Step Navigation Bar */}
              <div className="flex items-center justify-between p-3 rounded-2xl liquid-glass-subtle border border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-cyan-400 font-mono">
                    Step {currentStepIndex + 1}
                  </span>
                  <span className="text-white/40 text-xs">/</span>
                  <span className="text-xs text-white/60 font-mono">{steps.length}</span>
                </div>

                {/* Progress bar */}
                <div className="hidden sm:block flex-1 mx-4 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-300"
                    style={{
                      width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
                    }}
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentStepIndex === 0}
                    onClick={() => setCurrentStepIndex((p) => Math.max(0, p - 1))}
                    className="p-1.5 rounded-xl liquid-glass-subtle text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Previous Step"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      isAutoPlaying
                        ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                        : 'liquid-glass-subtle border-white/10 text-white/80 hover:text-white'
                    }`}
                  >
                    {isAutoPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-amber-400" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Auto-Play</span>
                      </>
                    )}
                  </button>

                  <button
                    disabled={currentStepIndex >= steps.length - 1}
                    onClick={() => setCurrentStepIndex((p) => Math.min(steps.length - 1, p + 1))}
                    className="p-1.5 rounded-xl liquid-glass-subtle text-white/80 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Next Step"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Current Step Detailed Card */}
              {currentStep && (
                <div className="p-4 sm:p-5 rounded-2xl liquid-glass border border-white/15 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono font-semibold text-xs">
                        Cell (R{currentStep.cell.row + 1}, C{currentStep.cell.col + 1})
                      </div>
                      <div className="text-xs font-semibold text-white/90">
                        {currentStep.technique}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/50">Deduced Digit:</span>
                      <span className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono font-bold text-sm flex items-center justify-center">
                        {currentStep.digit}
                      </span>
                    </div>
                  </div>

                  {/* Deduction Explanation */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                      Logical Deduction
                    </div>
                    <p className="text-xs text-white/85 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
                      {currentStep.explanation}
                    </p>
                  </div>

                  {/* Why Valid */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-emerald-400/80 uppercase tracking-wider">
                      Mathematical Verification
                    </div>
                    <div className="text-xs text-white/70 leading-relaxed pl-3 border-l-2 border-emerald-500/40">
                      {currentStep.whyValid}
                    </div>
                  </div>

                  {/* Action: Apply step */}
                  {onApplyStep && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => onApplyStep(currentStep)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-medium liquid-glass-interactive"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
                        <span>Place this digit on grid</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Condensed Step Index Grid */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-white/50 flex items-center justify-between">
                  <span>All Solution Steps</span>
                  <span className="text-white/30 text-[10px]">Click any step to inspect</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                  {steps.map((st, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentStepIndex(idx)}
                      className={`p-2 rounded-xl text-left border transition-all text-xs ${
                        idx === currentStepIndex
                          ? 'bg-cyan-500/25 border-cyan-400/50 text-white shadow-md'
                          : 'liquid-glass-subtle border-white/5 text-white/60 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-cyan-400">
                          #{st.stepIndex}
                        </span>
                        <span className="font-mono font-bold text-emerald-300 text-xs">
                          {st.digit}
                        </span>
                      </div>
                      <div className="text-[11px] truncate text-white/80 mt-0.5">
                        {st.technique}
                      </div>
                      <div className="text-[10px] text-white/40">
                        R{st.cell.row + 1}C{st.cell.col + 1}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/20">
          <div className="text-[11px] text-white/40">
            Educational logic synthesis powered by Nebuku Deductive Engine
          </div>
          <button
            onClick={() => {
              setIsAutoPlaying(false);
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl liquid-glass-subtle border border-white/10 text-xs text-white/80 hover:text-white"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
