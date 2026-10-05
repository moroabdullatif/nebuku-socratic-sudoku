import type { BoardGrid, CellCoord, Difficulty, LogicalDeduction, LogicStep } from '../types/sudoku.ts';

export function createEmptyGrid(): BoardGrid {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

export function cloneGrid(grid: BoardGrid): BoardGrid {
  return grid.map(row => [...row]);
}

export function getBoxIndex(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

export function getBoxBounds(boxIndex: number): { startRow: number; endRow: number; startCol: number; endCol: number } {
  const startRow = Math.floor(boxIndex / 3) * 3;
  const startCol = (boxIndex % 3) * 3;
  return {
    startRow,
    endRow: startRow + 2,
    startCol,
    endCol: startCol + 2,
  };
}

export function getPeers(row: number, col: number): CellCoord[] {
  const peers: CellCoord[] = [];
  const seen = new Set<string>();

  // Row peers
  for (let c = 0; c < 9; c++) {
    if (c !== col) {
      const key = `${row},${c}`;
      if (!seen.has(key)) {
        seen.add(key);
        peers.push({ row, col: c });
      }
    }
  }

  // Column peers
  for (let r = 0; r < 9; r++) {
    if (r !== row) {
      const key = `${r},${col}`;
      if (!seen.has(key)) {
        seen.add(key);
        peers.push({ row: r, col });
      }
    }
  }

  // Box peers
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      if (r !== row || c !== col) {
        const key = `${r},${c}`;
        if (!seen.has(key)) {
          seen.add(key);
          peers.push({ row: r, col: c });
        }
      }
    }
  }

  return peers;
}

export function getCandidates(grid: BoardGrid, row: number, col: number): number[] {
  if (grid[row][col] !== 0) return [];
  const used = new Set<number>();

  for (let c = 0; c < 9; c++) {
    if (grid[row][c] > 0) used.add(grid[row][c]);
  }
  for (let r = 0; r < 9; r++) {
    if (grid[r][col] > 0) used.add(grid[r][col]);
  }

  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      if (grid[r][c] > 0) used.add(grid[r][c]);
    }
  }

  const result: number[] = [];
  for (let num = 1; num <= 9; num++) {
    if (!used.has(num)) result.push(num);
  }
  return result;
}

export function getAllCandidates(grid: BoardGrid): number[][][] {
  const candidates: number[][][] = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => [])
  );
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        candidates[r][c] = getCandidates(grid, r, c);
      }
    }
  }
  return candidates;
}

export function isValidMove(grid: BoardGrid, row: number, col: number, num: number): boolean {
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c] === num) return false;
  }
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col] === num) return false;
  }
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      if ((r !== row || c !== col) && grid[r][c] === num) return false;
    }
  }
  return true;
}

export function findConflicts(grid: BoardGrid): { row: number; col: number }[] {
  const conflicts = new Set<string>();

  // Check rows
  for (let r = 0; r < 9; r++) {
    const map = new Map<number, number[]>();
    for (let c = 0; c < 9; c++) {
      const val = grid[r][c];
      if (val > 0) {
        if (!map.has(val)) map.set(val, []);
        map.get(val)!.push(c);
      }
    }
    for (const cols of map.values()) {
      if (cols.length > 1) {
        cols.forEach(c => conflicts.add(`${r},${c}`));
      }
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const map = new Map<number, number[]>();
    for (let r = 0; r < 9; r++) {
      const val = grid[r][c];
      if (val > 0) {
        if (!map.has(val)) map.set(val, []);
        map.get(val)!.push(r);
      }
    }
    for (const rows of map.values()) {
      if (rows.length > 1) {
        rows.forEach(r => conflicts.add(`${r},${c}`));
      }
    }
  }

  // Check 3x3 boxes
  for (let b = 0; b < 9; b++) {
    const bounds = getBoxBounds(b);
    const map = new Map<number, CellCoord[]>();
    for (let r = bounds.startRow; r <= bounds.endRow; r++) {
      for (let c = bounds.startCol; c <= bounds.endCol; c++) {
        const val = grid[r][c];
        if (val > 0) {
          if (!map.has(val)) map.set(val, []);
          map.get(val)!.push({ row: r, col: c });
        }
      }
    }
    for (const cells of map.values()) {
      if (cells.length > 1) {
        cells.forEach(coord => conflicts.add(`${coord.row},${coord.col}`));
      }
    }
  }

  return Array.from(conflicts).map(key => {
    const [r, c] = key.split(',').map(Number);
    return { row: r, col: c };
  });
}

export function isBoardSolved(grid: BoardGrid): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) return false;
    }
  }
  return findConflicts(grid).length === 0;
}

// Backtracking solver
export function solveSudoku(grid: BoardGrid): BoardGrid | null {
  const copy = cloneGrid(grid);

  function backtrack(): boolean {
    let minCandidates = 10;
    let bestCell: CellCoord | null = null;
    let bestList: number[] = [];

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (copy[r][c] === 0) {
          const candidates = getCandidates(copy, r, c);
          if (candidates.length === 0) return false; // Dead end
          if (candidates.length < minCandidates) {
            minCandidates = candidates.length;
            bestCell = { row: r, col: c };
            bestList = candidates;
            if (minCandidates === 1) break;
          }
        }
      }
      if (minCandidates === 1) break;
    }

    if (!bestCell) return true; // Solved

    for (const num of bestList) {
      copy[bestCell.row][bestCell.col] = num;
      if (backtrack()) return true;
      copy[bestCell.row][bestCell.col] = 0;
    }

    return false;
  }

  return backtrack() ? copy : null;
}

// Count solutions up to 2 (to verify uniqueness)
export function countSolutions(grid: BoardGrid, limit = 2): number {
  const copy = cloneGrid(grid);
  let count = 0;

  function backtrack(): boolean {
    let minCandidates = 10;
    let bestCell: CellCoord | null = null;
    let bestList: number[] = [];

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (copy[r][c] === 0) {
          const candidates = getCandidates(copy, r, c);
          if (candidates.length === 0) return false;
          if (candidates.length < minCandidates) {
            minCandidates = candidates.length;
            bestCell = { row: r, col: c };
            bestList = candidates;
            if (minCandidates === 1) break;
          }
        }
      }
      if (minCandidates === 1) break;
    }

    if (!bestCell) {
      count++;
      return count >= limit;
    }

    for (const num of bestList) {
      copy[bestCell.row][bestCell.col] = num;
      if (backtrack()) return true;
      copy[bestCell.row][bestCell.col] = 0;
    }

    return false;
  }

  backtrack();
  return count;
}

// Detect next logical deduction (Naked Single, Hidden Single, Box-Line, Pairs)
export function findNextLogicalDeduction(grid: BoardGrid): LogicalDeduction | null {
  const allCands = getAllCandidates(grid);

  // 1. Check for Naked Singles (cell with only 1 possible candidate)
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0 && allCands[r][c].length === 1) {
        const digit = allCands[r][c][0];
        const peers = getPeers(r, c);
        const eliminatorCells: CellCoord[] = [];
        peers.forEach(p => {
          if (grid[p.row][p.col] > 0) eliminatorCells.push(p);
        });

        return {
          technique: 'Naked Single',
          targetCell: { row: r, col: c },
          suggestedDigit: digit,
          difficultyTier: 'beginner',
          explanation: `In cell Row ${r + 1}, Column ${c + 1}, looking at its row, column, and 3×3 box, 8 of the 9 digits are already occupied by surrounding numbers. Only one valid candidate remains.`,
          guidingQuestions: [
            `Look at cell at Row ${r + 1}, Column ${c + 1}. What numbers are already visible in this row and column?`,
            `Check the 3×3 box enclosing Row ${r + 1}, Column ${c + 1}. Which digits are eliminated?`,
            `If numbers 1 through 9 must exist uniquely, how many possibilities are left for this single cell?`,
          ],
          highlightedCells: [
            { cell: { row: r, col: c }, role: 'target', label: 'Candidate Solitary' },
            ...eliminatorCells.slice(0, 8).map(p => ({
              cell: p,
              role: 'peer' as const,
              label: `${grid[p.row][p.col]} eliminates`,
            })),
          ],
        };
      }
    }
  }

  // 2. Check for Hidden Singles in 3x3 Boxes
  for (let b = 0; b < 9; b++) {
    const bounds = getBoxBounds(b);
    for (let digit = 1; digit <= 9; digit++) {
      // Check if box already has this digit
      let boxHasDigit = false;
      for (let r = bounds.startRow; r <= bounds.endRow; r++) {
        for (let c = bounds.startCol; c <= bounds.endCol; c++) {
          if (grid[r][c] === digit) {
            boxHasDigit = true;
            break;
          }
        }
        if (boxHasDigit) break;
      }
      if (boxHasDigit) continue;

      // Find all empty cells in box where digit can go
      const eligibleCells: CellCoord[] = [];
      for (let r = bounds.startRow; r <= bounds.endRow; r++) {
        for (let c = bounds.startCol; c <= bounds.endCol; c++) {
          if (grid[r][c] === 0 && allCands[r][c].includes(digit)) {
            eligibleCells.push({ row: r, col: c });
          }
        }
      }

      if (eligibleCells.length === 1) {
        const target = eligibleCells[0];
        // Find cells in rows/cols that eliminate other spots in this box
        const peerCauses: CellCoord[] = [];
        for (let c = 0; c < 9; c++) {
          if (c < bounds.startCol || c > bounds.endCol) {
            for (let r = bounds.startRow; r <= bounds.endRow; r++) {
              if (grid[r][c] === digit) peerCauses.push({ row: r, col: c });
            }
          }
        }
        for (let r = 0; r < 9; r++) {
          if (r < bounds.startRow || r > bounds.endRow) {
            for (let c = bounds.startCol; c <= bounds.endCol; c++) {
              if (grid[r][c] === digit) peerCauses.push({ row: r, col: c });
            }
          }
        }

        return {
          technique: 'Hidden Single in Box',
          targetCell: target,
          suggestedDigit: digit,
          difficultyTier: 'beginner',
          explanation: `In 3×3 Box ${b + 1} (Rows ${bounds.startRow + 1}–${bounds.endRow + 1}, Columns ${bounds.startCol + 1}–${bounds.endCol + 1}), there is only one empty square where a certain missing number can legally fit without clashing with intersecting rows and columns.`,
          guidingQuestions: [
            `Examine 3×3 Box ${b + 1}. Which digits are currently missing from this box?`,
            `Look at rows and columns intersecting Box ${b + 1}. Are there any numbers slicing through and blocking empty cells?`,
            `Is there a specific number that can only be placed into exactly one open cell in this box?`,
          ],
          highlightedCells: [
            { cell: target, role: 'target', label: 'Only spot in Box' },
            ...peerCauses.map(p => ({ cell: p, role: 'conflict' as const, label: 'Blocks row/col' })),
          ],
        };
      }
    }
  }

  // 3. Check for Hidden Singles in Rows
  for (let r = 0; r < 9; r++) {
    for (let digit = 1; digit <= 9; digit++) {
      if (grid[r].includes(digit)) continue;
      const eligibleCols: number[] = [];
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0 && allCands[r][c].includes(digit)) {
          eligibleCols.push(c);
        }
      }
      if (eligibleCols.length === 1) {
        const target = { row: r, col: eligibleCols[0] };
        return {
          technique: 'Hidden Single in Row',
          targetCell: target,
          suggestedDigit: digit,
          difficultyTier: 'intermediate',
          explanation: `Scan Row ${r + 1} from left to right. One of the missing digits can only fit into a single cell, because other columns or boxes block it elsewhere along the row.`,
          guidingQuestions: [
            `What numbers are missing along Row ${r + 1}?`,
            `Check the columns that intersect the empty squares of Row ${r + 1}. Which column eliminates possibilities?`,
            `Can you find a digit that has only one legal sanctuary left in Row ${r + 1}?`,
          ],
          highlightedCells: [
            { cell: target, role: 'target', label: 'Forced in Row' },
          ],
        };
      }
    }
  }

  // 4. Check for Hidden Singles in Columns
  for (let c = 0; c < 9; c++) {
    for (let digit = 1; digit <= 9; digit++) {
      let colHasDigit = false;
      for (let r = 0; r < 9; r++) {
        if (grid[r][c] === digit) {
          colHasDigit = true;
          break;
        }
      }
      if (colHasDigit) continue;

      const eligibleRows: number[] = [];
      for (let r = 0; r < 9; r++) {
        if (grid[r][c] === 0 && allCands[r][c].includes(digit)) {
          eligibleRows.push(r);
        }
      }

      if (eligibleRows.length === 1) {
        const target = { row: eligibleRows[0], col: c };
        return {
          technique: 'Hidden Single in Column',
          targetCell: target,
          suggestedDigit: digit,
          difficultyTier: 'intermediate',
          explanation: `In Column ${c + 1}, scanning from top to bottom reveals that a specific digit is restricted to just one cell.`,
          guidingQuestions: [
            `What values are needed to complete Column ${c + 1}?`,
            `Inspect the intersecting horizontal rows. How do they eliminate spots for these digits?`,
            `Which cell in Column ${c + 1} is the only one capable of receiving that digit?`,
          ],
          highlightedCells: [
            { cell: target, role: 'target', label: 'Forced in Column' },
          ],
        };
      }
    }
  }

  // 5. Fallback: Cell with fewest candidates (Pointing out optimal next inspection)
  let minCands = 10;
  let fallbackCell: CellCoord | null = null;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0 && allCands[r][c].length > 0 && allCands[r][c].length < minCands) {
        minCands = allCands[r][c].length;
        fallbackCell = { row: r, col: c };
      }
    }
  }

  if (fallbackCell) {
    const r = fallbackCell.row;
    const c = fallbackCell.col;
    const cands = allCands[r][c];
    return {
      technique: 'Constrained Cell Analysis',
      targetCell: fallbackCell,
      difficultyTier: 'advanced',
      explanation: `Cell Row ${r + 1}, Column ${c + 1} is strongly constrained with only ${cands.length} potential candidates. Analyzing its peer interactions will narrow it down.`,
      guidingQuestions: [
        `Focus on Row ${r + 1}, Column ${c + 1}. What few candidates remain possible here?`,
        `Look at how this cell's box and column relate to adjacent regions.`,
        `Can you test eliminating one of the candidates through a row-box intersection?`,
      ],
      highlightedCells: [
        { cell: fallbackCell, role: 'target', label: `${cands.length} candidates` },
      ],
    };
  }

  return null;
}

// Generate complete step-by-step logic breakdown to solve the remaining puzzle
export function generateFullLogicalSteps(grid: BoardGrid): LogicStep[] {
  const workingGrid = cloneGrid(grid);
  const steps: LogicStep[] = [];
  let stepIndex = 1;
  const maxSteps = 81;

  while (stepIndex <= maxSteps) {
    const deduction = findNextLogicalDeduction(workingGrid);
    if (!deduction || !deduction.suggestedDigit) {
      // If pure logical rule solver gets stuck or puzzle is solved, check if solved
      if (isBoardSolved(workingGrid)) break;
      // Solve via backtracking to get remaining digits
      const solved = solveSudoku(workingGrid);
      if (!solved) break;

      // Find first empty cell
      let foundEmpty = false;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (workingGrid[r][c] === 0) {
            const digit = solved[r][c];
            steps.push({
              stepIndex,
              cell: { row: r, col: c },
              digit,
              technique: 'Deductive Elimination',
              explanation: `By cross-referencing candidate sets across Row ${r + 1} and Column ${c + 1}, ${digit} is uniquely deduced.`,
              whyValid: `Row ${r + 1}, Col ${c + 1}, and Box ${getBoxIndex(r, c) + 1} accommodate ${digit} without contradiction.`,
              involvedCells: [{ cell: { row: r, col: c }, role: 'target' }],
            });
            workingGrid[r][c] = digit;
            stepIndex++;
            foundEmpty = true;
            break;
          }
        }
        if (foundEmpty) break;
      }
      if (!foundEmpty) break;
      continue;
    }

    const { targetCell, suggestedDigit, technique, explanation } = deduction;
    workingGrid[targetCell.row][targetCell.col] = suggestedDigit;

    steps.push({
      stepIndex,
      cell: targetCell,
      digit: suggestedDigit,
      technique,
      explanation,
      whyValid: `Placed ${suggestedDigit} at Row ${targetCell.row + 1}, Col ${targetCell.col + 1} via ${technique}.`,
      involvedCells: deduction.highlightedCells.map(h => ({
        cell: h.cell,
        role: h.role === 'target' ? 'target' : 'peer',
      })),
    });

    stepIndex++;
    if (isBoardSolved(workingGrid)) break;
  }

  return steps;
}

// Generate new random valid Sudoku board
export function generateSudoku(difficulty: Difficulty, targetClues?: number): { initial: BoardGrid; solution: BoardGrid } {
  // 1. Generate full valid board
  const fullBoard = createEmptyGrid();

  function fillDiagonalBoxes(): void {
    for (let b = 0; b < 9; b += 4) { // Boxes 0, 4, 8
      const bounds = getBoxBounds(b);
      const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
      let idx = 0;
      for (let r = bounds.startRow; r <= bounds.endRow; r++) {
        for (let c = bounds.startCol; c <= bounds.endCol; c++) {
          fullBoard[r][c] = nums[idx++];
        }
      }
    }
  }

  fillDiagonalBoxes();
  const solved = solveSudoku(fullBoard);
  if (!solved) {
    // Fallback to pre-built seed if random fill fails
    return getPrebuiltPuzzle(difficulty);
  }

  // 2. Remove clues according to difficulty
  let cluesToKeep = 36;
  if (targetClues) {
    cluesToKeep = targetClues;
  } else {
    switch (difficulty) {
      case 'easy':
        cluesToKeep = 38;
        break;
      case 'medium':
        cluesToKeep = 30;
        break;
      case 'hard':
        cluesToKeep = 25;
        break;
      case 'adaptive':
        cluesToKeep = 32;
        break;
    }
  }

  const puzzle = cloneGrid(solved);
  const cellPositions: CellCoord[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      cellPositions.push({ row: r, col: c });
    }
  }
  cellPositions.sort(() => Math.random() - 0.5);

  let cluesRemoved = 0;
  const targetRemovals = 81 - cluesToKeep;

  for (const pos of cellPositions) {
    if (cluesRemoved >= targetRemovals) break;
    const temp = puzzle[pos.row][pos.col];
    puzzle[pos.row][pos.col] = 0;

    // Check if puzzle still has exactly 1 unique solution
    if (countSolutions(puzzle, 2) !== 1) {
      // Revert if multiple solutions
      puzzle[pos.row][pos.col] = temp;
    } else {
      cluesRemoved++;
    }
  }

  return {
    initial: puzzle,
    solution: solved,
  };
}

// Curated instant-load fallback puzzles
export function getPrebuiltPuzzle(difficulty: Difficulty): { initial: BoardGrid; solution: BoardGrid } {
  // Classic verified puzzles
  const easyInitial: BoardGrid = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ];

  const mediumInitial: BoardGrid = [
    [0, 0, 0, 6, 0, 0, 4, 0, 0],
    [7, 0, 0, 0, 0, 3, 6, 0, 0],
    [0, 0, 0, 0, 9, 1, 0, 8, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 5, 0, 1, 8, 0, 0, 0, 3],
    [0, 0, 0, 3, 0, 6, 0, 4, 5],
    [0, 4, 0, 2, 0, 0, 0, 6, 0],
    [9, 0, 3, 0, 0, 0, 0, 0, 0],
    [0, 2, 0, 0, 0, 0, 1, 0, 0],
  ];

  const hardInitial: BoardGrid = [
    [0, 2, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 6, 0, 0, 0, 0, 3],
    [0, 7, 4, 0, 8, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 0, 0, 2],
    [0, 8, 0, 0, 4, 0, 0, 1, 0],
    [6, 0, 0, 5, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 7, 8, 0],
    [5, 0, 0, 0, 0, 9, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 4, 0],
  ];

  let selected = easyInitial;
  if (difficulty === 'medium') selected = mediumInitial;
  if (difficulty === 'hard') selected = hardInitial;

  const sol = solveSudoku(selected);
  return {
    initial: selected,
    solution: sol || selected,
  };
}
