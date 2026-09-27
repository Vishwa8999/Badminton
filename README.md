# 🏆 8-Player Random Team Tournament Generator

A modern, responsive web application for generating and running an **8-player, 2-player-per-team, single-elimination tournament** with randomized pairings and live bracket tracking.

Built with **React**, **TypeScript**, and **Vite**, optimized for **Vercel** deployment.

---

## ⚡ Features

- **8-Player Input Validation**: Ensures exactly 8 non-empty, unique player names with instant validation and error highlighting.
- **Unbiased Randomization**: Uses the Fisher-Yates shuffle algorithm to:
  1. Shuffle 8 players into 4 distinct 2-player teams (no duplicate players).
  2. Shuffle the 4 teams into 2 randomized semifinal matches.
- **Visual Tournament Bracket**:
  - **Round 1 (Semifinals)**: Match 1 and Match 2.
  - **Round 2 (Championship Final)**: Automatically unlocked and populated with the semifinal winners.
  - **Champion**: Visually celebrated with animated confetti and trophy banner.
- **Single-Elimination Logic**:
  - Selecting a winner marks the team as winner and dims/eliminates the opposing team.
  - Advancements to the final occur automatically.
- **Reshuffle & Reset**:
  - **Reshuffle Teams**: Keeps the same 8 players, generating new random teams and brackets.
  - **New Tournament**: Clears the bracket and returns to player input.
- **Preset Quick-Loads**: Instant 1-click test rosters (Letters A–H, Esports Stars, Football Legends, Casual Friends).
- **Persistent State**: Automatically remembers active tournament and players via `localStorage`.

---

## 🚀 Deploy to Vercel (Step-by-Step)

### Option 1: Direct from GitHub (Recommended)
1. Push this repository to your GitHub account (or export from AI Studio).
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Vercel will automatically detect:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**. Your tournament generator will be live in seconds!

### Option 2: Using the Vercel CLI
```bash
npm install -g vercel
vercel
```

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start the local Vite development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview the production build locally
npm run preview
```
