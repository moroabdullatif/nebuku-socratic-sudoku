import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Atom,
  Sparkles,
  Send,
  Loader2,
  Trash2,
  BookOpen,
  Compass,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

const STARTER_PROMPTS = [
  { label: 'Ancient Civilizations', prompt: 'Tell me an astonishing, little-known educational fun fact about ancient Egyptian, Mesopotamian, or Roman engineering.' },
  { label: 'Cosmos & Quantum', prompt: 'Share a mind-bending scientific fun fact about quantum entanglement, black holes, or the fabric of spacetime.' },
  { label: 'Origin of Logic & Math', prompt: 'How did ancient astronomical observations and geometry lead to the birth of formal logic and modern computing?' },
  { label: 'Bizarre Historical Overlaps', prompt: 'What are some incredible historical events or figures that surprisingly existed at the exact same point in time?' },
  { label: 'Biology & Evolution', prompt: 'Tell me a fascinating scientific fact about evolutionary adaptation, deep-sea creatures, or genetics.' },
];

export const PolymathChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem('nebuku_polymath_chat_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'init-1',
        role: 'model',
        text: "Welcome to the Curiosity Lounge! I am Nebuku Polymath. My passion is illuminating the hidden marvels of World History and Science—from the clockwork astronomy of ancient Babylon to the strangest paradoxes of quantum physics.\n\nAsk me anything, or pick a curiosity prompt below to begin!",
        timestamp: Date.now(),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dailyFact, setDailyFact] = useState<string>('');
  const [isLoadingFact, setIsLoadingFact] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-persist conversation history
  useEffect(() => {
    try {
      localStorage.setItem('nebuku_polymath_chat_v1', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Fetch initial random fact
  useEffect(() => {
    fetchRandomFact();
  }, []);

  const fetchRandomFact = async () => {
    setIsLoadingFact(true);
    try {
      const res = await fetch('/api/polymath/random-fact');
      if (res.ok) {
        const data = await res.json();
        if (data.fact) setDailyFact(data.fact);
      }
    } catch {
      setDailyFact("Cleopatra lived closer in time to the construction of the iPhone than to the building of the Great Pyramid of Giza!");
    } finally {
      setIsLoadingFact(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || isLoading) return;

    sounds.playCellSelect();
    setInput('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: messageContent,
      timestamp: Date.now(),
    };

    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setIsLoading(true);

    try {
      // Map previous turns for multi-turn history
      const historyPayload = nextHistory.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/chat/polymath', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          history: historyPayload.slice(-12), // Maintain rolling multi-turn context
        }),
      });

      if (res.ok) {
        const data = await res.json();
        sounds.playHintChime();
        setMessages((prev) => [
          ...prev,
          {
            id: `model-${Date.now()}`,
            role: 'model',
            text: data.reply,
            timestamp: Date.now(),
          },
        ]);
        return;
      }
    } catch (err) {
      console.warn('Polymath chat network error:', err);
    } finally {
      setIsLoading(false);
    }

    // Fallback response
    setMessages((prev) => [
      ...prev,
      {
        id: `model-${Date.now()}`,
        role: 'model',
        text: "Did you know that Oxford University is older than the Aztec Empire? Oxford was holding lectures as early as 1096 CE, while the Aztec civilization was founded in Tenochtitlan around 1325 CE!",
        timestamp: Date.now(),
      },
    ]);
  };

  const handleClearHistory = () => {
    if (confirm('Clear Curiosity Lounge conversation history?')) {
      const resetMsg: ChatMessage[] = [
        {
          id: `init-${Date.now()}`,
          role: 'model',
          text: "The archives have refreshed. What era of World History or branch of Science shall we delve into next?",
          timestamp: Date.now(),
        },
      ];
      setMessages(resetMsg);
      localStorage.removeItem('nebuku_polymath_chat_v1');
      sounds.playErase();
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 h-full">
      {/* Container Card */}
      <div className="liquid-glass-elevated rounded-3xl p-4 sm:p-5 border border-white/15 flex flex-col h-[650px] relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-gradient-to-br from-indigo-500/20 to-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/30 to-cyan-500/20 flex items-center justify-center border border-purple-400/30">
              <Globe className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-white/95">Nebuku Polymath</h2>
                <span className="text-[10px] text-cyan-400 font-mono">Gemini Flash</span>
              </div>
              <div className="text-[11px] text-white/40 font-normal">
                Educational Fun Facts: World History & Sciences
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearHistory}
              className="p-1.5 rounded-xl liquid-glass-subtle text-white/50 hover:text-rose-400 transition-colors"
              title="Clear chat history"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Fun Fact of the Moment Ticker */}
        {dailyFact && (
          <div className="mb-3 p-2.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-cyan-950/20 border border-purple-500/20 text-xs text-purple-200/90 flex items-start justify-between gap-2 shrink-0">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">Curiosity Spark: </span>
                <span>{dailyFact}</span>
              </div>
            </div>
            <button
              onClick={fetchRandomFact}
              disabled={isLoadingFact}
              className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors shrink-0"
              title="Get another random fact"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFact ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 text-xs">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}
              >
                <div className="text-[10px] text-white/35 mb-1 px-1 flex items-center gap-1">
                  {isUser ? (
                    <span>You</span>
                  ) : (
                    <>
                      <Atom className="w-3 h-3 text-cyan-400" />
                      <span className="text-cyan-300 font-medium">Nebuku Polymath</span>
                    </>
                  )}
                </div>

                <div
                  className={`p-3.5 rounded-2xl max-w-[90%] sm:max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-500/25 to-indigo-500/25 border border-cyan-400/40 text-cyan-50 shadow-md'
                      : 'liquid-glass border border-white/15 text-white/90 shadow-lg'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start space-x-2 p-3 rounded-2xl liquid-glass border border-white/10 text-xs text-white/60">
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Nebuku Polymath is uncovering the historical archives...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Starter Curiosity Chips */}
        <div className="pt-2 pb-1 overflow-x-auto flex items-center gap-1.5 scrollbar-none shrink-0">
          {STARTER_PROMPTS.map((starter, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(starter.prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-xl liquid-glass-subtle border border-white/10 hover:border-cyan-400/40 hover:bg-cyan-500/10 text-white/70 hover:text-white text-[11px] whitespace-nowrap transition-all duration-150 flex items-center gap-1 shrink-0"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>{starter.label}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="pt-2 flex items-center gap-2 border-t border-white/10 shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about World History, Quantum Physics, ancient discoveries..."
            className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-500/30 to-cyan-500/30 hover:from-purple-500/40 hover:to-cyan-500/40 border border-cyan-400/40 text-cyan-200 disabled:opacity-40 disabled:cursor-not-allowed liquid-glass-interactive shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
