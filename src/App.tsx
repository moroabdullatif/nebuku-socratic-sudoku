import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GlassHeader } from './components/GlassHeader';
import { DifficultySelector } from './components/DifficultySelector';
import { SudokuGrid } from './components/SudokuGrid';
import { GlassKeypad } from './components/GlassKeypad';
import { SocraticCoachPanel } from './components/SocraticCoachPanel';
import { SolutionLogicDrawer } from './components/SolutionLogicDrawer';
import { ProficiencyCalibrationModal } from './components/ProficiencyCalibrationModal';
import { WinModal } from './components/WinModal';
import {
  BoardGrid,
  CellCoord,
  Difficulty,
  ProficiencyProfile,
  SocraticHintResponse,
  SolutionExplanationResponse,
  LogicStep,
} from './types/sudoku';
import {
  createEmptyGrid,
  cloneGrid,
  generateSudoku,
  getPrebuiltPuzzle,
  getAllCandidates,
  getCandidates,
  isValidMove,
  findConflicts,
  isBoardSolved,
  findNextLogicalDeduction,
  generateFullLogicalSteps,
} from './utils/sudokuEngine';
import {
  loadProfile,
  saveProfile,
  recordGameResult,
  calculateTargetCluesForMMR,
} from './utils/calibrationEngine';
import { sounds } from './utils/soundEffects';
import {
  usePersistentGameState,
  loadSavedGameState,
  clearSavedGameState,
} from './hooks/usePersistentGameState';
import { PolymathChatPanel } from './components/PolymathChatPanel';
import { BookOpen, Sparkles, Globe, Brain } from 'lucide-react';

export default function App() {
  // Check for saved state on initial load
  const initialSaved = useRef(loadSavedGameState());

  // --- State: Game Board & Difficulty ---
  const [difficulty, setDifficulty] = useState<Difficulty>(
    () => initialSaved.current?.difficulty || 'adaptive'
  );
  const [grid, setGrid] = useState<BoardGrid>(
    () => initialSaved.current?.grid || createEmptyGrid()
  );
  const [initialGrid, setInitialGrid] = useState<BoardGrid>(
    () => initialSaved.current?.initialGrid || createEmptyGrid()
  );
  const [solutionGrid, setSolutionGrid] = useState<BoardGrid>(
    () => initialSaved.current?.solutionGrid || createEmptyGrid()
  );
  const [candidatesGrid, setCandidatesGrid] = useState<number[][][]>(
    () => initialSaved.current?.candidatesGrid || Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []))
  );
  const [selectedCell, setSelectedCell] = useState<CellCoord | null>({ row: 0, col: 0 });
  const [isNotesMode, setIsNotesMode] = useState<boolean>(false);
  const [history, setHistory] = useState<{ grid: BoardGrid; candidates: number[][][] }[]>([]);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(sounds.getMuted());

  // --- State: Timer & Mistakes ---
  const [timerSeconds, setTimerSeconds] = useState<number>(
    () => initialSaved.current?.timerSeconds || 0
  );
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [mistakes, setMistakes] = useState<number>(
    () => initialSaved.current?.mistakes || 0
  );
  const [maxMistakes] = useState<number>(3);
  const [hintsUsed, setHintsUsed] = useState<number>(
    () => initialSaved.current?.hintsUsed || 0
  );
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isGameWon, setIsGameWon] = useState<boolean>(false);

  // --- State: Calibration Profile ---
  const [profile, setProfile] = useState<ProficiencyProfile>(loadProfile());
  const [lastMmrDelta, setLastMmrDelta] = useState<number>(0);

  // --- State: Socratic Coach & Explanations ---
  const [currentHint, setCurrentHint] = useState<SocraticHintResponse | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState<boolean>(false);
  const [showBoardHighlights, setShowBoardHighlights] = useState<boolean>(true);
  const [temporaryHighlights, setTemporaryHighlights] = useState<
    { row: number; col: number; role: 'target' | 'peer' | 'conflict' | 'reference' | 'cause' }[]
  >([]);

  const [solutionData, setSolutionData] = useState<SolutionExplanationResponse | null>(null);
  const [isLoadingSolution, setIsLoadingSolution] = useState<boolean>(false);

  // --- State: Modals & Drawers ---
  const [isCalibrationOpen, setIsCalibrationOpen] = useState<boolean>(false);
  const [isSolutionDrawerOpen, setIsSolutionDrawerOpen] = useState<boolean>(false);
  const [isWinModalOpen, setIsWinModalOpen] = useState<boolean>(false);
  const [activeRightTab, setActiveRightTab] = useState<'socratic' | 'polymath'>('socratic');

  // --- Timer Interval ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isPaused && !isGameOver && !isGameWon) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused, isGameOver, isGameWon]);

  // --- Auto-persist game state to localStorage ---
  usePersistentGameState({
    grid,
    initialGrid,
    solutionGrid,
    candidatesGrid,
    timerSeconds,
    difficulty,
    mistakes,
    hintsUsed,
    isGameOver,
    isGameWon,
  });

  // --- Initialize or Reset Game ---
  const startNewGame = useCallback(
    async (diff: Difficulty = difficulty) => {
      clearSavedGameState();
      setIsPaused(false);
      setTimerSeconds(0);
      setMistakes(0);
      setHintsUsed(0);
      setIsGameOver(false);
      setIsGameWon(false);
      setIsWinModalOpen(false);
      setCurrentHint(null);
      setSolutionData(null);
      setTemporaryHighlights([]);
      setHistory([]);

      try {
        const res = await fetch('/api/puzzle/new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            difficulty: diff,
            mmr: profile.mmr,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setGrid(data.initial);
          setInitialGrid(data.initial);
          setSolutionGrid(data.solution);
          setCandidatesGrid(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => [])));
          return;
        }
      } catch (err) {
        console.warn('Network puzzle generation failed, using local generator:', err);
      }

      // Local fallback
      const targetClues =
        diff === 'adaptive' ? calculateTargetCluesForMMR(profile.mmr) : undefined;
      const local = generateSudoku(diff, targetClues);
      setGrid(local.initial);
      setInitialGrid(local.initial);
      setSolutionGrid(local.solution);
      setCandidatesGrid(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => [])));
    },
    [difficulty, profile.mmr]
  );

  // Load initial game on mount only if no valid saved game was found
  useEffect(() => {
    if (!initialSaved.current) {
      startNewGame();
    }
  }, []); // Run once on mount

  // --- Push Snapshot to Undo History ---
  const pushHistory = (newGrid: BoardGrid, newCandidates: number[][][]) => {
    setHistory((prev) => [
      ...prev.slice(-20),
      {
        grid: cloneGrid(grid),
        candidates: candidatesGrid.map((r) => r.map((c) => [...c])),
      },
    ]);
    setGrid(newGrid);
    setCandidatesGrid(newCandidates);
  };

  // --- Handle Undo ---
  const handleUndo = () => {
    if (history.length === 0 || isGameOver || isGameWon) return;
    sounds.playUndo();
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setGrid(last.grid);
    setCandidatesGrid(last.candidates);
  };

  // --- Auto-Fill Candidates ---
  const handleAutoCandidates = () => {
    sounds.playHintChime();
    const computed = getAllCandidates(grid);
    pushHistory(grid, computed);
  };

  // --- Handle Game Completion ---
  const handleGameEnd = (won: boolean) => {
    if (isGameOver || isGameWon) return;
    clearSavedGameState();
    if (won) {
      setIsGameWon(true);
      sounds.playVictory();
    } else {
      setIsGameOver(true);
      sounds.playError();
    }

    const { updatedProfile, deltaMMR } = recordGameResult(profile, {
      won,
      difficulty,
      timeTakenSec: timerSeconds,
      mistakes,
      hintsUsed,
    });

    setProfile(updatedProfile);
    setLastMmrDelta(deltaMMR);
    setIsWinModalOpen(true);
  };

  // --- Handle Input Number ---
  const handleInputNumber = (num: number) => {
    if (!selectedCell || isPaused || isGameOver || isGameWon) return;
    const { row, col } = selectedCell;

    // Cannot modify initial given clues
    if (initialGrid[row][col] > 0) return;

    if (isNotesMode) {
      // Toggle candidate
      sounds.playCandidateNote();
      const currentCands = candidatesGrid[row]?.[col] || [];
      const updatedCands = currentCands.includes(num)
        ? currentCands.filter((n) => n !== num)
        : [...currentCands, num].sort((a, b) => a - b);

      const nextCandidates = candidatesGrid.map((rArr, rIdx) =>
        rArr.map((cArr, cIdx) => (rIdx === row && cIdx === col ? updatedCands : cArr))
      );
      pushHistory(grid, nextCandidates);
      return;
    }

    // Direct cell value input
    const currentVal = grid[row][col];
    if (currentVal === num) return; // already set

    const nextGrid = cloneGrid(grid);
    nextGrid[row][col] = num;

    // Check if move matches known solution
    const isCorrect = solutionGrid[row]?.[col] === num;
    let newMistakes = mistakes;

    if (!isCorrect && num > 0) {
      sounds.playError();
      newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      if (newMistakes >= maxMistakes) {
        handleGameEnd(false);
      }
    } else {
      sounds.playNumberInput(num);
    }

    // Remove candidate marks for this number from peers
    const nextCandidates = candidatesGrid.map((rArr, rIdx) =>
      rArr.map((cArr, cIdx) => {
        if (rIdx === row && cIdx === col) return [];
        if (rIdx === row || cIdx === col || (Math.floor(rIdx / 3) === Math.floor(row / 3) && Math.floor(cIdx / 3) === Math.floor(col / 3))) {
          return cArr.filter((cand) => cand !== num);
        }
        return cArr;
      })
    );

    pushHistory(nextGrid, nextCandidates);

    // Check if board is fully solved
    if (isBoardSolved(nextGrid)) {
      handleGameEnd(true);
    }
  };

  // --- Handle Erase ---
  const handleErase = () => {
    if (!selectedCell || isPaused || isGameOver || isGameWon) return;
    const { row, col } = selectedCell;
    if (initialGrid[row][col] > 0) return;

    sounds.playErase();
    if (grid[row][col] > 0) {
      const nextGrid = cloneGrid(grid);
      nextGrid[row][col] = 0;
      pushHistory(nextGrid, candidatesGrid);
    } else {
      // Clear candidates
      const nextCandidates = candidatesGrid.map((rArr, rIdx) =>
        rArr.map((cArr, cIdx) => (rIdx === row && cIdx === col ? [] : cArr))
      );
      pushHistory(grid, nextCandidates);
    }
  };

  // --- Keyboard Shortcuts Listener ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key >= '1' && e.key <= '9') {
        handleInputNumber(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleErase();
      } else if (e.key === 'n' || e.key === 'N') {
        sounds.playCellSelect();
        setIsNotesMode((prev) => !prev);
      } else if (e.key === 'h' || e.key === 'H') {
        handleRequestHint();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        handleUndo();
      } else if (e.key === 'ArrowUp') {
        sounds.playCellSelect();
        setSelectedCell((prev) => (prev ? { row: Math.max(0, prev.row - 1), col: prev.col } : { row: 0, col: 0 }));
      } else if (e.key === 'ArrowDown') {
        sounds.playCellSelect();
        setSelectedCell((prev) => (prev ? { row: Math.min(8, prev.row + 1), col: prev.col } : { row: 0, col: 0 }));
      } else if (e.key === 'ArrowLeft') {
        sounds.playCellSelect();
        setSelectedCell((prev) => (prev ? { row: prev.row, col: Math.max(0, prev.col - 1) } : { row: 0, col: 0 }));
      } else if (e.key === 'ArrowRight') {
        sounds.playCellSelect();
        setSelectedCell((prev) => (prev ? { row: prev.row, col: Math.min(8, prev.col + 1) } : { row: 0, col: 0 }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // --- Feature 2: Socratic AI Logic Coach Hint ---
  const handleRequestHint = async (level = 1) => {
    if (isGameOver || isGameWon) return;
    sounds.playHintChime();
    setIsLoadingHint(true);
    setHintsUsed((prev) => prev + 1);

    try {
      const res = await fetch('/api/coach/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grid,
          initialGrid,
          selectedCell,
          hintLevel: level,
        }),
      });

      if (res.ok) {
        const hintData = await res.json();
        setCurrentHint(hintData);
        if (hintData.focusRegion?.row !== undefined && hintData.focusRegion?.col !== undefined) {
          setSelectedCell({
            row: hintData.focusRegion.row,
            col: hintData.focusRegion.col,
          });
        }
        return;
      }
    } catch (err) {
      console.warn('Network hint request failed, using algorithmic Socratic coach:', err);
    } finally {
      setIsLoadingHint(false);
    }

    // Local algorithmic Socratic coach fallback
    const localDeduction = findNextLogicalDeduction(grid);
    if (localDeduction) {
      const { targetCell, technique, explanation, guidingQuestions, highlightedCells } = localDeduction;
      setCurrentHint({
        techniqueName: technique,
        techniqueType: 'deduction',
        level,
        focusRegion: {
          row: targetCell.row,
          col: targetCell.col,
          description: `Row ${targetCell.row + 1}, Column ${targetCell.col + 1}`,
        },
        pedagogicalNudge:
          level === 1
            ? `Take a closer look at Row ${targetCell.row + 1}, Column ${targetCell.col + 1}. What constraints are imposed by its surrounding peers?`
            : `Notice how the "${technique}" method applies here. What numbers are already ruled out?`,
        guidingQuestions,
        techniqueDescription: explanation,
        highlightedCells: highlightedCells.map((h) => ({
          row: h.cell.row,
          col: h.cell.col,
          role: h.role,
        })),
        revealsDigit: false,
      });
      setSelectedCell(targetCell);
    }
  };

  // --- Socratic Chat API Handler ---
  const handleSendChatMessage = async (msg: string): Promise<string> => {
    try {
      const res = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          grid,
          selectedCell,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.reply;
      }
    } catch (err) {
      console.warn('Chat API error:', err);
    }

    // Fallback response
    if (selectedCell) {
      const cands = getCandidates(grid, selectedCell.row, selectedCell.col);
      return `For cell (R${selectedCell.row + 1}, C${selectedCell.col + 1}), consider the candidates [${cands.join(
        ', '
      )}]. What prevents the other numbers from appearing here?`;
    }
    return 'Look for the 3×3 box or row with the fewest remaining empty cells to uncover the next deduction.';
  };

  // --- Feature 3: Logical Step Breakdown (Explain Solution Logic) ---
  const handleExplainSolution = async () => {
    setIsSolutionDrawerOpen(true);
    if (solutionData && solutionData.steps.length > 0) return;

    setIsLoadingSolution(true);
    try {
      const res = await fetch('/api/coach/explain-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grid }),
      });

      if (res.ok) {
        const data = await res.json();
        setSolutionData(data);
        return;
      }
    } catch (err) {
      console.warn('Network solution breakdown error, using local deduction engine:', err);
    } finally {
      setIsLoadingSolution(false);
    }

    // Local fallback
    const steps = generateFullLogicalSteps(grid);
    const uniqueTechniques = Array.from(new Set(steps.map((s) => s.technique)));
    setSolutionData({
      steps,
      overallStrategy: `This position resolves through ${steps.length} sequential logical deductions using ${uniqueTechniques.slice(0, 3).join(', ')}.`,
      totalRemaining: steps.length,
      keyTechniquesUsed: uniqueTechniques,
    });
  };

  // Apply a single step from solution drawer onto the grid
  const handleApplyStepToGrid = (step: LogicStep) => {
    const nextGrid = cloneGrid(grid);
    nextGrid[step.cell.row][step.cell.col] = step.digit;
    pushHistory(nextGrid, candidatesGrid);
    setSelectedCell(step.cell);
  };

  // Highlight synchronization with solution drawer
  const handleSelectStepCell = useCallback(
    (cell: CellCoord, related: { cell: CellCoord; role: 'target' | 'peer' | 'cause' }[]) => {
      setSelectedCell(cell);
      setTemporaryHighlights([
        { row: cell.row, col: cell.col, role: 'target' },
        ...related.map((r) => ({ row: r.cell.row, col: r.cell.col, role: r.role })),
      ]);
    },
    []
  );

  // Compute active board highlights
  const conflicts = findConflicts(grid);
  const activeTutorHighlights = showBoardHighlights
    ? temporaryHighlights.length > 0
      ? temporaryHighlights
      : currentHint?.highlightedCells || []
    : [];

  return (
    <div className="relative min-h-screen w-full bg-[#07090e] text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Dynamic Ambient Glow Orbs */}
      <div className="ambient-glow-cyan top-10 -left-40" />
      <div className="ambient-glow-violet top-1/3 -right-40" />
      <div className="ambient-glow-emerald bottom-10 left-1/4" />

      {/* Main Top Header */}
      <GlassHeader
        difficulty={difficulty}
        onSelectDifficulty={(d) => {
          setDifficulty(d);
          startNewGame(d);
        }}
        timerSeconds={timerSeconds}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused((prev) => !prev)}
        mistakes={mistakes}
        maxMistakes={maxMistakes}
        onNewGame={() => startNewGame(difficulty)}
        onRestart={() => {
          clearSavedGameState();
          setGrid(cloneGrid(initialGrid));
          setCandidatesGrid(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => [])));
          setMistakes(0);
          setTimerSeconds(0);
        }}
        profile={profile}
        onOpenCalibration={() => setIsCalibrationOpen(true)}
        isSoundMuted={isSoundMuted}
        onToggleSound={() => setIsSoundMuted(sounds.toggleMute())}
        onOpenCuriosityLounge={() => {
          sounds.playCellSelect();
          setActiveRightTab('polymath');
        }}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-2 flex flex-col lg:flex-row gap-6 items-start justify-center">
        {/* Left Column: Difficulty Selector + Sudoku Grid + Tactile Glass Keypad */}
        <div className="w-full lg:w-[500px] flex flex-col items-center">
          {/* Difficulty Segmented Selector */}
          <DifficultySelector
            difficulty={difficulty}
            onSelectDifficulty={(d) => {
              setDifficulty(d);
              startNewGame(d);
            }}
            profile={profile}
            disabled={isPaused}
            onOpenCalibration={() => setIsCalibrationOpen(true)}
          />

          {/* 9x9 Sudoku Board */}
          <SudokuGrid
            grid={grid}
            initialGrid={initialGrid}
            candidatesGrid={candidatesGrid}
            selectedCell={selectedCell}
            onSelectCell={(cell) => setSelectedCell(cell)}
            conflicts={conflicts}
            tutorHighlights={activeTutorHighlights}
            isPaused={isPaused}
          />

          {/* Tactile Keypad */}
          <GlassKeypad
            onInputNumber={handleInputNumber}
            onErase={handleErase}
            onUndo={handleUndo}
            canUndo={history.length > 0}
            isNotesMode={isNotesMode}
            onToggleNotesMode={() => {
              sounds.playCellSelect();
              setIsNotesMode((prev) => !prev);
            }}
            onAutoCandidates={handleAutoCandidates}
            grid={grid}
            disabled={isPaused}
          />

          {/* Explain Solution Logic Button (Feature 3 Entry) */}
          <div className="w-full max-w-[500px] mt-4 px-2">
            <button
              onClick={handleExplainSolution}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl liquid-glass border border-indigo-400/30 text-indigo-200 hover:text-white hover:border-indigo-400/50 text-xs font-semibold liquid-glass-interactive shadow-lg group"
            >
              <BookOpen className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>Explain Solution Logic (Educational Breakdown)</span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            </button>
          </div>
        </div>

        {/* Right Column: Socratic Coach & History/Science Polymath Gemini Chatbot */}
        <div className="w-full lg:flex-1 max-w-[480px] lg:max-w-none flex flex-col gap-3">
          {/* Segmented Mode Selector */}
          <div className="inline-flex p-1 rounded-2xl liquid-glass border border-white/10 self-start">
            <button
              onClick={() => {
                sounds.playCellSelect();
                setActiveRightTab('socratic');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                activeRightTab === 'socratic'
                  ? 'bg-gradient-to-b from-white/20 to-white/5 text-white shadow-md border border-white/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Brain className={`w-3.5 h-3.5 ${activeRightTab === 'socratic' ? 'text-cyan-300' : 'text-white/50'}`} />
              <span>Socratic Coach</span>
            </button>

            <button
              onClick={() => {
                sounds.playCellSelect();
                setActiveRightTab('polymath');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                activeRightTab === 'polymath'
                  ? 'bg-gradient-to-b from-white/20 to-white/5 text-white shadow-md border border-white/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe className={`w-3.5 h-3.5 ${activeRightTab === 'polymath' ? 'text-purple-300' : 'text-purple-400/60'}`} />
              <span>History & Science Polymath</span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse ml-0.5" />
            </button>
          </div>

          {activeRightTab === 'socratic' ? (
            <SocraticCoachPanel
              currentHint={currentHint}
              isLoadingHint={isLoadingHint}
              onRequestHint={handleRequestHint}
              showBoardHighlights={showBoardHighlights}
              onToggleHighlights={() => setShowBoardHighlights((p) => !p)}
              onSelectCellTarget={(coord) => setSelectedCell(coord)}
              onSendChatMessage={handleSendChatMessage}
              disabled={isPaused}
            />
          ) : (
            <PolymathChatPanel />
          )}
        </div>
      </main>

      {/* Clean Unboxed Footer */}
      <footer className="w-full max-w-5xl mx-auto px-4 py-3 flex items-center justify-between text-[11px] text-white/40 border-t border-white/5 mt-4">
        <div>
          <span>Nebuku Logic Engine</span>
          <span className="mx-1.5">·</span>
          <span>Apple Liquid Glass Design</span>
        </div>
        <div>
          <span>Adaptive ELO: {profile.mmr}</span>
          <span className="mx-1.5">·</span>
          <span>Socratic AI Coach</span>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ProficiencyCalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        profile={profile}
        onUpdateProfile={(p) => setProfile(p)}
      />

      <SolutionLogicDrawer
        isOpen={isSolutionDrawerOpen}
        onClose={() => {
          setIsSolutionDrawerOpen(false);
          setTemporaryHighlights([]);
        }}
        solutionData={solutionData}
        isLoading={isLoadingSolution}
        onSelectStepCell={handleSelectStepCell}
        onApplyStep={handleApplyStepToGrid}
        onExplainRequested={handleExplainSolution}
      />

      <WinModal
        isOpen={isWinModalOpen}
        isVictory={isGameWon}
        timeSeconds={timerSeconds}
        mistakes={mistakes}
        hintsUsed={hintsUsed}
        difficulty={difficulty}
        mmrDelta={lastMmrDelta}
        newMMR={profile.mmr}
        newTier={profile.tier}
        onNewGame={() => startNewGame(difficulty)}
        onReviewLogic={() => {
          setIsWinModalOpen(false);
          handleExplainSolution();
        }}
        onClose={() => setIsWinModalOpen(false)}
      />
    </div>
  );
}
