import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  findNextLogicalDeduction,
  generateFullLogicalSteps,
  generateSudoku,
  getPrebuiltPuzzle,
  isValidMove,
  cloneGrid,
  getCandidates,
} from './src/utils/sudokuEngine.ts';
import { calculateTargetCluesForMMR } from './src/utils/calibrationEngine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const args = process.argv.slice(2);
const portArgIndex = args.indexOf('--port');
const portArg = portArgIndex !== -1 ? Number(args[portArgIndex + 1]) : null;
const PORT = portArg || Number(process.env.PORT) || 3000;

app.use(express.json());

// Health check endpoints for Cloud Run & container orchestrators
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Initialize Google GenAI client with required header
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

// 1. Generate New Puzzle
app.post('/api/puzzle/new', (req, res) => {
  try {
    const { difficulty = 'medium', mmr } = req.body;
    let targetClues: number | undefined;

    if (difficulty === 'adaptive' && typeof mmr === 'number') {
      targetClues = calculateTargetCluesForMMR(mmr);
    }

    const puzzle = generateSudoku(difficulty, targetClues);
    res.json({ ...puzzle, difficulty });
  } catch (error) {
    console.error('Error generating puzzle:', error);
    // Fallback to prebuilt
    const fallback = getPrebuiltPuzzle('medium');
    res.json({ ...fallback, difficulty: 'medium' });
  }
});

// 2. Socratic AI Logic Coach - Hint Endpoint
app.post('/api/coach/hint', async (req, res) => {
  try {
    const { grid, initialGrid, selectedCell, hintLevel = 1 } = req.body;

    if (!grid || !Array.isArray(grid)) {
      return res.status(400).json({ error: 'Valid grid array is required' });
    }

    // Step A: Algorithmic Grounding - Detect the exact next logical deduction
    const deduction = findNextLogicalDeduction(grid);

    if (!deduction) {
      return res.json({
        techniqueName: 'Full Inspection',
        techniqueType: 'scanning',
        level: hintLevel,
        focusRegion: { description: 'The grid appears to be fully solved or highly constrained.' },
        guidingQuestions: [
          'Double-check rows and columns for duplicate entries.',
          'Verify if all empty spaces have been properly filled.',
        ],
        pedagogicalNudge: 'Review completed sections to confirm mathematical consistency.',
        techniqueDescription: 'Cross-checking and verification.',
        highlightedCells: [],
        revealsDigit: false,
      });
    }

    const { targetCell, technique, explanation, guidingQuestions, highlightedCells } = deduction;
    const r = targetCell.row;
    const c = targetCell.col;
    const currentCandidates = getCandidates(grid, r, c);

    // If Gemini Flash is available, generate dynamic personalized Socratic coaching
    if (ai) {
      try {
        const prompt = `You are "Nebuku", a world-class Socratic Sudoku & Logic Master with a warm, encouraging pedagogical style.
Current board state analysis:
- Target cell of interest: Row ${r + 1}, Column ${c + 1} (1-indexed)
- Known active candidates for this cell: [${currentCandidates.join(', ')}]
- Grounded deduction technique: ${technique}
- Technical rule explanation: ${explanation}
- Student's requested hint level: ${hintLevel} (1 = subtle directional nudge, 2 = Socratic guiding questions and technique naming, 3 = deep candidate elimination reasoning)

STRICT RULE OF SOCRATIC COACHING:
NEVER state or reveal the actual number/digit that belongs in Row ${r + 1}, Column ${c + 1}! Doing so denies the student the breakthrough of self-discovery.
Instead:
- Level 1: Draw attention to the relevant region (e.g. Row ${r + 1} or Box containing cell R${r + 1}C${c + 1}).
- Level 2: Name the technique (${technique}) and pose 2-3 illuminating Socratic questions that guide their thought process.
- Level 3: Explain the elimination logic step-by-step (e.g., "Notice how the 3 numbers in the intersecting box eliminate options..."), leaving the final deduction to them.

Return ONLY a valid JSON object matching this schema:
{
  "techniqueName": "${technique}",
  "techniqueType": "deduction",
  "level": ${hintLevel},
  "focusRegion": {
    "row": ${r},
    "col": ${c},
    "description": "Short description of the area of focus"
  },
  "pedagogicalNudge": "A 1-2 sentence warm Socratic nudge for this hint level without naming the number",
  "guidingQuestions": ["Question 1?", "Question 2?", "Question 3?"],
  "techniqueDescription": "Concise 1-2 sentence explanation of how the ${technique} works in Sudoku logic",
  "revealsDigit": false
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          return res.json({
            ...parsed,
            highlightedCells: highlightedCells.map(h => ({
              row: h.cell.row,
              col: h.cell.col,
              role: h.role,
            })),
            revealsDigit: false,
          });
        }
      } catch (geminiError) {
        console.warn('Gemini Socratic hint failed, falling back to algorithmic response:', geminiError);
      }
    }

    // High-fidelity algorithmic fallback
    const nudgesByLevel: Record<number, string> = {
      1: `Shift your focus towards Row ${r + 1}, Column ${c + 1}. Examine the interplay between its row, column, and box.`,
      2: `Consider applying the "${technique}" method at Row ${r + 1}, Column ${c + 1}. Ask yourself what digits surrounding it have already claimed.`,
      3: `In Row ${r + 1}, Column ${c + 1}, observe that the intersecting peers eliminate almost every possibility. Work through the remaining candidate list.`,
    };

    res.json({
      techniqueName: technique,
      techniqueType: 'deduction',
      level: hintLevel,
      focusRegion: {
        row: r,
        col: c,
        description: `Row ${r + 1}, Column ${c + 1}`,
      },
      pedagogicalNudge: nudgesByLevel[hintLevel] || nudgesByLevel[1],
      guidingQuestions: guidingQuestions || [
        `What values are present in Row ${r + 1}?`,
        `What values are present in Column ${c + 1}?`,
        `Which candidates remain mathematically viable?`,
      ],
      techniqueDescription: explanation,
      highlightedCells: highlightedCells.map(h => ({
        row: h.cell.row,
        col: h.cell.col,
        role: h.role,
      })),
      revealsDigit: false,
    });
  } catch (error) {
    console.error('Error generating Socratic hint:', error);
    res.status(500).json({ error: 'Failed to generate Socratic hint' });
  }
});

// 3. Logical Step Breakdown - Explain Solution Logic
app.post('/api/coach/explain-solution', async (req, res) => {
  try {
    const { grid } = req.body;
    if (!grid || !Array.isArray(grid)) {
      return res.status(400).json({ error: 'Grid array required' });
    }

    const steps = generateFullLogicalSteps(grid);
    const uniqueTechniques = Array.from(new Set(steps.map(s => s.technique)));

    let overallStrategy = `This puzzle solution unfolds across ${steps.length} sequential logical deductions, primarily leveraging ${uniqueTechniques.slice(0, 3).join(', ')}.`;

    // Enrich overview with Gemini Flash if available
    if (ai && steps.length > 0) {
      try {
        const prompt = `As the Nebuku Logic Coach, summarize the educational journey of solving this Sudoku puzzle in 2-3 engaging, insightful sentences.
Total logical steps remaining: ${steps.length}
Key techniques involved: ${uniqueTechniques.join(', ')}
Early step sample: ${steps[0]?.technique} at Row ${steps[0]?.cell.row + 1}, Col ${steps[0]?.cell.col + 1}.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            temperature: 0.3,
          },
        });

        if (response.text) {
          overallStrategy = response.text.trim();
        }
      } catch (geminiError) {
        console.warn('Gemini solution summary error:', geminiError);
      }
    }

    res.json({
      steps,
      overallStrategy,
      totalRemaining: steps.length,
      keyTechniquesUsed: uniqueTechniques,
    });
  } catch (error) {
    console.error('Error explaining solution logic:', error);
    res.status(500).json({ error: 'Failed to compute logical solution steps' });
  }
});

// 4. Interactive Socratic Tutor Chat (Sudoku Logic)
app.post('/api/coach/chat', async (req, res) => {
  try {
    const { message, grid, selectedCell, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message string required' });
    }

    if (ai) {
      let cellContext = 'No cell currently selected.';
      if (selectedCell && typeof selectedCell.row === 'number' && typeof selectedCell.col === 'number') {
        const val = grid?.[selectedCell.row]?.[selectedCell.col] || 0;
        const cands = grid ? getCandidates(grid, selectedCell.row, selectedCell.col) : [];
        cellContext = `Selected Cell: Row ${selectedCell.row + 1}, Col ${selectedCell.col + 1}. Current Value: ${val === 0 ? 'Empty' : val}. Viable candidates: [${cands.join(', ')}].`;
      }

      const systemInstruction = `You are Nebuku, a thoughtful, insightful Socratic Sudoku & Mathematical Logic Coach.
Your goal is to nurture the learner's deductive reasoning powers.
Rules:
1. Always maintain a calm, encouraging, Apple-clean aesthetic tone.
2. Ask leading questions rather than simply solving the problem for them.
3. If they ask "Can 7 go in R2C3?", explain the reason why it can or cannot (e.g. "Take a look at Row 2 or Box 1—does another 7 already hold court there?").
4. Keep replies concise and impactful (2-4 sentences max). Never deliver walls of text.`;

      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: `Context: ${cellContext}\nUser asks: "${message}"`,
            },
          ],
        },
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.4,
        },
      });

      const reply = response.text || 'Consider what possibilities remain open in the surrounding row and box.';
      return res.json({ reply });
    }

    // Fallback if AI key is pending
    res.json({
      reply: 'To discover the path forward, examine the empty cell with the fewest candidates. Which surrounding row or box eliminates the most options?',
    });
  } catch (error) {
    console.error('Error in coach chat:', error);
    res.status(500).json({ error: 'Coach is temporarily reflecting. Please ask again.' });
  }
});

// 5. Multi-turn Polymath Chatbot: Educational Fun Facts from World History to Science
app.post('/api/chat/polymath', async (req, res) => {
  try {
    const { message, history = [], topic = 'general' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message string required' });
    }

    const systemInstruction = `You are "Nebuku Polymath", an extraordinary and enthusiastic educational AI companion dedicated to sharing astonishing educational fun facts across World History and Science.

Primary Purpose:
Enlighten, fascinate, and educate learners by uncovering delightful, little-known fun facts and profound connections spanning:
- World History: Ancient civilisations (Sumer, Egypt, Indus Valley, Maya, Rome, Song Dynasty), the Islamic Golden Age, Renaissance inventors, Age of Discovery, Silk Road cultural cross-pollination, and modern historical moments.
- Sciences: Quantum mechanics, black holes, astrophysics, genetics, CRISPR, deep-sea biology, neuroscience, plate tectonics, and organic chemistry.
- History of Science & Mathematics: How Archimedes, Hypatia, Al-Khwarizmi, Ada Lovelace, Emmy Noether, Ramanujan, and Alan Turing transformed human thought.

Tone & Style:
- Open with a fascinating, punchy "Did you know?" hook or engaging historical/scientific fun fact.
- Maintain a warm, erudite, and curious voice.
- Keep answers rich in educational depth yet scannable (crisp paragraphs, vivid analogies).
- Close with 1 captivating follow-up question or related curiosity to inspire the student to explore further.
- Remember and build upon previous turns in this conversation.`;

    if (ai) {
      try {
        // Map previous turns into SDK contents format
        const contents = [];

        for (const item of history) {
          if (item.text && (item.role === 'user' || item.role === 'model')) {
            contents.push({
              role: item.role,
              parts: [{ text: item.text }],
            });
          }
        }

        // Append current user message
        contents.push({
          role: 'user',
          parts: [{ text: message }],
        });

        let response;
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
        } catch (firstErr) {
          console.warn('Retrying with gemini-3.1-flash-lite:', firstErr);
          response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });
        }

        const reply = response.text;
        if (reply) {
          return res.json({ reply });
        }
      } catch (geminiErr) {
        console.error('Gemini Polymath generation error:', geminiErr);
      }
    }

    // High-fidelity fallback if key is not attached or rate-limited
    const fallbackFacts: Record<string, string> = {
      history: "Did you know? In ancient Rome, dentists used gold wire to secure replacement teeth as early as 500 BCE! The Etruscans were renowned masters of dental bridge work.",
      science: "Did you know? A teaspoon of a neutron star would weigh about 6 billion tons on Earth—equivalent to the weight of Mount Everest compressed into a thimble!",
      general: "Did you know? Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid of Giza! The Great Pyramid was built around 2560 BCE, while Cleopatra ruled around 30 BCE.",
    };

    res.json({
      reply: fallbackFacts[topic] || fallbackFacts.general,
    });
  } catch (error) {
    console.error('Error in polymath chat handler:', error);
    res.status(500).json({ error: 'Nebuku Polymath is reviewing the archives. Please try again shortly.' });
  }
});

// 6. Fast Educational Fun Fact of the Day
app.get('/api/polymath/random-fact', async (req, res) => {
  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: 'Provide one single, mind-blowing educational fun fact that bridges World History and Science in 2 sentences max.',
        config: {
          temperature: 0.8,
        },
      });
      if (response.text) {
        return res.json({ fact: response.text.trim() });
      }
    }
    res.json({
      fact: "In 1859, the Carrington Event solar superstorm caused telegraph systems worldwide to produce sparks and operate even with batteries disconnected—a historic preview of space weather science!",
    });
  } catch (err) {
    res.json({
      fact: "The silicon in your computer chip and the glass in your window was once ancient quartz sand, forged from ancient geological heat and pressure millions of years ago.",
    });
  }
});

// Mount Vite or static server
const distIndexPath = path.join(__dirname, 'dist', 'index.html');
const isProduction =
  process.env.NODE_ENV === 'production' ||
  (process.env.NODE_ENV !== 'development' && fs.existsSync(distIndexPath));

if (isProduction) {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(distIndexPath);
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Nebuku Logic Server listening on http://0.0.0.0:${PORT}`);
});
