import React, { useState } from 'react';
import {
  Sparkles,
  HelpCircle,
  Brain,
  Compass,
  Eye,
  EyeOff,
  Send,
  Loader2,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { SocraticHintResponse, CellCoord } from '../types/sudoku';

interface SocraticCoachPanelProps {
  currentHint: SocraticHintResponse | null;
  isLoadingHint: boolean;
  onRequestHint: (level?: number) => void;
  showBoardHighlights: boolean;
  onToggleHighlights: () => void;
  onSelectCellTarget?: (coord: CellCoord) => void;
  onSendChatMessage: (msg: string) => Promise<string>;
  disabled?: boolean;
}

export const SocraticCoachPanel: React.FC<SocraticCoachPanelProps> = ({
  currentHint,
  isLoadingHint,
  onRequestHint,
  showBoardHighlights,
  onToggleHighlights,
  onSelectCellTarget,
  onSendChatMessage,
  disabled = false,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'tutor'; text: string }[]>([
    {
      sender: 'tutor',
      text: 'Greetings, logician. I am Nebuku, your Socratic tutor. Whenever a grid poses a puzzle, ask for a hint or inquire about any row, column, or technique.',
    },
  ]);
  const [isChatSending, setIsChatSending] = useState(false);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatSending) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsChatSending(true);

    try {
      const reply = await onSendChatMessage(userText);
      setChatMessages((prev) => [...prev, { sender: 'tutor', text: reply }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'tutor',
          text: 'Consider what candidates are already eliminated by intersecting rows and columns.',
        },
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Primary Socratic Action Card */}
      <div className="liquid-glass-elevated rounded-3xl p-4 sm:p-5 border border-white/15 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-gradient-to-br from-cyan-500/20 to-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Coach Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-cyan-400/20 to-indigo-500/30 flex items-center justify-center border border-cyan-400/30">
              <Brain className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-white/95">
                Socratic AI Logic Coach
              </h2>
              <div className="text-[11px] text-cyan-400/80 font-normal">
                Powered by Gemini Flash · Never Spoilers
              </div>
            </div>
          </div>

          {currentHint && (
            <button
              onClick={onToggleHighlights}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl liquid-glass-subtle text-[11px] text-white/70 hover:text-white transition-colors"
              title="Toggle board visual focus indicators"
            >
              {showBoardHighlights ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Highlights On</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-white/40" />
                  <span>Highlights Off</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* AI Tutor Hint Trigger Button & Levels */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <button
            disabled={disabled || isLoadingHint}
            onClick={() => onRequestHint(currentHint ? Math.min(3, currentHint.level + 1) : 1)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500/25 via-indigo-500/20 to-cyan-500/25 hover:from-cyan-500/35 hover:to-indigo-500/30 border border-cyan-400/40 text-cyan-100 font-medium text-xs shadow-lg shadow-cyan-950/40 liquid-glass-interactive group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingHint ? (
              <>
                <Loader2 className="w-4 h-4 text-cyan-300 animate-spin" />
                <span>Nebuku is reasoning...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-300 group-hover:rotate-12 transition-transform" />
                <span>
                  {currentHint
                    ? currentHint.level < 3
                      ? `Deepen Hint (Level ${currentHint.level + 1}/3)`
                      : 'Refresh Socratic Hint'
                    : 'AI Tutor Hint'}
                </span>
              </>
            )}
          </button>

          {/* Quick Level Tabs if hint exists */}
          {currentHint && (
            <div className="flex items-center gap-1 p-1 rounded-2xl liquid-glass-subtle self-center">
              {[1, 2, 3].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => onRequestHint(lvl)}
                  disabled={isLoadingHint}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-mono transition-all ${
                    currentHint.level === lvl
                      ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 font-semibold'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                  title={
                    lvl === 1
                      ? 'Level 1: Directional Nudge'
                      : lvl === 2
                      ? 'Level 2: Technique & Socratic Questions'
                      : 'Level 3: Deep Elimination Insight'
                  }
                >
                  L{lvl}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active Socratic Guidance Content */}
        {currentHint ? (
          <div className="space-y-3 animate-in fade-in duration-300">
            {/* Pedagogical Nudge */}
            <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-100/90 leading-relaxed flex items-start gap-2.5">
              <Compass className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-cyan-300">Pedagogical Nudge: </span>
                {currentHint.pedagogicalNudge}
              </div>
            </div>

            {/* Technique Card (Level 2+) */}
            {currentHint.level >= 2 && (
              <div className="p-3 rounded-2xl liquid-glass-subtle border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-semibold text-white/90">
                      Technique: {currentHint.techniqueName}
                    </span>
                  </div>
                  {currentHint.focusRegion?.row !== undefined &&
                    currentHint.focusRegion?.col !== undefined && (
                      <button
                        onClick={() =>
                          onSelectCellTarget?.({
                            row: currentHint.focusRegion.row!,
                            col: currentHint.focusRegion.col!,
                          })
                        }
                        className="text-[11px] text-cyan-400 hover:underline flex items-center gap-0.5"
                      >
                        <span>Focus Cell</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  {currentHint.techniqueDescription}
                </p>
              </div>
            )}

            {/* Guiding Questions (Socratic Core) */}
            {currentHint.guidingQuestions && currentHint.guidingQuestions.length > 0 && (
              <div className="p-3 rounded-2xl liquid-glass-subtle border border-white/10">
                <div className="text-[11px] font-semibold text-amber-300/90 mb-2 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Socratic Questions to Ponder</span>
                </div>
                <div className="space-y-2">
                  {currentHint.guidingQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-white/80 pl-3 border-l-2 border-amber-400/40 leading-snug"
                    >
                      {q}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl liquid-glass-subtle border border-white/5 text-center text-xs text-white/50 leading-relaxed">
            Need guidance? Press <strong className="text-cyan-300">AI Tutor Hint</strong>. Nebuku
            will analyze the grid and present Socratic inquiry without depriving you of the eureka
            moment.
          </div>
        )}
      </div>

      {/* Interactive Socratic Dialogue Box */}
      <div className="liquid-glass rounded-3xl p-4 border border-white/10 flex flex-col">
        <div className="text-xs font-semibold text-white/80 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Consult Nebuku</span>
          </div>
          <span className="text-[10px] text-white/40">Ask about any cell or rule</span>
        </div>

        {/* Message Stream */}
        <div className="max-h-36 overflow-y-auto space-y-2 pr-1 mb-3 text-xs">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`p-2.5 rounded-2xl leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-400/30 ml-6'
                  : 'bg-white/[0.04] text-white/80 border border-white/5 mr-4'
              }`}
            >
              <div className="text-[10px] font-semibold mb-0.5 text-white/40">
                {msg.sender === 'user' ? 'You' : 'Nebuku Tutor'}
              </div>
              {msg.text}
            </div>
          ))}
          {isChatSending && (
            <div className="p-2 rounded-xl bg-white/[0.03] text-white/50 text-xs italic flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
              <span>Nebuku is formulating a question...</span>
            </div>
          )}
        </div>

        {/* Input Field */}
        <form onSubmit={handleSendChat} className="flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="e.g. Why can't Row 3 have a 7? or Explain Naked Single"
            className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || isChatSending}
            className="p-2 rounded-2xl bg-cyan-500/25 hover:bg-cyan-500/35 border border-cyan-400/40 text-cyan-200 disabled:opacity-40 disabled:cursor-not-allowed liquid-glass-interactive"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
