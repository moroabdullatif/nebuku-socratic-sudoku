# Nebuku: Liquid Logic & Socratic Sudoku Coach 🧠✨

> *Turn idle screen time into active, mind-expanding brain exercise.*

**Nebuku** is an Apple Liquid Glass-styled educational logic platform that transforms standard Sudoku into an interactive Socratic learning experience. Designed to combat doomscrolling and passive consumption, it pairs a modern, tactile aesthetic with an intelligent AI tutor that teaches users *how* to think, deduce, and solve problems step-by-step rather than just giving away answers.

---

## 🌟 Key Features

* **Socratic AI Logic Coach:** Powered by Gemini Flash, the built-in tutor analyzes your current board state. Instead of spoiling the puzzle by revealing digits, it asks guiding questions and explains core deductive techniques (such as *Naked Singles*, *Hidden Pairs*, and *Intersection Removal*).
* **Step-by-Step Educational Breakdown:** The "Explain Solution Logic" mode breaks down remaining empty cells into a written, algorithmic logical deduction path so players can study the reasoning behind complex moves.
* **Adaptive ELO & Skill Calibration:** Features an adaptive Matchmaking Rating (MMR) system calibrated from Novice to Grandmaster that dynamically adjusts puzzle difficulty based on player performance.
* **Nebuku Polymath:** An integrated curiosity lounge where players can learn bite-sized educational facts across World History, Quantum Physics, and Mathematical Foundations.

---

## 🛠️ Tech Stack

* **Frontend:** React, Tailwind CSS (custom glassmorphic styling, translucent backdrop blurs, responsive mobile-first touch controls).
* **Backend Runtime:** Node.js server runtime hosted on Google Cloud Run.
* **AI & Logic Integration:** Google AI Studio, Gemini Flash API.
* **Mathematical Engine:** Pure TypeScript Sudoku engine for deterministic candidate tracking across $9 \times 9$ grids (81 cells, divided into nine $3 \times 3$ sub-grids) to calculate board entropy in real time.
* **Build Tool:** Vite.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your local machine:
* [Node.js](https://nodejs.org/) (v18+ recommended)
* npm or yarn

### Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/moroabdullatif/nebuku-socratic-sudoku.git](https://github.com/moroabdullatif/nebuku-socratic-sudoku.git)
   cd nebuku-socratic-sudoku
